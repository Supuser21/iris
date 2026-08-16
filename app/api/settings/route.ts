import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/lib/init";

export async function PATCH(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if (body.timezone) allowed.timezone = body.timezone;
  if (body.morningBriefTime) allowed.morningBriefTime = body.morningBriefTime;
  if (typeof body.morningBriefEnabled === "boolean") {
    allowed.morningBriefEnabled = body.morningBriefEnabled;
  }
  if (body.name) allowed.name = body.name;

  await db
    .update(users)
    .set({ ...allowed, updatedAt: new Date() })
    .where(eq(users.id, session.userId));

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return NextResponse.json({ user });
}
