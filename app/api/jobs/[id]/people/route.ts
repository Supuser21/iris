import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { jobPeople, people } from "@/lib/db/schema";
import { getOwnedJob } from "@/lib/construction";
import { ensureDb } from "@/lib/init";
import { saveOrgMemoryFromSource } from "@/lib/integrations";
import { isValidUsPhone, normalizePhone } from "@/lib/phone";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const job = await getOwnedJob(id, session.userId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { name, role, phone } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Crew name required" }, { status: 400 });
  }
  if (!phone || typeof phone !== "string" || !isValidUsPhone(phone)) {
    return NextResponse.json({ error: "Valid US phone required" }, { status: 400 });
  }

  const normalized = normalizePhone(phone);
  let [person] = await db
    .select()
    .from(people)
    .where(and(eq(people.orgId, job.orgId), eq(people.phone, normalized)))
    .limit(1);

  if (!person) {
    const personId = nanoid();
    await db.insert(people).values({
      id: personId,
      orgId: job.orgId,
      name: name.trim(),
      role: typeof role === "string" ? role.trim() : null,
      phone: normalized,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    [person] = await db.select().from(people).where(eq(people.id, personId)).limit(1);
  } else {
    await db
      .update(people)
      .set({
        name: name.trim(),
        role: typeof role === "string" ? role.trim() : person.role,
        updatedAt: new Date(),
      })
      .where(eq(people.id, person.id));
  }

  const [existingLink] = await db
    .select()
    .from(jobPeople)
    .where(and(eq(jobPeople.jobId, job.id), eq(jobPeople.personId, person.id)))
    .limit(1);

  if (!existingLink) {
    await db.insert(jobPeople).values({
      id: nanoid(),
      jobId: job.id,
      personId: person.id,
      createdAt: new Date(),
    });
  }

  await saveOrgMemoryFromSource({
    orgId: job.orgId,
    jobId: job.id,
    sourceType: "crew",
    title: `Crew update: ${name.trim()}`,
    content: `${name.trim()}${typeof role === "string" && role.trim() ? ` is ${role.trim()}` : ""} on ${job.name}.`,
    tags: "crew",
  });

  return NextResponse.json({ person });
}
