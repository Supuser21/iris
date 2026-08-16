import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth/session";
import { getOwnedJob } from "@/lib/construction";
import { db } from "@/lib/db";
import { jobDocuments } from "@/lib/db/schema";
import { ensureDb } from "@/lib/init";
import { saveOrgMemoryFromSource } from "@/lib/integrations";
import { PDFParse } from "pdf-parse";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const job = await getOwnedJob(id, session.userId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const { title, content, source, fileName, mimeType } = contentType.includes(
    "multipart/form-data"
  )
    ? await readMultipartDocument(req)
    : await readJsonDocument(req);
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const idValue = nanoid();
  await db.insert(jobDocuments).values({
    id: idValue,
    jobId: job.id,
    title: title.trim(),
    content: content.trim(),
    source:
      source === "award" ||
      source === "transcript" ||
      source === "pdf" ||
      source === "image"
        ? source
        : "note",
    fileName,
    mimeType,
    createdAt: new Date(),
  });

  await saveOrgMemoryFromSource({
    orgId: job.orgId,
    jobId: job.id,
    sourceType:
      source === "award"
        ? "job_doc"
        : source === "pdf" || source === "image"
          ? "job_doc"
        : source === "transcript"
          ? "meeting_transcript"
          : "manual_note",
    title: title.trim(),
    content: content.trim(),
    tags: source === "award" ? "award" : source === "transcript" ? "transcript" : "note",
  });

  return NextResponse.json({ ok: true, id: idValue }, { status: 201 });
}

async function readJsonDocument(req: Request) {
  const { title, content, source } = await req.json();
  return {
    title,
    content,
    source,
    fileName: null as string | null,
    mimeType: null as string | null,
  };
}

async function readMultipartDocument(req: Request) {
  const form = await req.formData();
  const rawTitle = form.get("title");
  const rawSource = form.get("source");
  const file = form.get("file");

  if (!(file instanceof File)) {
    return {
      title: typeof rawTitle === "string" ? rawTitle : "",
      content: "",
      source: typeof rawSource === "string" ? rawSource : "note",
      fileName: null,
      mimeType: null,
    };
  }

  const title =
    typeof rawTitle === "string" && rawTitle.trim()
      ? rawTitle.trim()
      : file.name;
  const mimeType = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return {
      title,
      content:
        parsed.text.trim() ||
        `Uploaded PDF ${file.name}. Iris could not extract text from this file.`,
      source: "pdf",
      fileName: file.name,
      mimeType,
    };
  }

  return {
    title,
    content: `Uploaded ${mimeType.startsWith("image/") ? "image" : "file"} ${file.name}. Add notes here so Iris can use it in job context.`,
    source: mimeType.startsWith("image/") ? "image" : "note",
    fileName: file.name,
    mimeType,
  };
}
