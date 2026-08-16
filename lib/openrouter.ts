import { createOpenRouter, type OpenRouterProvider } from "@openrouter/ai-sdk-provider";

let client: OpenRouterProvider | null = null;

export function getOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = createOpenRouter({
      apiKey,
      compatibility: "strict",
    });
  }
  return client;
}

export function getOpenRouterModel() {
  const openrouter = getOpenRouter();
  if (!openrouter) return null;
  const modelId = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  return openrouter.chat(modelId);
}

/** OpenRouter-hosted web search — billed on your OpenRouter account, no Tavily key. */
export function getOpenRouterWebSearchTool() {
  const openrouter = getOpenRouter();
  if (!openrouter) return null;
  return openrouter.tools.webSearch({
    maxResults: 5,
    engine: "auto",
  });
}
