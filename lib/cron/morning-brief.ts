import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sendSms } from "@/lib/twilio";
import { runIrisAgent } from "@/lib/agent/run";

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
    if (!user.morningBriefEnabled || !user.morningBriefTime) continue;
    const [h, m] = user.morningBriefTime.split(":").map(Number);
    const local = getLocalHourMinute(user.timezone ?? "America/New_York");
    if (local.hour !== h || local.minute !== m) continue;

    const { text } = await runIrisAgent(
      user,
      "Generate my morning brief for today. Keep it short — 3-5 lines max.",
      "sms"
    );
    await sendSms(user.phone, text);
    sent++;
  }

  return sent;
}
