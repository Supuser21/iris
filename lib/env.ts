export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getDemoUrl() {
  return process.env.NEXT_PUBLIC_DEMO_URL ?? "https://cal.com/patrykk";
}

export function hasOpenRouter() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

import { hasSms } from "@/lib/sms";

/** @deprecated Use hasSms() */
export function hasTwilio() {
  return hasSms();
}

export function hasGoogleOAuth() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

export function isDevOtpMode() {
  return process.env.DEV_OTP_MODE === "true" || !hasSms();
}

export function hasWebSearch() {
  return (
    hasOpenRouter() ||
    Boolean(process.env.TAVILY_API_KEY || process.env.SERPER_API_KEY)
  );
}
