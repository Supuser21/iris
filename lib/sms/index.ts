import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { normalizePhone } from "@/lib/phone";
import { hasPingramConfig, sendViaPingram, getPingramFrom } from "@/lib/sms/pingram";
import { hasTelnyxConfig, sendViaTelnyx, getTelnyxFrom } from "@/lib/sms/telnyx";
import { hasTwilioConfig, sendViaTwilio, getTwilioFrom } from "@/lib/sms/twilio";

export type SendSmsOptions = { bypassOptOut?: boolean };

export type SmsProvider = "twilio" | "telnyx" | "pingram";

export function getActiveSmsProvider(): SmsProvider | null {
  const preferred = process.env.SMS_PROVIDER?.toLowerCase();
  if (preferred === "pingram" && hasPingramConfig()) return "pingram";
  if (preferred === "telnyx" && hasTelnyxConfig()) return "telnyx";
  if (preferred === "twilio" && hasTwilioConfig()) return "twilio";
  if (hasPingramConfig() && preferred !== "twilio" && preferred !== "telnyx") {
    return "pingram";
  }
  if (hasTelnyxConfig()) return "telnyx";
  if (hasTwilioConfig()) return "twilio";
  return null;
}

export function hasSms() {
  return getActiveSmsProvider() !== null;
}

export function getSmsFromNumber() {
  const provider = getActiveSmsProvider();
  if (provider === "pingram") return getPingramFrom();
  if (provider === "telnyx") return getTelnyxFrom();
  if (provider === "twilio") return getTwilioFrom();
  return null;
}

async function isOptedOut(phone: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  const [user] = await db
    .select({ smsOptOut: users.smsOptOut })
    .from(users)
    .where(eq(users.phone, normalized))
    .limit(1);
  return user?.smsOptOut === true;
}

export async function sendSms(
  to: string,
  body: string,
  opts?: SendSmsOptions
) {
  if (!opts?.bypassOptOut && (await isOptedOut(to))) {
    console.warn("[SMS] skipped — user opted out", { to });
    return { sid: "opt-out", status: "skipped" };
  }

  const provider = getActiveSmsProvider();
  if (!provider) {
    console.log(`[SMS dev] To ${to}: ${body}`);
    return { sid: "dev", status: "logged" };
  }
  try {
    if (provider === "pingram") return await sendViaPingram(to, body);
    if (provider === "telnyx") return await sendViaTelnyx(to, body);
    return await sendViaTwilio(to, body);
  } catch (err) {
    console.error(`[SMS] ${provider} send failed`, { to, err });
    throw err;
  }
}
