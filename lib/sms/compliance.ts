import { db } from "@/lib/db";
import { people, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAppUrl } from "@/lib/env";
import { sendSms } from "@/lib/sms";
import { saveMessage } from "@/lib/agent/run";
import { normalizePhone } from "@/lib/phone";

export type ComplianceResult =
  | { handled: false }
  | { handled: true; action: "stop" | "start" | "help" };

const STOP_KEYWORDS = new Set([
  "stop",
  "stopall",
  "unsubscribe",
  "cancel",
  "end",
  "quit",
]);

const START_KEYWORDS = new Set(["start", "unstop", "yes", "subscribe"]);

function normalizeKeyword(body: string): string {
  return body.trim().toLowerCase().replace(/\s+/g, "");
}

export function parseSmsCompliance(body: string): ComplianceResult {
  const word = normalizeKeyword(body);
  if (STOP_KEYWORDS.has(word)) return { handled: true, action: "stop" };
  if (START_KEYWORDS.has(word)) return { handled: true, action: "start" };
  if (word === "help") return { handled: true, action: "help" };
  return { handled: false };
}

export async function handleSmsCompliance(
  phone: string,
  body: string,
  userId?: string
): Promise<ComplianceResult> {
  const parsed = parseSmsCompliance(body);
  if (!parsed.handled) return parsed;

  const normalizedPhone = normalizePhone(phone);
  const signupUrl = getAppUrl();
  const settingsUrl = `${signupUrl}/settings`;
  const matchingCrew = normalizedPhone
    ? await db.select().from(people).where(eq(people.phone, normalizedPhone))
    : [];

  if (parsed.action === "stop") {
    if (userId) {
      await db
        .update(users)
        .set({ smsOptOut: true, updatedAt: new Date() })
        .where(eq(users.id, userId));
      await saveMessage(userId, "user", body, "sms");
      const reply =
        "You're unsubscribed from Iris texts. Reply START to opt back in. Help: HELP";
      await saveMessage(userId, "assistant", reply, "sms");
    }
    if (matchingCrew.length > 0) {
      await db
        .update(people)
        .set({ smsOptOut: true, updatedAt: new Date() })
        .where(eq(people.phone, normalizedPhone));
    }
    await sendSms(phone, "You're unsubscribed from Iris texts. Reply START to opt back in.", {
      bypassOptOut: true,
    });
    return parsed;
  }

  if (parsed.action === "start") {
    if (userId) {
      await db
        .update(users)
        .set({ smsOptOut: false, updatedAt: new Date() })
        .where(eq(users.id, userId));
      await saveMessage(userId, "user", body, "sms");
      const reply = "You're back on — text me anytime.";
      await saveMessage(userId, "assistant", reply, "sms");
    }
    if (matchingCrew.length > 0) {
      await db
        .update(people)
        .set({ smsOptOut: false, updatedAt: new Date() })
        .where(eq(people.phone, normalizedPhone));
    }
    await sendSms(phone, "You're back on — text me anytime.", { bypassOptOut: true });
    return parsed;
  }

  const helpText = userId
    ? `Iris: reminders, tasks, morning brief. Settings: ${settingsUrl} Reply STOP to unsubscribe.`
    : matchingCrew.length > 0
      ? "Iris for job updates. Reply STOP to opt out or START to opt back in."
      : `Iris assistant. Sign up: ${signupUrl}/signup Reply STOP to unsubscribe.`;
  if (userId) {
    await saveMessage(userId, "user", body, "sms");
    await saveMessage(userId, "assistant", helpText, "sms");
  }
  await sendSms(phone, helpText, { bypassOptOut: true });
  return parsed;
}
