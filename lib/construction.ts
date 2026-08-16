import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  inboundReplies,
  jobDocuments,
  jobPeople,
  jobs,
  meetings,
  orgMembers,
  orgMemories,
  orgs,
  outboundMessages,
  people,
} from "@/lib/db/schema";

export type MeetingOwner = {
  name: string;
  task: string;
};

export type MeetingExtract = {
  decisions: string[];
  owners: MeetingOwner[];
  suggestedAbsenteeIds: string[];
  unmatchedNames: string[];
  draftRecap: string;
};

export type CompanyContext = {
  orgName: string;
  companyType: string | null;
  preferredTone: string | null;
  preferredRecapStyle: string | null;
  preferredBriefStyle: string | null;
  memories: { content: string; tags: string | null; sourceType: string }[];
};

export function parseMeetingExtract(raw: string): MeetingExtract {
  try {
    const parsed = JSON.parse(raw) as Partial<MeetingExtract>;
    return {
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      owners: Array.isArray(parsed.owners) ? parsed.owners : [],
      suggestedAbsenteeIds: Array.isArray(parsed.suggestedAbsenteeIds)
        ? parsed.suggestedAbsenteeIds
        : [],
      unmatchedNames: Array.isArray(parsed.unmatchedNames)
        ? parsed.unmatchedNames
        : [],
      draftRecap:
        typeof parsed.draftRecap === "string" ? parsed.draftRecap : "",
    };
  } catch {
    return {
      decisions: [],
      owners: [],
      suggestedAbsenteeIds: [],
      unmatchedNames: [],
      draftRecap: "",
    };
  }
}

export async function getOwnerOrg(userId: string) {
  const [org] = await db.select().from(orgs).where(eq(orgs.ownerUserId, userId)).limit(1);
  return org ?? null;
}

export async function getUserOrg(userId: string) {
  const owned = await getOwnerOrg(userId);
  if (owned) return owned;

  const [membership] = await db
    .select()
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
    .limit(1);
  if (!membership) return null;

  const [org] = await db
    .select()
    .from(orgs)
    .where(eq(orgs.id, membership.orgId))
    .limit(1);
  return org ?? null;
}

export async function ensureOwnerOrg(userId: string, userName?: string | null) {
  const existing = await getUserOrg(userId);
  if (existing) return existing;

  const id = nanoid();
  const name = userName?.trim() ? `${userName.trim()}'s Jobs` : "My Jobs";
  await db.insert(orgs).values({
    id,
    name,
    ownerUserId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [created] = await db.select().from(orgs).where(eq(orgs.id, id)).limit(1);
  if (!created) {
    throw new Error("Failed to create owner org");
  }
  await db.insert(orgMembers).values({
    id: nanoid(),
    orgId: created.id,
    userId,
    role: "owner",
    createdAt: new Date(),
  });
  return created;
}

export async function getOwnedJob(jobId: string, userId: string) {
  const org = await getUserOrg(userId);
  if (!org) return null;
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.orgId, org.id)))
    .limit(1);
  return job ?? null;
}

export async function getOrgMemories(orgId: string, limit = 8) {
  return db
    .select()
    .from(orgMemories)
    .where(eq(orgMemories.orgId, orgId))
    .orderBy(desc(orgMemories.createdAt))
    .limit(limit);
}

export async function getCompanyContextForUser(
  userId: string
): Promise<CompanyContext | null> {
  const org = await getUserOrg(userId);
  if (!org) return null;
  return getCompanyContextForOrg(org.id);
}

export async function getCompanyContextForOrg(
  orgId: string
): Promise<CompanyContext | null> {
  const [org] = await db.select().from(orgs).where(eq(orgs.id, orgId)).limit(1);
  if (!org) return null;
  const memories = await getOrgMemories(org.id);
  return {
    orgName: org.name,
    companyType: org.companyType,
    preferredTone: org.preferredTone,
    preferredRecapStyle: org.preferredRecapStyle,
    preferredBriefStyle: org.preferredBriefStyle,
    memories: memories.map((memory) => ({
      content: memory.content,
      tags: memory.tags,
      sourceType: memory.sourceType,
    })),
  };
}

const QUERY_STOP_WORDS = new Set([
  "the",
  "what",
  "who",
  "has",
  "have",
  "hasnt",
  "haven't",
  "hasn't",
  "for",
  "and",
  "are",
  "was",
  "last",
  "this",
  "that",
  "with",
  "from",
  "your",
  "about",
  "after",
  "before",
  "every",
  "which",
  "open",
  "need",
  "needs",
  "tell",
  "show",
  "give",
  "draft",
  "text",
  "everyone",
]);

export function tokenizeQuery(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !QUERY_STOP_WORDS.has(token));
}

export async function getOrgJobs(orgId: string) {
  return db.select().from(jobs).where(eq(jobs.orgId, orgId)).orderBy(desc(jobs.createdAt));
}

export function jobMatchesQuery(
  job: { name: string; address: string | null },
  query: string
) {
  const haystack = `${job.name} ${job.address ?? ""}`.toLowerCase();
  const trimmed = query.trim().toLowerCase();
  if (trimmed && haystack.includes(trimmed)) return true;
  return tokenizeQuery(query).some((token) => haystack.includes(token));
}

export async function resolveJobsForQuery(orgId: string, query?: string | null) {
  const all = await getOrgJobs(orgId);
  if (!query?.trim()) return all;
  const matched = all.filter((job) => jobMatchesQuery(job, query));
  return matched.length > 0 ? matched : all;
}

export type FollowUpRow = {
  jobId: string;
  jobName: string;
  personId: string;
  name: string;
  role: string | null;
  phone: string;
  lastOutboundAt: string | null;
  lastOutboundBody: string | null;
  lastReplyAt: string | null;
  lastReplyBody: string | null;
  status: "not_sent" | "sent_no_reply" | "replied";
};

export async function getFollowUpForJobs(jobList: { id: string; name: string }[]) {
  const rows: FollowUpRow[] = [];
  for (const job of jobList) {
    const [crew, outbound, replies] = await Promise.all([
      getOwnedPeople(job.id),
      db
        .select()
        .from(outboundMessages)
        .where(eq(outboundMessages.jobId, job.id))
        .orderBy(desc(outboundMessages.createdAt)),
      db
        .select()
        .from(inboundReplies)
        .where(eq(inboundReplies.jobId, job.id))
        .orderBy(desc(inboundReplies.createdAt)),
    ]);

    for (const person of crew) {
      const lastOutbound = outbound.find(
        (item) => item.personId === person.id || item.phone === person.phone
      );
      const lastReply = replies.find(
        (item) => item.personId === person.id || item.phone === person.phone
      );
      const outboundTime = lastOutbound?.createdAt?.getTime() ?? 0;
      const replyTime = lastReply?.createdAt?.getTime() ?? 0;
      const status: FollowUpRow["status"] = !lastOutbound
        ? "not_sent"
        : lastReply && replyTime >= outboundTime
          ? "replied"
          : "sent_no_reply";

      rows.push({
        jobId: job.id,
        jobName: job.name,
        personId: person.id,
        name: person.name,
        role: person.role,
        phone: person.phone,
        lastOutboundAt: lastOutbound?.createdAt?.toISOString() ?? null,
        lastOutboundBody: lastOutbound?.body ?? null,
        lastReplyAt: lastReply?.createdAt?.toISOString() ?? null,
        lastReplyBody: lastReply?.body ?? null,
        status,
      });
    }
  }
  return rows;
}

export async function getOwnedPeople(jobId: string) {
  const links = await db.select().from(jobPeople).where(eq(jobPeople.jobId, jobId));
  const ids = links.map((row) => row.personId);
  if (ids.length === 0) return [];
  return db.select().from(people).where(inArray(people.id, ids));
}

export async function getJobSnapshot(userId: string, jobId: string) {
  const job = await getOwnedJob(jobId, userId);
  if (!job) return null;
  const org = await getUserOrg(userId);
  if (!org) return null;

  const [crew, docs, meetingRows, outbound, replies, memories] = await Promise.all([
    getOwnedPeople(jobId),
    db
      .select()
      .from(jobDocuments)
      .where(eq(jobDocuments.jobId, jobId))
      .orderBy(desc(jobDocuments.createdAt)),
    db
      .select()
      .from(meetings)
      .where(eq(meetings.jobId, jobId))
      .orderBy(desc(meetings.createdAt)),
    db
      .select()
      .from(outboundMessages)
      .where(eq(outboundMessages.jobId, jobId))
      .orderBy(desc(outboundMessages.createdAt)),
    db
      .select()
      .from(inboundReplies)
      .where(eq(inboundReplies.jobId, jobId))
      .orderBy(desc(inboundReplies.createdAt)),
    getOrgMemories(org.id),
  ]);

  return {
    org,
    job,
    crew,
    documents: docs,
    meetings: meetingRows.map((meeting) => ({
      ...meeting,
      parsedExtract: parseMeetingExtract(meeting.extracted),
    })),
    outbound,
    replies,
    orgMemories: memories,
  };
}

export async function getLatestCrewContext(phone: string) {
  const [lastOutbound] = await db
    .select()
    .from(outboundMessages)
    .where(eq(outboundMessages.phone, phone))
    .orderBy(desc(outboundMessages.createdAt))
    .limit(1);

  if (!lastOutbound?.personId) return null;

  const [person] = await db
    .select()
    .from(people)
    .where(eq(people.id, lastOutbound.personId))
    .limit(1);
  if (!person) return null;

  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, lastOutbound.jobId))
    .limit(1);
  if (!job) return null;

  const [org] = await db
    .select()
    .from(orgs)
    .where(eq(orgs.id, job.orgId))
    .limit(1);
  if (!org) return null;

  return {
    person,
    job,
    org,
    lastOutbound,
  };
}
