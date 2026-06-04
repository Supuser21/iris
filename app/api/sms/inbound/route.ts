import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/lib/init";
import { runIrisAgent } from "@/lib/agent/run";
import {
  advanceOnboarding,
  applyOnboardingUpdates,
} from "@/lib/onboarding";
import { sendSms } from "@/lib/twilio";

export async function POST(req: Request) {
  ensureDb();
  const contentType = req.headers.get("content-type") ?? "";
  let from = "";
  let body = "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    from = String(form.get("From") ?? "");
    body = String(form.get("Body") ?? "");
  } else {
    const json = await req.json();
    from = json.From ?? json.from ?? "";
    body = json.Body ?? json.body ?? "";
  }

  if (!from || !body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.phone, from))
    .limit(1);

  if (!user) {
    await sendSms(
      from,
      "Hey — sign up at our site first so I know it's you. Then text me anytime."
    );
    return new NextResponse("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (!user.onboardingComplete) {
    const { updates } = await advanceOnboarding(user, body);
    if (Object.keys(updates).length > 0) {
      await applyOnboardingUpdates(user.id, updates);
    }
    const [updated] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    const { text } = await runIrisAgent(updated ?? user, body, "sms");
    await sendSms(from, text);
    return twimlEmpty();
  }

  const { text } = await runIrisAgent(user, body, "sms");
  await sendSms(from, text);
  return twimlEmpty();
}

function twimlEmpty() {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { "Content-Type": "text/xml" },
  });
}
