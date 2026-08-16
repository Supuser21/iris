import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getJobSnapshot } from "@/lib/construction";
import { ensureDb } from "@/lib/init";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const snapshot = await getJobSnapshot(session.userId, id);
  if (!snapshot) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
