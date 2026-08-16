import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth/session";
import { getOwnedJob } from "@/lib/construction";
import { db } from "@/lib/db";
import { jobDocuments } from "@/lib/db/schema";
import { ensureDb } from "@/lib/init";
import { saveOrgMemoryFromSource } from "@/lib/integrations";

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

  const { title, content, source } = await req.json();
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
      source === "award" || source === "transcript" ? source : "note",
    createdAt: new Date(),
  });

  await saveOrgMemoryFromSource({
    orgId: job.orgId,
    jobId: job.id,
    sourceType:
      source === "award"
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
