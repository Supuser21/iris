import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { outboundMessages, people } from "@/lib/db/schema";
import type { Job, Person } from "@/lib/db/schema";
import { sendSms } from "@/lib/sms";

type SendJobSmsArgs = {
  person: Person;
  job: Job;
  body: string;
  reason: string;
  meetingId?: string;
};

function truncateBody(text: string, max = 320) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function withFirstTextDisclaimer(body: string, jobName: string) {
  const cleaned = body.trim();
  const disclaimer = `Iris for ${jobName}. Reply STOP to opt out. HELP for help.`;
  return truncateBody(`${cleaned}\n\n${disclaimer}`);
}

export async function sendJobSms({
  person,
  job,
  body,
  reason,
  meetingId,
}: SendJobSmsArgs) {
  const [freshPerson] = await db
    .select()
    .from(people)
    .where(eq(people.id, person.id))
    .limit(1);

  if (!freshPerson) {
    throw new Error("Crew person not found");
  }

  if (freshPerson.smsOptOut) {
    const id = nanoid();
    await db.insert(outboundMessages).values({
      id,
      jobId: job.id,
      meetingId: meetingId ?? null,
      personId: freshPerson.id,
      phone: freshPerson.phone,
      reason,
      body: body.trim(),
      status: "skipped_opt_out",
      error: null,
    });
    return { id, status: "skipped_opt_out" as const };
  }

  const [priorOutbound] = await db
    .select()
    .from(outboundMessages)
    .where(
      and(
        eq(outboundMessages.personId, freshPerson.id),
        eq(outboundMessages.phone, freshPerson.phone)
      )
    )
    .limit(1);

  const messageBody = truncateBody(
    priorOutbound ? body.trim() : withFirstTextDisclaimer(body, job.name)
  );
  const id = nanoid();

  try {
    await sendSms(freshPerson.phone, messageBody, { bypassOptOut: true });
    await db.insert(outboundMessages).values({
      id,
      jobId: job.id,
      meetingId: meetingId ?? null,
      personId: freshPerson.id,
      phone: freshPerson.phone,
      reason,
      body: messageBody,
      status: "sent",
      error: null,
    });
    return { id, status: "sent" as const };
  } catch (err) {
    const error =
      err instanceof Error ? err.message : "Unknown SMS send failure";
    await db.insert(outboundMessages).values({
      id,
      jobId: job.id,
      meetingId: meetingId ?? null,
      personId: freshPerson.id,
      phone: freshPerson.phone,
      reason,
      body: messageBody,
      status: "failed",
      error,
    });
    throw err;
  }
}
