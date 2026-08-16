import { generateObject } from "ai";
import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { MEETING_ABSENTEES_PLAYBOOK } from "@/lib/agent/playbooks/meeting-absentees";
import {
  getCompanyContextForOrg,
  parseMeetingExtract,
} from "@/lib/construction";
import { db } from "@/lib/db";
import {
  jobPeople,
  jobs,
  meetings,
  outboundMessages,
  people,
} from "@/lib/db/schema";
import type { Job, Person } from "@/lib/db/schema";
import { saveOrgMemoryFromSource } from "@/lib/integrations";
import { getOpenRouterModel } from "@/lib/openrouter";
import { sendJobSms } from "@/lib/sms/job-sms";

const meetingSchema = z.object({
  decisions: z.array(z.string()).default([]),
  owners: z
    .array(
      z.object({
        name: z.string(),
        task: z.string(),
      })
    )
    .default([]),
  peopleToNotify: z.array(z.string()).default([]),
  draftRecap: z.string().default(""),
});

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function matchPersonByName(name: string, crew: Person[]) {
  const target = normalizeName(name);
  if (!target) return null;

  return (
    crew.find((person) => normalizeName(person.name) === target) ??
    crew.find((person) => normalizeName(person.name).includes(target)) ??
    crew.find((person) => target.includes(normalizeName(person.name)))
  );
}

function fallbackMeetingExtract(job: Job, transcript: string) {
  const trimmed = transcript.trim();
  return {
    decisions: [],
    owners: [],
    peopleToNotify: [],
    draftRecap: `${job.name}: ${trimmed.slice(0, 220)}${trimmed.length > 220 ? "…" : ""}`,
  };
}

export async function getCrewForJob(jobId: string) {
  const links = await db.select().from(jobPeople).where(eq(jobPeople.jobId, jobId));
  const ids = links.map((row) => row.personId);
  if (ids.length === 0) return [];
  return db.select().from(people).where(inArray(people.id, ids));
}

export async function extractMeetingDraft(args: {
  job: Job;
  title: string;
  transcript: string;
  attendeePersonIds: string[];
}) {
  const crew = await getCrewForJob(args.job.id);
  const model = getOpenRouterModel();
  const company = await getCompanyContextForOrg(args.job.orgId);

  const extracted = model
    ? await generateObject({
        model,
        schema: meetingSchema,
        prompt: `${MEETING_ABSENTEES_PLAYBOOK}

Job: ${args.job.name}
Address: ${args.job.address ?? "unknown"}
Company:
- Name: ${company?.orgName ?? "unknown"}
- Company type / trades: ${company?.companyType ?? "not set"}
- Preferred tone: ${company?.preferredTone ?? "direct and professional"}
- Preferred recap style: ${company?.preferredRecapStyle ?? "short, useful, PM-approved"}
- Learned preferences:
${company?.memories.map((memory) => `- ${memory.content}`).join("\n") || "- none yet"}

Crew:
${crew.map((person) => `- ${person.name}${person.role ? ` (${person.role})` : ""}`).join("\n")}

Attendees:
${args.attendeePersonIds
  .map((id) => crew.find((person) => person.id === id)?.name ?? id)
  .join(", ") || "none listed"}

Transcript:
${args.transcript}
`,
      }).then((result) => result.object)
    : fallbackMeetingExtract(args.job, args.transcript);

  const attendeeSet = new Set(args.attendeePersonIds);
  const suggestedAbsentees = new Set<string>();
  const unmatchedNames = new Set<string>();

  for (const rawName of extracted.peopleToNotify) {
    const person = matchPersonByName(rawName, crew);
    if (!person) {
      unmatchedNames.add(rawName);
      continue;
    }
    if (!attendeeSet.has(person.id)) {
      suggestedAbsentees.add(person.id);
    }
  }

  const owners = extracted.owners.map((owner) => ({
    name: owner.name,
    task: owner.task,
  }));

  const payload = {
    decisions: extracted.decisions,
    owners,
    suggestedAbsenteeIds: Array.from(suggestedAbsentees),
    unmatchedNames: Array.from(unmatchedNames),
    draftRecap: extracted.draftRecap.trim(),
  };

  const id = nanoid();
  await db.insert(meetings).values({
    id,
    jobId: args.job.id,
    title: args.title,
    attendeePersonIds: JSON.stringify(args.attendeePersonIds),
    transcript: args.transcript,
    extracted: JSON.stringify(payload),
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await saveOrgMemoryFromSource({
    orgId: args.job.orgId,
    jobId: args.job.id,
    sourceType: "meeting_transcript",
    title: args.title,
    content:
      payload.draftRecap ||
      payload.decisions.join("; ") ||
      args.transcript.slice(0, 240),
    tags: "meeting",
  });

  const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  if (!meeting) {
    throw new Error("Failed to create meeting draft");
  }
  return {
    meeting,
    parsedExtract: payload,
    crew,
  };
}

export async function sendMeetingDraft(args: {
  meetingId: string;
  job: Job;
  personIds: string[];
  body: string;
}) {
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(and(eq(meetings.id, args.meetingId), eq(meetings.jobId, args.job.id)))
    .limit(1);
  if (!meeting) {
    throw new Error("Meeting draft not found");
  }

  const crew = await getCrewForJob(args.job.id);
  const selected = crew.filter((person) => args.personIds.includes(person.id));

  for (const person of selected) {
    await sendJobSms({
      person,
      job: args.job,
      body: args.body,
      reason: "meeting_absentee",
      meetingId: meeting.id,
    });
  }

  await db
    .update(meetings)
    .set({
      extracted: JSON.stringify({
        ...parseMeetingExtract(meeting.extracted),
        draftRecap: args.body,
        suggestedAbsenteeIds: args.personIds,
      }),
      status: "sent",
      updatedAt: new Date(),
    })
    .where(eq(meetings.id, meeting.id));

  return selected.length;
}

export async function findLatestOutboundJobForPhone(phone: string) {
  const [lastOutbound] = await db
    .select()
    .from(outboundMessages)
    .where(eq(outboundMessages.phone, phone))
    .orderBy(desc(outboundMessages.createdAt))
    .limit(1);
  return lastOutbound ?? null;
}
