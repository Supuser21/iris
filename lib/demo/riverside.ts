import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { executeWorkflow } from "@/lib/agent/workflows";
import { getUserOrg } from "@/lib/construction";
import { db } from "@/lib/db";
import {
  inboundReplies,
  jobDocuments,
  jobPeople,
  jobs,
  meetings,
  orgMemories,
  orgWorkflows,
  outboundMessages,
  people,
} from "@/lib/db/schema";

const RIVERSIDE_NAME = "Riverside Apartments";
const MIKE_PHONE = "+14155550101";
const JEN_PHONE = "+14155550102";

export async function loadRiversideDemo(userId: string) {
  const org = await getUserOrg(userId);
  if (!org) {
    return { ok: false as const, message: "No company profile found yet." };
  }

  let [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.orgId, org.id), eq(jobs.name, RIVERSIDE_NAME)))
    .limit(1);

  if (!job) {
    const jobId = nanoid();
    await db.insert(jobs).values({
      id: jobId,
      orgId: org.id,
      name: RIVERSIDE_NAME,
      address: "410 River Road",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  }
  if (!job) {
    return { ok: false as const, message: "Could not create Riverside job." };
  }

  const mike = await upsertCrew(org.id, job.id, {
    name: "Mike Alvarez",
    role: "Super",
    phone: MIKE_PHONE,
  });
  const jen = await upsertCrew(org.id, job.id, {
    name: "Jen Walsh",
    role: "PM",
    phone: JEN_PHONE,
  });

  const [existingMeeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.jobId, job.id))
    .limit(1);

  let meetingId = existingMeeting?.id;
  if (!existingMeeting) {
    meetingId = nanoid();
    const extract = {
      decisions: [
        "Pour moved to Thursday 6am",
        "Rebar inspection stays at 9",
        "Delivery slid to 10",
      ],
      owners: [
        { name: "Mike Alvarez", task: "Have the deck ready for the 6am pour" },
        { name: "Jen Walsh", task: "Confirm the owner knows the pour moved" },
      ],
      suggestedAbsenteeIds: [mike.id],
      unmatchedNames: [],
      draftRecap:
        "Riverside: pour moved to Thursday 6am. Rebar inspection stays at 9. Delivery slid to 10. Mike missed the call — send him the update and cc Jen.",
    };
    await db.insert(meetings).values({
      id: meetingId,
      jobId: job.id,
      title: "Owner call recap",
      attendeePersonIds: JSON.stringify([jen.id]),
      transcript:
        "Owner call: pour moved to Thursday 6am. Rebar inspection stays at 9. Delivery slid to 10. Mike missed the call. Jen will confirm with the owner. Mike needs the deck ready.",
      extracted: JSON.stringify(extract),
      status: "sent",
      createdAt: hoursAgo(36),
      updatedAt: hoursAgo(20),
    });
  }

  const [existingDoc] = await db
    .select()
    .from(jobDocuments)
    .where(eq(jobDocuments.jobId, job.id))
    .limit(1);
  if (!existingDoc) {
    await db.insert(jobDocuments).values({
      id: nanoid(),
      jobId: job.id,
      title: "Award note",
      content:
        "Riverside Apartments Building B awarded. Super is Mike Alvarez. PM is Jen Walsh. Owner wants Thursday pour updates the same day.",
      source: "award",
      createdAt: hoursAgo(48),
    });
  }

  const [existingOutbound] = await db
    .select()
    .from(outboundMessages)
    .where(eq(outboundMessages.jobId, job.id))
    .limit(1);
  if (!existingOutbound) {
    const recap =
      "Riverside: pour moved to Thursday 6am. Rebar inspection stays at 9. Delivery slid to 10.";
    await db.insert(outboundMessages).values([
      {
        id: nanoid(),
        jobId: job.id,
        meetingId: meetingId ?? null,
        personId: mike.id,
        phone: mike.phone,
        reason: "meeting_absentee",
        body: recap,
        status: "sent",
        createdAt: hoursAgo(20),
      },
      {
        id: nanoid(),
        jobId: job.id,
        meetingId: meetingId ?? null,
        personId: jen.id,
        phone: jen.phone,
        reason: "meeting_absentee",
        body: recap,
        status: "sent",
        createdAt: hoursAgo(20),
      },
    ]);
    await db.insert(inboundReplies).values({
      id: nanoid(),
      jobId: job.id,
      personId: jen.id,
      phone: jen.phone,
      body: "Got it. Owner is confirmed on Thursday 6am.",
      relayedToUserId: userId,
      createdAt: hoursAgo(12),
    });
  }

  const [existingMemory] = await db
    .select()
    .from(orgMemories)
    .where(eq(orgMemories.orgId, org.id))
    .limit(1);
  if (!existingMemory) {
    await db.insert(orgMemories).values({
      id: nanoid(),
      orgId: org.id,
      content:
        "After a schedule change, text the super first and flag anyone who has not replied.",
      tags: "recap, follow-up",
      sourceType: "manual_note",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  let [workflow] = await db
    .select()
    .from(orgWorkflows)
    .where(and(eq(orgWorkflows.orgId, org.id), eq(orgWorkflows.kind, "demo")))
    .limit(1);

  if (!workflow) {
    const workflowId = nanoid();
    await db.insert(orgWorkflows).values({
      id: workflowId,
      orgId: org.id,
      name: "Riverside: no reply after schedule change",
      triggerPhrase: "who hasn't replied on Riverside after the schedule change",
      goal: "After a Riverside schedule change, show who got the update and who still has not replied.",
      outputType: "report",
      allowedTools: "who_hasnt_replied,search_job_context",
      toolName: "who_hasnt_replied",
      kind: "demo",
      createdByUserId: userId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    [workflow] = await db
      .select()
      .from(orgWorkflows)
      .where(eq(orgWorkflows.id, workflowId))
      .limit(1);
  }

  const run = workflow
    ? await executeWorkflow({
        userId,
        workflow,
        jobQuery: "Riverside",
      })
    : null;

  return {
    ok: true as const,
    job,
    workflow,
    run,
    message:
      "Riverside demo is ready. Ask Iris who hasn't replied after the schedule change.",
  };
}

async function upsertCrew(
  orgId: string,
  jobId: string,
  input: { name: string; role: string; phone: string }
) {
  let [person] = await db
    .select()
    .from(people)
    .where(and(eq(people.orgId, orgId), eq(people.phone, input.phone)))
    .limit(1);

  if (!person) {
    const id = nanoid();
    await db.insert(people).values({
      id,
      orgId,
      name: input.name,
      role: input.role,
      phone: input.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    [person] = await db.select().from(people).where(eq(people.id, id)).limit(1);
  }
  if (!person) {
    throw new Error(`Could not create ${input.name}`);
  }

  const [link] = await db
    .select()
    .from(jobPeople)
    .where(and(eq(jobPeople.jobId, jobId), eq(jobPeople.personId, person.id)))
    .limit(1);
  if (!link) {
    await db.insert(jobPeople).values({
      id: nanoid(),
      jobId,
      personId: person.id,
      createdAt: new Date(),
    });
  }

  return person;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}
