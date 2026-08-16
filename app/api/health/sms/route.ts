import { NextResponse } from "next/server";
import {
  getActiveSmsProvider,
  getSmsFromNumber,
  hasSms,
} from "@/lib/sms";
import { hasOpenRouter, hasGoogleOAuth, isDevOtpMode, getAppUrl } from "@/lib/env";
import { getLastCronAt } from "@/lib/cron/process";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = getActiveSmsProvider();
  const checklist = {
    appUrl: getAppUrl(),
    inboundWebhook: `${getAppUrl()}/api/sms/inbound`,
    smsProvider: provider,
    smsConfigured: hasSms(),
    smsFrom: getSmsFromNumber() ? "set" : "missing",
    devOtpMode: isDevOtpMode(),
    openRouter: hasOpenRouter(),
    googleOAuth: hasGoogleOAuth(),
    cronSecret: Boolean(process.env.CRON_SECRET),
    databaseUrl: Boolean(process.env.DATABASE_URL),
    pingramInboundNote:
      provider === "pingram"
        ? "Enable SMS_INBOUND on Pingram webhook; users must reply within 7 days of last outbound."
        : undefined,
  };

  const issues: string[] = [];
  if (!checklist.databaseUrl) issues.push("DATABASE_URL missing");
  if (!checklist.smsConfigured) issues.push("SMS provider not configured");
  if (checklist.devOtpMode) issues.push("DEV_OTP_MODE=true — outbound SMS may be dev-only");
  if (!checklist.openRouter) issues.push("OPENROUTER_API_KEY missing — agent replies disabled");
  if (!checklist.cronSecret) issues.push("CRON_SECRET missing — cron/health unprotected");

  return NextResponse.json({
    ok: issues.length === 0,
    checklist,
    issues,
    ranAt: new Date().toISOString(),
    lastCronAt: getLastCronAt(),
  });
}
