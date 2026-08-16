import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth/session";
import { getOwnerOrg } from "@/lib/construction";
import { db } from "@/lib/db";
import { orgInvites, orgMembers, users } from "@/lib/db/schema";
import { ensureDb } from "@/lib/init";
import { normalizePhone } from "@/lib/phone";
import { sendSms } from "@/lib/sms";
import { getAppUrl } from "@/lib/env";

export async function GET() {
  await ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getOwnerOrg(session.userId);
  if (!org) {
    return NextResponse.json({ invites: [], members: [] });
  }

  const [invites, members] = await Promise.all([
    db.select().from(orgInvites).where(eq(orgInvites.orgId, org.id)),
    db.select().from(orgMembers).where(eq(orgMembers.orgId, org.id)),
  ]);

  return NextResponse.json({ invites, members });
}

export async function POST(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getOwnerOrg(session.userId);
  if (!org) {
    return NextResponse.json({ error: "Only the owner can invite PMs" }, { status: 403 });
  }

  const { phone } = await req.json();
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json({ error: "Valid US phone required" }, { status: 400 });
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.phone, normalized))
    .limit(1);

  if (existingUser) {
    const [existingMember] = await db
      .select()
      .from(orgMembers)
      .where(
        and(eq(orgMembers.orgId, org.id), eq(orgMembers.userId, existingUser.id))
      )
      .limit(1);
    if (!existingMember) {
      await db.insert(orgMembers).values({
        id: nanoid(),
        orgId: org.id,
        userId: existingUser.id,
        role: "pm",
        createdAt: new Date(),
      });
    }
  }

  const id = nanoid();
  await db.insert(orgInvites).values({
    id,
    orgId: org.id,
    phone: normalized,
    role: "pm",
    status: existingUser ? "accepted" : "pending",
    invitedByUserId: session.userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  try {
    await sendSms(
      normalized,
      `You were invited to ${org.name} in Iris. Sign in here: ${getAppUrl()}/signup`,
      { bypassOptOut: true }
    );
  } catch (err) {
    console.error("[org/invites] invite SMS failed", err);
  }

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
