export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function hasOpenRouter() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function hasTwilio() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

export function hasGoogleOAuth() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

export function isDevOtpMode() {
  return process.env.DEV_OTP_MODE === "true" || !hasTwilio();
}
