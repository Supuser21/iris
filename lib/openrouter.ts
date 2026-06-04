import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function getOpenRouterModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return null;
  }
  const openrouter = createOpenRouter({ apiKey });
  const modelId = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  return openrouter.chat(modelId);
}
