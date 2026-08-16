import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { ensureOwnerOrg } from "@/lib/construction";
import { loadRiversideDemo } from "@/lib/demo/riverside";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ensureDb } from "@/lib/init";

export async function POST() {
  await ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await ensureOwnerOrg(user.id, user.name);
  const result = await loadRiversideDemo(user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  return NextResponse.json(result);
}
