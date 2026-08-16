import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { ensureOwnerOrg } from "@/lib/construction";
import { db } from "@/lib/db";
import { jobs, users } from "@/lib/db/schema";
import { ensureDb } from "@/lib/init";
import { saveOrgMemoryFromSource } from "@/lib/integrations";

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
  const rows = await db.select().from(jobs).where(eq(jobs.orgId, org.id));
  return NextResponse.json({ org, jobs: rows });
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

  const { name, address, status } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Job name required" }, { status: 400 });
  }

  const org = await ensureOwnerOrg(user.id, user.name);
  const id = nanoid();
  await db.insert(jobs).values({
    id,
    orgId: org.id,
    name: name.trim(),
    address: typeof address === "string" ? address.trim() : null,
    status: typeof status === "string" ? status : "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await saveOrgMemoryFromSource({
    orgId: org.id,
    jobId: id,
    sourceType: "job_record",
    title: `New job: ${name.trim()}`,
    content: `${name.trim()}${typeof address === "string" && address.trim() ? ` at ${address.trim()}` : ""}`,
    tags: "job",
  });

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return NextResponse.json({ job }, { status: 201 });
}
