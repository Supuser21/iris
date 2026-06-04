import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/lib/init";

export async function GET() {
  ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ user: null });
  }
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  return NextResponse.json({ user: user ?? null });
}
