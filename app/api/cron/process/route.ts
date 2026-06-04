import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/init";
import { processDueReminders } from "@/lib/agent/tools";
import { sendMorningBriefs } from "@/lib/cron/morning-brief";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  ensureDb();
  const remindersSent = await processDueReminders();
  const briefsSent = await sendMorningBriefs();

  return NextResponse.json({
    ok: true,
    remindersSent,
    briefsSent,
  });
}
