import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendSms } from "@/lib/sms";
import {
  fetchDailyBriefData,
  formatMorningBriefSms,
  getLocalDateKey,
} from "@/lib/cron/daily-brief";

function getLocalHourMinute(timezone: string): { hour: number; minute: number } {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const minute = parseInt(
      parts.find((p) => p.type === "minute")?.value ?? "0",
      10
    );
    return { hour, minute };
  } catch {
    return { hour: 7, minute: 0 };
  }
}

export async function sendMorningBriefs() {
  const allUsers = await db.select().from(users);
  let sent = 0;

  for (const user of allUsers) {
    if (user.smsOptOut) continue;
    if (!user.morningBriefEnabled || !user.morningBriefTime) continue;

    const tz = user.timezone ?? "America/New_York";
    const [h, m] = user.morningBriefTime.split(":").map(Number);
    const local = getLocalHourMinute(tz);
    if (local.hour !== h) continue;
    if (local.minute < m || local.minute >= m + 5) continue;

    const todayKey = getLocalDateKey(tz);
    if (user.morningBriefLastSent === todayKey) continue;

    const data = await fetchDailyBriefData(user);
    const text = formatMorningBriefSms(user, data);
    await sendSms(user.phone, text);

    await db
      .update(users)
      .set({
        morningBriefLastSent: todayKey,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    sent++;
  }

  return sent;
}
