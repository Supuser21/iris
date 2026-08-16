import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth/session";
import { ensureOwnerOrg } from "@/lib/construction";
import { db } from "@/lib/db";
import { orgIntegrations, users } from "@/lib/db/schema";
import { ensureDb } from "@/lib/init";

const PROVIDERS = new Set([
  "telegram",
  "teams",
  "procore",
  "email",
  "drive",
  "stripe",
]);

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
  const integrations = await db
    .select()
    .from(orgIntegrations)
    .where(eq(orgIntegrations.orgId, org.id));

  return NextResponse.json({ integrations });
}

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

  const { provider } = await req.json();
  if (typeof provider !== "string" || !PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const org = await ensureOwnerOrg(user.id, user.name);
  const [existing] = await db
    .select()
    .from(orgIntegrations)
    .where(
      and(eq(orgIntegrations.orgId, org.id), eq(orgIntegrations.provider, provider))
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({ integration: existing });
  }

  const id = nanoid();
  await db.insert(orgIntegrations).values({
    id,
    orgId: org.id,
    provider,
    status: "requested",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [integration] = await db
    .select()
    .from(orgIntegrations)
    .where(eq(orgIntegrations.id, id))
    .limit(1);

  return NextResponse.json({ integration }, { status: 201 });
}
