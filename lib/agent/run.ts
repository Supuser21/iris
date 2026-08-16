import { streamText, stepCountIs } from "ai";
import { getOpenRouterModel, getOpenRouterWebSearchTool } from "@/lib/openrouter";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";
import { createIrisTools } from "@/lib/agent/tools";
import { getCompanyContextForUser } from "@/lib/construction";
import type { User } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import { hasOpenRouter, hasWebSearch } from "@/lib/env";
import { getLookupAck } from "@/lib/agent/lookup";

export async function loadChatHistory(userId: string, limit = 30) {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.userId, userId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

export async function saveMessage(
  userId: string,
  role: "user" | "assistant",
  content: string,
  channel: "web" | "sms" = "web"
) {
  await db.insert(messages).values({
    id: nanoid(),
    userId,
    role,
    content,
    channel,
  });
}

export async function sendLookupAck(
  userId: string,
  channel: "web" | "sms"
): Promise<string> {
  const ack = getLookupAck(channel);
  await saveMessage(userId, "assistant", ack, channel);
  return ack;
}

export async function runIrisAgent(
  user: User,
  userMessage: string,
  channel: "web" | "sms" = "web",
  opts?: { skipUserSave?: boolean }
) {
  if (!opts?.skipUserSave) {
    await saveMessage(user.id, "user", userMessage, channel);
  }

  if (!hasOpenRouter()) {
    const fallback = getDemoReply(user, userMessage);
    await saveMessage(user.id, "assistant", fallback, channel);
    return { text: fallback, demo: true, smsSent: false };
  }

  const model = getOpenRouterModel();
  if (!model) {
    const fallback =
      "I'm having trouble connecting right now. Add OPENROUTER_API_KEY to enable chat.";
    await saveMessage(user.id, "assistant", fallback, channel);
    return { text: fallback, demo: true, smsSent: false };
  }

  const history = await loadChatHistory(user.id);
  const { tools, getSmsSent } = buildIrisTools(user);
  const systemPrompt = await buildSystemPrompt(
    user,
    channel,
    await getCompanyContextForUser(user.id)
  );

  const result = streamText({
    model,
    system: systemPrompt,
    messages: [...history, { role: "user", content: userMessage }],
    tools,
    stopWhen: stepCountIs(hasWebSearch() ? 8 : 5),
    maxOutputTokens: channel === "sms" ? 400 : 700,
  });

  const trimmed = (await collectStreamText(result)).trim() || "Got it.";
  await saveMessage(user.id, "assistant", trimmed, channel);
  return { text: trimmed, demo: false, smsSent: getSmsSent() };
}

export async function collectStreamText(result: {
  text: PromiseLike<string>;
  textStream: AsyncIterable<string>;
}): Promise<string> {
  const full = await result.text;
  if (full.trim()) return full;
  let streamed = "";
  for await (const chunk of result.textStream) {
    streamed += chunk;
  }
  return streamed;
}

export async function runIrisAgentStream(
  user: User,
  userMessage: string,
  channel: "web" | "sms" = "web",
  opts?: { skipUserSave?: boolean }
) {
  if (!opts?.skipUserSave) {
    await saveMessage(user.id, "user", userMessage, channel);
  }

  if (!hasOpenRouter()) {
    const fallback = getDemoReply(user, userMessage);
    await saveMessage(user.id, "assistant", fallback, channel);
    return { stream: null as null, text: fallback, demo: true };
  }

  const model = getOpenRouterModel();
  if (!model) {
    const text =
      "I'm having trouble connecting right now. Add OPENROUTER_API_KEY to enable chat.";
    await saveMessage(user.id, "assistant", text, channel);
    return { stream: null, text, demo: true };
  }

  const history = await loadChatHistory(user.id);
  const { tools, getSmsSent } = buildIrisTools(user);
  const systemPrompt = await buildSystemPrompt(
    user,
    channel,
    await getCompanyContextForUser(user.id)
  );

  const result = streamText({
    model,
    system: systemPrompt,
    messages: [...history, { role: "user", content: userMessage }],
    tools,
    stopWhen: stepCountIs(hasWebSearch() ? 8 : 5),
    maxOutputTokens: channel === "sms" ? 400 : 700,
  });

  return { stream: result, demo: false, getSmsSent };
}

function buildIrisTools(user: User) {
  let smsSent = false;
  const irisTools = createIrisTools(user, {
    onSmsSent: () => {
      smsSent = true;
    },
  });
  const webSearch = getOpenRouterWebSearchTool();
  const tools = webSearch ? { ...irisTools, web_search: webSearch } : irisTools;
  return { tools, getSmsSent: () => smsSent };
}

function getDemoReply(user: User, msg: string): string {
  const lower = msg.toLowerCase();
  if (user.onboardingStep === "welcome" || !user.name) {
    return "Hey — I'm Iris. Add your OpenRouter API key to unlock full chat. For now: what's your name?";
  }
  if (lower.includes("remind")) {
    return "On it — once API keys are set, I'll schedule that reminder and text you. Try adding OPENROUTER_API_KEY.";
  }
  return "Got it. (Demo mode — add OPENROUTER_API_KEY in .env.local for full Iris.)";
}
