import { processDueReminders } from "@/lib/agent/tools";
import { sendMorningBriefs } from "@/lib/cron/morning-brief";

let lastCronAt: string | null = null;

export async function runDueWork() {
  const ranAt = new Date().toISOString();
  const remindersSent = await processDueReminders();
  const briefsSent = await sendMorningBriefs();
  lastCronAt = ranAt;

  console.info("[cron/process]", { ranAt, remindersSent, briefsSent });

  return { ranAt, remindersSent, briefsSent };
}

export async function runDueWorkInBackground() {
  runDueWork().catch((err) => {
    console.error("[cron/process] opportunistic run failed", err);
  });
}

export function getLastCronAt() {
  return lastCronAt;
}
