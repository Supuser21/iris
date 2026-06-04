import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/lib/init";
import {
  runIrisAgentStream,
  saveMessage,
} from "@/lib/agent/run";
import {
  advanceOnboarding,
  applyOnboardingUpdates,
} from "@/lib/onboarding";

export async function POST(req: Request) {
  ensureDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    const result = await runIrisAgentStream(agentUser, message, "web");

    if (result.demo || !result.stream) {
      return NextResponse.json({ text: result.text, demo: true });
    }

    let fullText = "";
    for await (const chunk of result.stream.textStream) {
      fullText += chunk;
    }
    const trimmed = fullText.trim() || "Got it.";
    await saveMessage(user.id, "assistant", trimmed, "web");
    return NextResponse.json({ text: trimmed, demo: false });
  }

  const result = await runIrisAgentStream(user, message, "web");

  if (result.demo || !result.stream) {
    return NextResponse.json({ text: result.text, demo: true });
  }

  let fullText = "";
  for await (const chunk of result.stream.textStream) {
    fullText += chunk;
  }
  const trimmed = fullText.trim() || "Got it.";
  await saveMessage(user.id, "assistant", trimmed, "web");
  return NextResponse.json({ text: trimmed, demo: false });
}
