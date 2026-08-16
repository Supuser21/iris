import { db } from "@/lib/db";
import { memories, reminders, tasks, users } from "@/lib/db/schema";
import type { User } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCalendarEvents } from "@/lib/google-calendar";

export type DailyBriefData = {
  tasks: string[];
  memories: string[];
  reminders: { message: string; dueAt: string }[];
  calendar: Awaited<ReturnType<typeof getCalendarEvents>>;
};

export async function fetchDailyBriefData(user: User): Promise<DailyBriefData> {
  const userId = user.id;
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
    .where(and(eq(reminders.userId, userId), eq(reminders.cancelled, false)));
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
}

export function formatMorningBriefSms(
  user: User,
  data: DailyBriefData
): string {
  const name = user.name?.split(" ")[0] ?? "there";
  const lines: string[] = [`Morning, ${name} —`];

  if (data.calendar.connected && data.calendar.events.length > 0) {
    const top = data.calendar.events.slice(0, 3);
    lines.push(
      `Calendar: ${top.map((e) => e.summary).join("; ")}`
    );
  }

  if (data.reminders.length > 0) {
    lines.push(
      `Reminders: ${data.reminders.map((r) => r.message).join("; ")}`
    );
  }

  if (data.tasks.length > 0) {
    lines.push(`Tasks: ${data.tasks.slice(0, 5).join("; ")}`);
  }

  if (data.memories.length > 0) {
    lines.push(`Note: ${data.memories[0]}`);
  }

  if (lines.length === 1) {
    lines.push("Nothing on the board — light day. Text me if you need anything.");
  }

  const text = lines.join("\n");
  return text.length > 320 ? `${text.slice(0, 317)}…` : text;
}

export function getLocalDateKey(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA").format(new Date());
  }
}
