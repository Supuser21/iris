import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { loadChatHistory } from "@/lib/agent/run";
import { ensureDb } from "@/lib/init";

export async function GET() {
  await ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const history = await loadChatHistory(session.userId, 50);
  return NextResponse.json({ messages: history });
}
