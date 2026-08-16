import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import {
  ensureStarterWorkflows,
  listOrgWorkflows,
  proposeWorkflow,
  saveApprovedWorkflow,
} from "@/lib/agent/workflows";
import { ensureOwnerOrg } from "@/lib/construction";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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
  await ensureStarterWorkflows(org.id, user.id);
  const workflows = await listOrgWorkflows(org.id);
  return NextResponse.json({ org, workflows });
}

export async function POST(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const proposed = await proposeWorkflow({
    name: typeof body.name === "string" ? body.name : "",
    triggerPhrase:
      typeof body.triggerPhrase === "string" ? body.triggerPhrase : "",
    goal: typeof body.goal === "string" ? body.goal : "",
    outputType: typeof body.outputType === "string" ? body.outputType : "report",
    allowedTools: Array.isArray(body.allowedTools)
      ? body.allowedTools.filter((value: unknown): value is string => typeof value === "string")
      : undefined,
  });

  if (!proposed.proposal.name || !proposed.proposal.goal) {
    return NextResponse.json({ error: "Name and goal required" }, { status: 400 });
  }

  const saved = await saveApprovedWorkflow({
    userId: session.userId,
    proposal: proposed.proposal,
  });
  if (!saved.ok) {
    return NextResponse.json({ error: saved.message }, { status: 400 });
  }
  return NextResponse.json(saved, { status: 201 });
}
