import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth/session";
import { ensureOwnerOrg } from "@/lib/construction";
import { db } from "@/lib/db";
import { orgMemories, users } from "@/lib/db/schema";
import { ensureDb } from "@/lib/init";

export async function POST(req: Request) {
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

  const { content, tags } = await req.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Memory content required" }, { status: 400 });
  }

  const org = await ensureOwnerOrg(user.id, user.name);
  const id = nanoid();
  await db.insert(orgMemories).values({
    id,
    orgId: org.id,
    content: content.trim(),
    tags: typeof tags === "string" ? tags.trim() : null,
    sourceType: "manual_note",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
