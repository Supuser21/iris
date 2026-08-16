import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { searchJobContext } from "@/lib/agent/job-context";
import {
  getFollowUpForJobs,
  getOwnedPeople,
  getUserOrg,
  parseMeetingExtract,
  resolveJobsForQuery,
} from "@/lib/construction";
import { db } from "@/lib/db";
import {
  meetings,
  orgWorkflows,
  workflowRuns,
  type OrgWorkflow,
} from "@/lib/db/schema";

export const WORKFLOW_TOOLS = [
  "who_hasnt_replied",
  "job_risk_brief",
  "missed_meeting_recap",
  "search_job_context",
  "custom",
] as const;

export type WorkflowToolName = (typeof WORKFLOW_TOOLS)[number];
export type WorkflowOutputType = "report" | "brief" | "checklist" | "crew_text";

export type WorkflowProposal = {
  name: string;
  triggerPhrase: string;
  goal: string;
  outputType: WorkflowOutputType;
  allowedTools: string[];
  toolName: WorkflowToolName;
};

export const STARTER_WORKFLOWS: Array<
  Omit<WorkflowProposal, "allowedTools"> & {
    allowedTools: string;
    kind: "starter";
  }
> = [
  {
    name: "Who hasn't replied",
    triggerPhrase: "who hasn't replied",
    goal: "List crew who received an Iris text and have not replied yet.",
    outputType: "report",
    allowedTools: "who_hasnt_replied",
    toolName: "who_hasnt_replied",
    kind: "starter",
  },
  {
    name: "Job risk brief",
    triggerPhrase: "job risk brief",
    goal: "Summarize schedule risk, open owners, and missing replies on a job.",
    outputType: "brief",
    allowedTools: "job_risk_brief,search_job_context",
    toolName: "job_risk_brief",
    kind: "starter",
  },
  {
    name: "Missed meeting recap",
    triggerPhrase: "draft a text to everyone who missed the meeting",
    goal: "Draft a recap for crew who missed the latest meeting. Preview only.",
    outputType: "crew_text",
    allowedTools: "missed_meeting_recap",
    toolName: "missed_meeting_recap",
    kind: "starter",
  },
];

export function inferToolName(goal: string, allowedTools: string[] = []) {
  const text = `${goal} ${allowedTools.join(" ")}`.toLowerCase();
  if (text.includes("repli") || text.includes("hasn't") || text.includes("no reply")) {
    return "who_hasnt_replied" as const;
  }
  if (text.includes("risk") || text.includes("delay") || text.includes("inspection")) {
    return "job_risk_brief" as const;
  }
  if (text.includes("missed") || text.includes("meeting") || text.includes("recap")) {
    return "missed_meeting_recap" as const;
  }
  if (allowedTools.includes("who_hasnt_replied")) return "who_hasnt_replied" as const;
  if (allowedTools.includes("job_risk_brief")) return "job_risk_brief" as const;
  if (allowedTools.includes("missed_meeting_recap")) {
    return "missed_meeting_recap" as const;
  }
  return "custom" as const;
}

export async function ensureStarterWorkflows(orgId: string, userId: string) {
  const existing = await db
    .select()
    .from(orgWorkflows)
    .where(eq(orgWorkflows.orgId, orgId));

  for (const starter of STARTER_WORKFLOWS) {
    const already = existing.find(
      (row) => row.kind === "starter" && row.toolName === starter.toolName
    );
    if (already) continue;
    await db.insert(orgWorkflows).values({
      id: nanoid(),
      orgId,
      name: starter.name,
      triggerPhrase: starter.triggerPhrase,
      goal: starter.goal,
      outputType: starter.outputType,
      allowedTools: starter.allowedTools,
      toolName: starter.toolName,
      kind: starter.kind,
      createdByUserId: userId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

export async function listOrgWorkflows(orgId: string) {
  const workflows = await db
    .select()
    .from(orgWorkflows)
    .where(eq(orgWorkflows.orgId, orgId))
    .orderBy(desc(orgWorkflows.createdAt));

  const withRuns = await Promise.all(
    workflows.map(async (workflow) => {
      const [latestRun] = await db
        .select()
        .from(workflowRuns)
        .where(eq(workflowRuns.workflowId, workflow.id))
        .orderBy(desc(workflowRuns.createdAt))
        .limit(1);
      return { ...workflow, latestRun: latestRun ?? null };
    })
  );

  return withRuns;
}

export async function runNoReplyReport(userId: string, jobQuery?: string) {
  const org = await getUserOrg(userId);
  if (!org) return { ok: false as const, message: "No company profile found yet." };

  const jobList = await resolveJobsForQuery(org.id, jobQuery);
  const followUp = await getFollowUpForJobs(jobList);
  const missing = followUp.filter((row) => row.status === "sent_no_reply");

  return {
    ok: true as const,
    org: { id: org.id, name: org.name },
    jobQuery: jobQuery ?? null,
    missing,
    sources: missing.map((row) => ({
      type: "outbound" as const,
      jobId: row.jobId,
      jobName: row.jobName,
      title: `${row.name} has not replied`,
      snippet: row.lastOutboundBody ?? "Iris text sent, no reply yet.",
    })),
    summary:
      missing.length === 0
        ? "Everyone who got a text has replied, or no follow-up texts have gone out yet."
        : `${missing.length} crew ${missing.length === 1 ? "member has" : "members have"} not replied.`,
  };
}

export async function runJobRiskBrief(userId: string, jobQuery?: string) {
  const org = await getUserOrg(userId);
  if (!org) return { ok: false as const, message: "No company profile found yet." };

  const jobList = await resolveJobsForQuery(org.id, jobQuery);
  const followUp = await getFollowUpForJobs(jobList);
  const context = await searchJobContext(userId, jobQuery || "risk delay inspection");
  const briefs = [];

  for (const job of jobList.slice(0, 4)) {
    const [latestMeeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.jobId, job.id))
      .orderBy(desc(meetings.createdAt))
      .limit(1);
    const parsed = latestMeeting
      ? parseMeetingExtract(latestMeeting.extracted)
      : null;
    const jobFollowUp = followUp.filter((row) => row.jobId === job.id);
    briefs.push({
      jobId: job.id,
      jobName: job.name,
      address: job.address,
      latestMeeting: latestMeeting
        ? {
            id: latestMeeting.id,
            title: latestMeeting.title,
            decisions: parsed?.decisions ?? [],
            owners: parsed?.owners ?? [],
            draftRecap: parsed?.draftRecap ?? "",
          }
        : null,
      noReplies: jobFollowUp.filter((row) => row.status === "sent_no_reply"),
      openOwners: parsed?.owners ?? [],
    });
  }

  return {
    ok: true as const,
    org: { id: org.id, name: org.name },
    briefs,
    sources: context.matches,
    summary: `Risk brief for ${briefs.length} job${briefs.length === 1 ? "" : "s"}.`,
  };
}

export async function runMissedMeetingRecap(userId: string, jobQuery?: string) {
  const org = await getUserOrg(userId);
  if (!org) return { ok: false as const, message: "No company profile found yet." };

  const jobList = await resolveJobsForQuery(org.id, jobQuery);
  const job = jobList[0];
  if (!job) {
    return { ok: false as const, message: "No jobs found yet." };
  }

  const [latestMeeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.jobId, job.id))
    .orderBy(desc(meetings.createdAt))
    .limit(1);
  if (!latestMeeting) {
    return {
      ok: false as const,
      message: `No meeting on ${job.name} yet.`,
    };
  }

  const parsed = parseMeetingExtract(latestMeeting.extracted);
  const crew = await getOwnedPeople(job.id);
  let attendeeIds: string[] = [];
  try {
    const parsedIds = JSON.parse(latestMeeting.attendeePersonIds);
    attendeeIds = Array.isArray(parsedIds)
      ? parsedIds.filter((value: unknown): value is string => typeof value === "string")
      : [];
  } catch {
    attendeeIds = [];
  }

  const suggested = new Set(parsed.suggestedAbsenteeIds);
  const missed = crew.filter(
    (person) => suggested.has(person.id) || !attendeeIds.includes(person.id)
  );

  return {
    ok: true as const,
    org: { id: org.id, name: org.name },
    job: { id: job.id, name: job.name },
    meeting: {
      id: latestMeeting.id,
      title: latestMeeting.title,
      draftRecap: parsed.draftRecap,
      decisions: parsed.decisions,
      owners: parsed.owners,
    },
    recipients: missed.map((person) => ({
      id: person.id,
      name: person.name,
      role: person.role,
      phone: person.phone,
    })),
    previewText:
      parsed.draftRecap ||
      `${job.name}: recap from ${latestMeeting.title}. Review before send.`,
    sources: [
      {
        type: "meeting" as const,
        sourceId: latestMeeting.id,
        jobId: job.id,
        jobName: job.name,
        title: latestMeeting.title,
        snippet: parsed.draftRecap || latestMeeting.title,
      },
    ],
    note: "Preview only. Crew texts still go out from the job workspace after you approve.",
  };
}

export async function proposeWorkflow(input: {
  name: string;
  triggerPhrase: string;
  goal: string;
  outputType?: string;
  allowedTools?: string[];
}) {
  const allowedTools =
    input.allowedTools && input.allowedTools.length > 0
      ? input.allowedTools
      : ["search_job_context"];
  const outputType: WorkflowOutputType =
    input.outputType === "brief" ||
    input.outputType === "checklist" ||
    input.outputType === "crew_text" ||
    input.outputType === "report"
      ? input.outputType
      : "report";
  const proposal: WorkflowProposal = {
    name: input.name.trim(),
    triggerPhrase: input.triggerPhrase.trim(),
    goal: input.goal.trim(),
    outputType,
    allowedTools,
    toolName: inferToolName(input.goal, allowedTools),
  };

  return {
    proposal,
    preview: `If you approve, Iris will save “${proposal.name}” for this company. Trigger: “${proposal.triggerPhrase}”. It will use ${proposal.allowedTools.join(", ")} and return a ${proposal.outputType}. Nothing is saved until you say yes.`,
  };
}

export async function saveApprovedWorkflow(args: {
  userId: string;
  proposal: WorkflowProposal;
}) {
  const org = await getUserOrg(args.userId);
  if (!org) return { ok: false as const, message: "No company profile found yet." };

  const id = nanoid();
  await db.insert(orgWorkflows).values({
    id,
    orgId: org.id,
    name: args.proposal.name,
    triggerPhrase: args.proposal.triggerPhrase,
    goal: args.proposal.goal,
    outputType: args.proposal.outputType,
    allowedTools: args.proposal.allowedTools.join(","),
    toolName: args.proposal.toolName,
    kind: "custom",
    createdByUserId: args.userId,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [workflow] = await db
    .select()
    .from(orgWorkflows)
    .where(eq(orgWorkflows.id, id))
    .limit(1);

  return {
    ok: true as const,
    workflow,
    message: `Saved “${args.proposal.name}” for ${org.name}.`,
  };
}

export async function runSavedWorkflow(args: {
  userId: string;
  workflowId?: string;
  workflowName?: string;
  jobQuery?: string;
}) {
  const org = await getUserOrg(args.userId);
  if (!org) return { ok: false as const, message: "No company profile found yet." };

  const [workflow] = args.workflowId
    ? await db
        .select()
        .from(orgWorkflows)
        .where(
          and(eq(orgWorkflows.id, args.workflowId), eq(orgWorkflows.orgId, org.id))
        )
        .limit(1)
    : args.workflowName
      ? await db
          .select()
          .from(orgWorkflows)
          .where(
            and(
              eq(orgWorkflows.orgId, org.id),
              eq(orgWorkflows.name, args.workflowName)
            )
          )
          .limit(1)
      : [];

  if (!workflow) {
    return { ok: false as const, message: "Workflow not found for this company." };
  }

  return executeWorkflow({ userId: args.userId, workflow, jobQuery: args.jobQuery });
}

export async function executeWorkflow(args: {
  userId: string;
  workflow: OrgWorkflow;
  jobQuery?: string;
}) {
  const query = args.jobQuery?.trim() || args.workflow.triggerPhrase;
  let output: unknown;
  let jobId: string | null = null;
  let status: "completed" | "failed" = "completed";

  try {
    if (args.workflow.toolName === "who_hasnt_replied") {
      output = await runNoReplyReport(args.userId, query);
    } else if (args.workflow.toolName === "job_risk_brief") {
      output = await runJobRiskBrief(args.userId, query);
    } else if (args.workflow.toolName === "missed_meeting_recap") {
      const recap = await runMissedMeetingRecap(args.userId, query);
      output = recap;
      if (recap.ok && "job" in recap) jobId = recap.job.id;
    } else {
      const context = await searchJobContext(args.userId, `${args.workflow.goal} ${query}`);
      const noReply = await runNoReplyReport(args.userId, query);
      output = {
        ok: true,
        workflow: args.workflow.name,
        goal: args.workflow.goal,
        outputType: args.workflow.outputType,
        context,
        noReply,
      };
    }
  } catch (error) {
    status = "failed";
    output = {
      ok: false,
      message: error instanceof Error ? error.message : "Workflow failed",
    };
  }

  if (
    output &&
    typeof output === "object" &&
    "job" in output &&
    output.job &&
    typeof output.job === "object" &&
    "id" in output.job &&
    typeof output.job.id === "string"
  ) {
    jobId = output.job.id;
  }

  const runId = nanoid();
  await db.insert(workflowRuns).values({
    id: runId,
    workflowId: args.workflow.id,
    jobId,
    input: query,
    output: JSON.stringify(output),
    status,
    createdAt: new Date(),
  });

  return {
    ok: status === "completed",
    workflow: args.workflow,
    runId,
    output,
  };
}
