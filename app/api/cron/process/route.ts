import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/init";
import { runDueWork } from "@/lib/cron/process";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDb();
  const result = await runDueWork();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
