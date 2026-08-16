import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { ensureOwnerOrg, getOrgMemories } from "@/lib/construction";
import { db } from "@/lib/db";
import { orgs, users } from "@/lib/db/schema";
import { ensureDb } from "@/lib/init";

export async function GET() {
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

  const org = await ensureOwnerOrg(user.id, user.name);
  const memories = await getOrgMemories(org.id);
  return NextResponse.json({ org, memories });
}

export async function PATCH(req: Request) {
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

  const org = await ensureOwnerOrg(user.id, user.name);
  const body = await req.json();

  await db
    .update(orgs)
    .set({
      name:
        typeof body.name === "string" && body.name.trim()
          ? body.name.trim()
          : org.name,
      companyType:
        typeof body.companyType === "string" ? body.companyType.trim() : org.companyType,
      preferredTone:
        typeof body.preferredTone === "string"
          ? body.preferredTone.trim()
          : org.preferredTone,
      preferredRecapStyle:
        typeof body.preferredRecapStyle === "string"
          ? body.preferredRecapStyle.trim()
          : org.preferredRecapStyle,
      preferredBriefStyle:
        typeof body.preferredBriefStyle === "string"
          ? body.preferredBriefStyle.trim()
          : org.preferredBriefStyle,
      updatedAt: new Date(),
    })
    .where(eq(orgs.id, org.id));

  const [updated] = await db.select().from(orgs).where(eq(orgs.id, org.id)).limit(1);
  const memories = await getOrgMemories(org.id);
  return NextResponse.json({ org: updated, memories });
}
