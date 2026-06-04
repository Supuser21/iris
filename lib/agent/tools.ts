import { tool } from "ai";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { memories, tasks, reminders } from "@/lib/db/schema";
import { eq, and, desc, lte } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import type { User } from "@/lib/db/schema";
import { getCalendarEvents } from "@/lib/google-calendar";
import { sendSms } from "@/lib/twilio";

export function createIrisTools(user: User) {
  const userId = user.id;

  return {
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
      description: "Get upcoming Google Calendar events if connected",
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
      execute: async () => {
        const openTasks = await db
          .select()
          .from(tasks)
          .where(and(eq(tasks.userId, userId), eq(tasks.completed, false)));
        const mems = await db
          .select()
          .from(memories)
          .where(eq(memories.userId, userId))
          .orderBy(desc(memories.createdAt))
          .limit(5);
        const upcoming = await db
          .select()
          .from(reminders)
          .where(
            and(eq(reminders.userId, userId), eq(reminders.cancelled, false))
          );
        const cal = await getCalendarEvents(user, 1);
        return {
          tasks: openTasks.map((t) => t.title),
          memories: mems.map((m) => m.content),
          reminders: upcoming
            .filter((r) => r.dueAt > new Date())
            .slice(0, 5)
            .map((r) => ({ message: r.message, dueAt: r.dueAt.toISOString() })),
          calendar: cal,
        };
      },
    }),

    send_sms: tool({
      description:
        "Send an SMS to the user. Use sparingly for proactive nudges.",
      inputSchema: z.object({ message: z.string() }),
      execute: async ({ message }) => {
        await sendSms(user.phone, message);
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

  for (const r of due) {
    const [u] = await db
      .select()
      .from(users)
      .where(eq(users.id, r.userId))
      .limit(1);
    if (!u) continue;
    await sendSms(u.phone, r.message);
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
  return due.length;
}
