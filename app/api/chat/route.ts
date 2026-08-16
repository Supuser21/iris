import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/lib/init";
import {
  collectStreamText,
  runIrisAgentStream,
  saveMessage,
  sendLookupAck,
} from "@/lib/agent/run";
import { needsWebLookup } from "@/lib/agent/lookup";
import {
  advanceOnboarding,
  applyOnboardingUpdates,
} from "@/lib/onboarding";
import { runDueWorkInBackground } from "@/lib/cron/process";

export async function POST(req: Request) {
  await ensureDb();
  runDueWorkInBackground();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, mode } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }
  const agentMode = mode === "build" ? "build" : "ask";

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const lookup = needsWebLookup(message);
  let ack: string | undefined;
  if (lookup) {
    await saveMessage(user.id, "user", message, "web");
    ack = await sendLookupAck(user.id, "web");
  }

  if (!user.onboardingComplete) {
    const { updates } = await advanceOnboarding(user, message);
    if (Object.keys(updates).length > 0) {
      await applyOnboardingUpdates(user.id, updates);
    }
    const [updated] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    const agentUser = updated ?? user;
    const result = await runIrisAgentStream(agentUser, message, "web", {
      skipUserSave: lookup,
      mode: agentMode,
    });

    if (result.demo || !result.stream) {
      return NextResponse.json({ text: result.text, ack, demo: true });
    }

    const trimmed = (await collectStreamText(result.stream)).trim() || "Got it.";
    await saveMessage(user.id, "assistant", trimmed, "web");
    return NextResponse.json({ text: trimmed, ack, demo: false });
  }

  const result = await runIrisAgentStream(user, message, "web", {
    skipUserSave: lookup,
    mode: agentMode,
  });

  if (result.demo || !result.stream) {
    return NextResponse.json({ text: result.text, ack, demo: true });
  }

  const trimmed = (await collectStreamText(result.stream)).trim() || "Got it.";
  await saveMessage(user.id, "assistant", trimmed, "web");
  return NextResponse.json({ text: trimmed, ack, demo: false });
}
