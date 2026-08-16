import { tool } from "ai";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  memories,
  orgMemories,
  reminders,
  tasks,
} from "@/lib/db/schema";
import { eq, and, desc, lte } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import type { User } from "@/lib/db/schema";
import { searchJobContext } from "@/lib/agent/job-context";
import {
  inferToolName,
  listOrgWorkflows,
  proposeWorkflow,
  runJobRiskBrief,
  runMissedMeetingRecap,
  runNoReplyReport,
  runSavedWorkflow,
  saveApprovedWorkflow,
} from "@/lib/agent/workflows";
import { getUserOrg } from "@/lib/construction";
import { getCalendarEvents } from "@/lib/google-calendar";
import { fetchDailyBriefData } from "@/lib/cron/daily-brief";
import { sendSms } from "@/lib/sms";
import { fetchWebPage } from "@/lib/web/fetch-page";

export function createIrisTools(
  user: User,
  callbacks?: { onSmsSent?: () => void }
) {
  const userId = user.id;

  return {
    read_webpage: tool({
      description:
        "Fetch readable text from a public URL the user gave or you found via search",
      inputSchema: z.object({
        url: z.string().describe("Full https URL"),
      }),
      execute: async ({ url }) => {
        const content = await fetchWebPage(url);
        return { url, content };
      },
    }),
    save_memory: tool({
      description: "Save a fact or preference about the user for long-term memory",
      inputSchema: z.object({
        content: z.string().describe("The fact to remember"),
        tags: z.string().optional().describe("Optional comma-separated tags"),
      }),
      execute: async ({ content, tags }) => {
        const id = nanoid();
        await db.insert(memories).values({ id, userId, content, tags });
        return { ok: true, id, message: "Saved to memory." };
      },
    }),

    search_memory: tool({
      description: "Search stored memories for this user",
      inputSchema: z.object({
        query: z.string().describe("Search query"),
      }),
      execute: async ({ query }) => {
        const all = await db
          .select()
          .from(memories)
          .where(eq(memories.userId, userId))
          .orderBy(desc(memories.createdAt))
          .limit(50);
        const q = query.toLowerCase();
        const matched = all.filter(
          (m) =>
            m.content.toLowerCase().includes(q) ||
            (m.tags?.toLowerCase().includes(q) ?? false)
        );
        return { memories: matched.slice(0, 10).map((m) => m.content) };
      },
    }),

    search_job_context: tool({
      description:
        "Search this company's jobs, notes, meetings, crew texts, replies, and preferences. Always cite the returned sources.",
      inputSchema: z.object({
        query: z.string().describe("Job question or search phrase"),
      }),
      execute: async ({ query }) => searchJobContext(userId, query),
    }),

    who_hasnt_replied: tool({
      description:
        "Report which crew members received an Iris text and have not replied. Use for 'who hasn't replied' questions.",
      inputSchema: z.object({
        jobQuery: z
          .string()
          .optional()
          .describe("Optional job name like Riverside"),
      }),
      execute: async ({ jobQuery }) => runNoReplyReport(userId, jobQuery),
    }),

    job_risk_brief: tool({
      description:
        "Build a job risk brief from the latest meeting, open owners, and missing replies.",
      inputSchema: z.object({
        jobQuery: z.string().optional().describe("Optional job name"),
      }),
      execute: async ({ jobQuery }) => runJobRiskBrief(userId, jobQuery),
    }),

    missed_meeting_recap: tool({
      description:
        "Draft a recap for crew who missed the latest meeting. Preview only — do not send.",
      inputSchema: z.object({
        jobQuery: z.string().optional().describe("Optional job name"),
      }),
      execute: async ({ jobQuery }) => runMissedMeetingRecap(userId, jobQuery),
    }),

    list_company_workflows: tool({
      description: "List saved company workflows for this org",
      inputSchema: z.object({}),
      execute: async () => {
        const org = await getUserOrg(userId);
        if (!org) return { workflows: [] };
        const workflows = await listOrgWorkflows(org.id);
        return {
          workflows: workflows.map((workflow) => ({
            id: workflow.id,
            name: workflow.name,
            triggerPhrase: workflow.triggerPhrase,
            goal: workflow.goal,
            outputType: workflow.outputType,
            kind: workflow.kind,
            latestRunAt: workflow.latestRun?.createdAt ?? null,
          })),
        };
      },
    }),

    run_company_workflow: tool({
      description: "Run a saved company workflow by id or name",
      inputSchema: z.object({
        workflowId: z.string().optional(),
        workflowName: z.string().optional(),
        jobQuery: z.string().optional(),
      }),
      execute: async ({ workflowId, workflowName, jobQuery }) =>
        runSavedWorkflow({ userId, workflowId, workflowName, jobQuery }),
    }),

    propose_workflow: tool({
      description:
        "Propose a repeatable company workflow. Do not save until the user approves.",
      inputSchema: z.object({
        name: z.string(),
        triggerPhrase: z.string(),
        goal: z.string(),
        outputType: z
          .enum(["report", "brief", "checklist", "crew_text"])
          .optional(),
        allowedTools: z.array(z.string()).optional(),
      }),
      execute: async (input) => proposeWorkflow(input),
    }),

    save_approved_workflow: tool({
      description:
        "Save a proposed workflow after the user clearly approves it. Never save without approval.",
      inputSchema: z.object({
        name: z.string(),
        triggerPhrase: z.string(),
        goal: z.string(),
        outputType: z.enum(["report", "brief", "checklist", "crew_text"]),
        allowedTools: z.array(z.string()),
        toolName: z
          .enum([
            "who_hasnt_replied",
            "job_risk_brief",
            "missed_meeting_recap",
            "search_job_context",
            "custom",
          ])
          .optional(),
      }),
      execute: async (proposal) =>
        saveApprovedWorkflow({
          userId,
          proposal: {
            ...proposal,
            toolName:
              proposal.toolName ??
              inferToolName(proposal.goal, proposal.allowedTools),
          },
        }),
    }),

    save_company_preference: tool({
      description:
        "Save a company-specific preference, habit, or communication rule so Iris adapts to that firm's style",
      inputSchema: z.object({
        content: z.string().describe("The company-specific preference to remember"),
        tags: z.string().optional().describe("Optional tags like recap, tone, crew"),
      }),
      execute: async ({ content, tags }) => {
        const org = await getUserOrg(userId);
        if (!org) {
          return { ok: false, message: "No company profile found yet." };
        }

        const id = nanoid();
        await db.insert(orgMemories).values({
          id,
          orgId: org.id,
          content,
          tags: tags ?? null,
          sourceType: "pm_chat",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { ok: true, id, message: "Saved as a company preference." };
      },
    }),

    create_task: tool({
      description: "Create a todo task for the user",
      inputSchema: z.object({
        title: z.string(),
        dueAt: z.string().optional().describe("ISO datetime optional"),
      }),
      execute: async ({ title, dueAt }) => {
        const id = nanoid();
        await db.insert(tasks).values({
          id,
          userId,
          title,
          dueAt: dueAt ? new Date(dueAt) : null,
        });
        return { ok: true, id, title };
      },
    }),

    list_tasks: tool({
      description: "List open tasks for the user",
      inputSchema: z.object({
        includeCompleted: z.boolean().optional(),
      }),
      execute: async ({ includeCompleted }) => {
        const all = await db
          .select()
          .from(tasks)
          .where(eq(tasks.userId, userId))
          .orderBy(desc(tasks.createdAt));
        const filtered = includeCompleted
          ? all
          : all.filter((t) => !t.completed);
        return {
          tasks: filtered.map((t) => ({
            id: t.id,
            title: t.title,
            dueAt: t.dueAt?.toISOString(),
            completed: t.completed,
          })),
        };
      },
    }),

    complete_task: tool({
      description: "Mark a task as completed",
      inputSchema: z.object({ taskId: z.string() }),
      execute: async ({ taskId }) => {
        await db
          .update(tasks)
          .set({ completed: true })
          .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
        return { ok: true };
      },
    }),

    create_reminder: tool({
      description:
        "Create a reminder to text the user at a specific time. Use repeatRule yearly for birthdays.",
      inputSchema: z.object({
        message: z.string(),
        dueAt: z.string().describe("ISO datetime when to send reminder"),
        repeatRule: z
          .enum(["yearly", "weekly", "daily"])
          .optional()
          .nullable(),
      }),
      execute: async ({ message, dueAt, repeatRule }) => {
        const id = nanoid();
        await db.insert(reminders).values({
          id,
          userId,
          message,
          dueAt: new Date(dueAt),
          repeatRule: repeatRule ?? null,
        });
        return {
          ok: true,
          id,
          dueAt,
          message: `Reminder set for ${new Date(dueAt).toLocaleString()}`,
        };
      },
    }),

    list_reminders: tool({
      description: "List upcoming reminders",
      inputSchema: z.object({}),
      execute: async () => {
        const now = new Date();
        const all = await db
          .select()
          .from(reminders)
          .where(
            and(eq(reminders.userId, userId), eq(reminders.cancelled, false))
          )
          .orderBy(reminders.dueAt);
        return {
          reminders: all
            .filter((r) => !r.sent || r.repeatRule)
            .map((r) => ({
              id: r.id,
              message: r.message,
              dueAt: r.dueAt.toISOString(),
              repeatRule: r.repeatRule,
            })),
        };
      },
    }),

    cancel_reminder: tool({
      description: "Cancel a reminder by id",
      inputSchema: z.object({ reminderId: z.string() }),
      execute: async ({ reminderId }) => {
        await db
          .update(reminders)
          .set({ cancelled: true })
          .where(
            and(eq(reminders.id, reminderId), eq(reminders.userId, userId))
          );
        return { ok: true };
      },
    }),

    get_calendar_events: tool({
      description:
        "Get Google Calendar events when the user has connected Google in Settings",
      inputSchema: z.object({
        days: z.number().optional().default(1),
      }),
      execute: async ({ days }) => {
        const [fresh] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        if (!fresh) return { connected: false, events: [] };
        return getCalendarEvents(fresh, days ?? 1);
      },
    }),

    generate_daily_brief: tool({
      description: "Generate a morning brief for the user",
      inputSchema: z.object({}),
      execute: async () => fetchDailyBriefData(user),
    }),

    send_sms: tool({
      description:
        "Send an SMS to the user's phone. On SMS channel, use this to deliver links when they say send/text me the link — put the full https URL in the message body.",
      inputSchema: z.object({ message: z.string() }),
      execute: async ({ message }) => {
        await sendSms(user.phone, message);
        callbacks?.onSmsSent?.();
        return { ok: true };
      },
    }),
  };
}

export async function processDueReminders() {
  const now = new Date();
  const due = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.sent, false),
        eq(reminders.cancelled, false),
        lte(reminders.dueAt, now)
      )
    );

  let sentCount = 0;
  for (const r of due) {
    const [u] = await db
      .select()
      .from(users)
      .where(eq(users.id, r.userId))
      .limit(1);
    if (!u) continue;
    if (u.smsOptOut) continue;
    await sendSms(u.phone, r.message);
    sentCount += 1;
    if (r.repeatRule === "yearly") {
      const next = new Date(r.dueAt);
      next.setFullYear(next.getFullYear() + 1);
      await db
        .update(reminders)
        .set({ dueAt: next, sent: false })
        .where(eq(reminders.id, r.id));
    } else if (r.repeatRule === "weekly") {
      const next = new Date(r.dueAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      await db
        .update(reminders)
        .set({ dueAt: next, sent: false })
        .where(eq(reminders.id, r.id));
    } else if (r.repeatRule === "daily") {
      const next = new Date(r.dueAt.getTime() + 24 * 60 * 60 * 1000);
      await db
        .update(reminders)
        .set({ dueAt: next, sent: false })
        .where(eq(reminders.id, r.id));
    } else {
      await db
        .update(reminders)
        .set({ sent: true })
        .where(eq(reminders.id, r.id));
    }
  }
  return sentCount;
}
