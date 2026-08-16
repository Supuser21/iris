import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOwnedJob } from "@/lib/construction";
import { ensureDb } from "@/lib/init";
import { sendMeetingDraft } from "@/lib/meetings";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  await ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, meetingId } = await params;
  const job = await getOwnedJob(id, session.userId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { personIds, body } = await req.json();
  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "Recap body required" }, { status: 400 });
  }
  if (!Array.isArray(personIds) || personIds.length === 0) {
    return NextResponse.json(
      { error: "Select at least one recipient" },
      { status: 400 }
    );
  }

  const sentCount = await sendMeetingDraft({
    meetingId,
    job,
    personIds: Array.isArray(personIds)
      ? personIds.filter((value): value is string => typeof value === "string")
      : [],
    body: body.trim(),
  });

  return NextResponse.json({ ok: true, sentCount });
}
