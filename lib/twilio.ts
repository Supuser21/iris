import twilio from "twilio";
import { hasTwilio } from "@/lib/env";

export function getTwilioClient() {
  if (!hasTwilio()) return null;
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

export async function sendSms(to: string, body: string) {
  const client = getTwilioClient();
  if (!client) {
    console.log(`[SMS dev] To ${to}: ${body}`);
    return { sid: "dev", status: "logged" };
  }
  const truncated =
    body.length > 320 ? body.slice(0, 317) + "..." : body;
  return client.messages.create({
    body: truncated,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });
}
