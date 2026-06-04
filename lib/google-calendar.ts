import { google } from "googleapis";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/lib/db/schema";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/google/callback`
  );
}

export function getGoogleAuthUrl(userId: string) {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
    state: userId,
  });
}

export async function exchangeGoogleCode(code: string, userId: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  await db
    .update(users)
    .set({
      googleAccessToken: tokens.access_token ?? null,
      googleRefreshToken: tokens.refresh_token ?? null,
      googleTokenExpiry: tokens.expiry_date ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  return tokens;
}

async function getAuthedClient(user: User) {
  if (!user.googleRefreshToken && !user.googleAccessToken) {
    return null;
  }
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    access_token: user.googleAccessToken ?? undefined,
    refresh_token: user.googleRefreshToken ?? undefined,
    expiry_date: user.googleTokenExpiry ?? undefined,
  });
  oauth2.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await db
        .update(users)
        .set({
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token ?? user.googleRefreshToken,
          googleTokenExpiry: tokens.expiry_date ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }
  });
  return google.calendar({ version: "v3", auth: oauth2 });
}

export async function getCalendarEvents(user: User, days = 1) {
  const calendar = await getAuthedClient(user);
  if (!calendar) {
    return { connected: false, events: [] as { summary: string; start: string }[] };
  }
  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 20,
  });
  const events = (res.data.items ?? []).map((e) => ({
    summary: e.summary ?? "Event",
    start: e.start?.dateTime ?? e.start?.date ?? "",
  }));
  return { connected: true, events };
}
