import { desc, eq, inArray } from "drizzle-orm";
import {
  getUserOrg,
  jobMatchesQuery,
  parseMeetingExtract,
  tokenizeQuery,
} from "@/lib/construction";
import { db } from "@/lib/db";
import {
  inboundReplies,
  jobDocuments,
  jobs,
  meetings,
  orgMemories,
  outboundMessages,
  people,
} from "@/lib/db/schema";

export type JobSourceMatch = {
  type:
    | "job"
    | "document"
    | "meeting"
    | "crew"
    | "reply"
    | "outbound"
    | "company_memory";
  sourceId: string;
  jobId: string | null;
  jobName: string;
  title: string;
  snippet: string;
};

function snippet(value: string, max = 220) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max - 1)}…` : compact;
}

function matchesTokens(haystack: string, tokens: string[], rawQuery: string) {
  const text = haystack.toLowerCase();
  if (rawQuery && text.includes(rawQuery)) return true;
  return tokens.some((token) => text.includes(token));
}

export async function searchJobContext(userId: string, query: string) {
  const org = await getUserOrg(userId);
  if (!org) {
    return { org: null, matches: [] as JobSourceMatch[] };
  }

  const ownedJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.orgId, org.id))
    .orderBy(desc(jobs.createdAt));
  const jobIds = ownedJobs.map((job) => job.id);
  const rawQuery = query.trim().toLowerCase();
  const tokens = tokenizeQuery(query);
  const namedJobs = ownedJobs.filter((job) => jobMatchesQuery(job, query));
  const focusJobs = namedJobs.length > 0 ? namedJobs : ownedJobs;
  const focusIds = new Set(focusJobs.map((job) => job.id));

  const [docs, meetingRows, crew, companyMemories, outbound, replies] =
    await Promise.all([
      jobIds.length === 0
        ? Promise.resolve([])
        : db.select().from(jobDocuments).where(inArray(jobDocuments.jobId, jobIds)),
      jobIds.length === 0
        ? Promise.resolve([])
        : db
            .select()
            .from(meetings)
            .where(inArray(meetings.jobId, jobIds))
            .orderBy(desc(meetings.createdAt)),
      db.select().from(people).where(eq(people.orgId, org.id)),
      db
        .select()
        .from(orgMemories)
        .where(eq(orgMemories.orgId, org.id))
        .orderBy(desc(orgMemories.createdAt)),
      jobIds.length === 0
        ? Promise.resolve([])
        : db
            .select()
            .from(outboundMessages)
            .where(inArray(outboundMessages.jobId, jobIds))
            .orderBy(desc(outboundMessages.createdAt)),
      jobIds.length === 0
        ? Promise.resolve([])
        : db
            .select()
            .from(inboundReplies)
            .where(inArray(inboundReplies.jobId, jobIds))
            .orderBy(desc(inboundReplies.createdAt)),
    ]);

  const matches: JobSourceMatch[] = [];
  const seen = new Set<string>();

  function push(match: JobSourceMatch) {
    const key = `${match.type}:${match.sourceId}`;
    if (seen.has(key)) return;
    seen.add(key);
    matches.push(match);
  }

  for (const job of focusJobs) {
    if (namedJobs.length > 0 || jobMatchesQuery(job, query)) {
      push({
        type: "job",
        sourceId: job.id,
        jobId: job.id,
        jobName: job.name,
        title: job.name,
        snippet: job.address ?? "Active job",
      });
    }
  }

  for (const person of crew) {
    const haystack = `${person.name} ${person.role ?? ""}`;
    if (!matchesTokens(haystack, tokens, rawQuery)) continue;
    push({
      type: "crew",
      sourceId: person.id,
      jobId: null,
      jobName: "Crew",
      title: person.name,
      snippet: person.role ?? "Crew member",
    });
  }

  for (const doc of docs) {
    const jobName = ownedJobs.find((job) => job.id === doc.jobId)?.name ?? "Job";
    const haystack = `${doc.title} ${doc.content}`;
    const inFocus = focusIds.has(doc.jobId);
    if (!inFocus && !matchesTokens(haystack, tokens, rawQuery)) continue;
    if (inFocus || matchesTokens(haystack, tokens, rawQuery)) {
      if (!matchesTokens(haystack, tokens, rawQuery) && namedJobs.length === 0) {
        continue;
      }
      push({
        type: "document",
        sourceId: doc.id,
        jobId: doc.jobId,
        jobName,
        title: doc.title,
        snippet: snippet(doc.content),
      });
    }
  }

  for (const meeting of meetingRows) {
    const jobName = ownedJobs.find((job) => job.id === meeting.jobId)?.name ?? "Job";
    const parsed = parseMeetingExtract(meeting.extracted);
    const haystack = [
      meeting.title,
      meeting.transcript,
      parsed.draftRecap,
      parsed.decisions.join(" "),
      parsed.owners.map((owner) => `${owner.name} ${owner.task}`).join(" "),
    ].join(" ");
    const inNamedJob = namedJobs.some((job) => job.id === meeting.jobId);
    if (!inNamedJob && !matchesTokens(haystack, tokens, rawQuery)) continue;
    push({
      type: "meeting",
      sourceId: meeting.id,
      jobId: meeting.jobId,
      jobName,
      title: meeting.title,
      snippet: snippet(
        parsed.draftRecap || parsed.decisions.join("; ") || meeting.transcript
      ),
    });
  }

  for (const message of outbound) {
    const jobName = ownedJobs.find((job) => job.id === message.jobId)?.name ?? "Job";
    const haystack = `${message.body} ${message.reason}`;
    const inNamedJob = namedJobs.some((job) => job.id === message.jobId);
    if (!inNamedJob && !matchesTokens(haystack, tokens, rawQuery)) continue;
    push({
      type: "outbound",
      sourceId: message.id,
      jobId: message.jobId,
      jobName,
      title: `Text sent · ${message.reason}`,
      snippet: snippet(message.body),
    });
  }

  for (const reply of replies) {
    const jobName = ownedJobs.find((job) => job.id === reply.jobId)?.name ?? "Job";
    const person = crew.find((item) => item.id === reply.personId);
    const haystack = `${reply.body} ${person?.name ?? ""}`;
    const inNamedJob = namedJobs.some((job) => job.id === reply.jobId);
    if (!inNamedJob && !matchesTokens(haystack, tokens, rawQuery)) continue;
    push({
      type: "reply",
      sourceId: reply.id,
      jobId: reply.jobId,
      jobName,
      title: `${person?.name ?? "Crew"} replied`,
      snippet: snippet(reply.body),
    });
  }

  for (const memory of companyMemories) {
    const haystack = `${memory.content} ${memory.tags ?? ""}`;
    if (!matchesTokens(haystack, tokens, rawQuery) && namedJobs.length === 0) {
      continue;
    }
    if (!matchesTokens(haystack, tokens, rawQuery) && namedJobs.length > 0) {
      continue;
    }
    push({
      type: "company_memory",
      sourceId: memory.id,
      jobId: null,
      jobName: org.name,
      title: memory.tags || "Company preference",
      snippet: snippet(memory.content, 280),
    });
  }

  if (namedJobs.length > 0) {
    for (const job of namedJobs) {
      const latestMeeting = meetingRows.find((meeting) => meeting.jobId === job.id);
      if (latestMeeting) {
        const parsed = parseMeetingExtract(latestMeeting.extracted);
        push({
          type: "meeting",
          sourceId: latestMeeting.id,
          jobId: job.id,
          jobName: job.name,
          title: latestMeeting.title,
          snippet: snippet(
            parsed.draftRecap ||
              parsed.decisions.join("; ") ||
              latestMeeting.transcript
          ),
        });
      }
      const latestDocs = docs.filter((doc) => doc.jobId === job.id).slice(0, 2);
      for (const doc of latestDocs) {
        push({
          type: "document",
          sourceId: doc.id,
          jobId: job.id,
          jobName: job.name,
          title: doc.title,
          snippet: snippet(doc.content),
        });
      }
    }
  }

  return {
    org: { id: org.id, name: org.name },
    matches: matches.slice(0, 12),
  };
}
