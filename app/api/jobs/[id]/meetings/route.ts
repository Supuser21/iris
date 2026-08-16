import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOwnedJob } from "@/lib/construction";
import { ensureDb } from "@/lib/init";
import { extractMeetingDraft } from "@/lib/meetings";

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

  const { title, transcript, attendeePersonIds } = await req.json();
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Meeting title required" }, { status: 400 });
  }
  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json({ error: "Transcript required" }, { status: 400 });
  }

  const result = await extractMeetingDraft({
    job,
    title: title.trim(),
    transcript: transcript.trim(),
    attendeePersonIds: Array.isArray(attendeePersonIds)
      ? attendeePersonIds.filter((value): value is string => typeof value === "string")
      : [],
  });

  return NextResponse.json(result, { status: 201 });
}
