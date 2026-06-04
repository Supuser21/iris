import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { memories, reminders } from "@/lib/db/schema";

export type OnboardingStep =
  | "welcome"
  | "name"
  | "timezone"
  | "birthday"
  | "calendar"
  | "brief_time"
  | "try_reminder"
  | "complete";

export async function advanceOnboarding(
  user: User,
  message: string
): Promise<{ step: OnboardingStep; updates: Partial<User> }> {
  const lower = message.toLowerCase().trim();
  const skip =
    lower === "skip" ||
    lower.includes("reminders only") ||
    lower.includes("just reminders");

  const step = (user.onboardingStep ?? "welcome") as OnboardingStep;
  const updates: Record<string, unknown> = {};

  if (step === "welcome" || step === "name") {
    if (skip) {
      updates.onboardingStep = "complete";
      updates.onboardingComplete = true;
      return { step: "complete", updates: updates as Partial<User> };
    }
    if (message.length > 0 && message.length < 80) {
      updates.name = message.trim();
      updates.onboardingStep = "timezone";
      return { step: "timezone", updates: updates as Partial<User> };
    }
  }

  if (step === "timezone") {
    if (skip) {
      updates.onboardingStep = "birthday";
      return { step: "birthday", updates: updates as Partial<User> };
    }
    updates.timezone = message.trim() || "America/New_York";
    updates.onboardingStep = "birthday";
    return { step: "birthday", updates: updates as Partial<User> };
  }

  if (step === "birthday") {
    if (skip) {
      updates.onboardingStep = "calendar";
      return { step: "calendar", updates: updates as Partial<User> };
    }
    const parsed = parseBirthday(message);
    if (parsed) {
      await db.insert(memories).values({
        id: nanoid(),
        userId: user.id,
        content: `User birthday: ${parsed.label}`,
        tags: "birthday",
      });
      const due = parsed.nextOccurrence;
      await db.insert(reminders).values({
        id: nanoid(),
        userId: user.id,
        message: `Happy birthday${user.name ? ", " + user.name : ""}! 🎂`,
        dueAt: due,
        repeatRule: "yearly",
      });
      updates.onboardingStep = "calendar";
      return { step: "calendar", updates: updates as Partial<User> };
    }
  }

  if (step === "calendar") {
    updates.onboardingStep = skip ? "try_reminder" : "brief_time";
    if (skip) updates.onboardingComplete = true;
    return {
      step: skip ? "try_reminder" : "brief_time",
      updates: updates as Partial<User>,
    };
  }

  if (step === "brief_time") {
    updates.morningBriefTime = message.trim() || "07:00";
    updates.morningBriefEnabled = !skip;
    updates.onboardingStep = "try_reminder";
    return { step: "try_reminder", updates: updates as Partial<User> };
  }

  if (step === "try_reminder") {
    updates.onboardingComplete = true;
    updates.onboardingStep = "complete";
    return { step: "complete", updates: updates as Partial<User> };
  }

  return { step, updates: {} };
}

function parseBirthday(input: string): {
  label: string;
  nextOccurrence: Date;
} | null {
  const months: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const lower = input.toLowerCase();
  for (const [name, idx] of Object.entries(months)) {
    if (lower.includes(name)) {
      const dayMatch = input.match(/\b(\d{1,2})\b/);
      const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
      const now = new Date();
      let next = new Date(now.getFullYear(), idx, day, 9, 0, 0);
      if (next < now) next = new Date(now.getFullYear() + 1, idx, day, 9, 0, 0);
      return {
        label: `${name.charAt(0).toUpperCase() + name.slice(1)} ${day}`,
        nextOccurrence: next,
      };
    }
  }
  const slash = input.match(/(\d{1,2})[\/\-](\d{1,2})/);
  if (slash) {
    const m = parseInt(slash[1], 10) - 1;
    const d = parseInt(slash[2], 10);
    const now = new Date();
    let next = new Date(now.getFullYear(), m, d, 9, 0, 0);
    if (next < now) next = new Date(now.getFullYear() + 1, m, d, 9, 0, 0);
    return { label: input, nextOccurrence: next };
  }
  return null;
}

export async function applyOnboardingUpdates(
  userId: string,
  updates: Partial<User>
) {
  await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
