import { anthropic } from "@ai-sdk/anthropic";

export function getAnthropicModel() {
  const modelId = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
  return anthropic(modelId);
}

export function hasAnthropicApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
