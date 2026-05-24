import { generateText, streamText } from "ai";
import { getAnthropicModel, hasAnthropicApiKey } from "@/lib/ai/anthropic";
import { buildGenerationPrompt, mockGeneratedMessage } from "./prompts";
import type { GenerateMessageInput, MessageContext } from "./types";

function parseModelJson(raw: string): { subject: string | null; body: string } {
  const trimmed = raw.trim();
  try {
    const json = JSON.parse(trimmed) as {
      subject?: string | null;
      body?: string;
    };
    return {
      subject: json.subject ?? null,
      body: json.body ?? trimmed,
    };
  } catch {
    return { subject: null, body: trimmed };
  }
}

export async function generateMessageContent(
  ctx: MessageContext,
  input: GenerateMessageInput,
): Promise<{ subject: string | null; body: string }> {
  if (!hasAnthropicApiKey()) {
    return mockGeneratedMessage(ctx, input);
  }

  const prompt = buildGenerationPrompt(ctx, input);

  try {
    const { text } = await generateText({
      model: getAnthropicModel(),
      prompt,
      maxOutputTokens: 1024,
    });
    return parseModelJson(text);
  } catch {
    return mockGeneratedMessage(ctx, input);
  }
}

export async function streamMessageContent(
  ctx: MessageContext,
  input: GenerateMessageInput,
  onDelta: (chunk: string) => void,
): Promise<{ subject: string | null; body: string }> {
  if (!hasAnthropicApiKey()) {
    const mock = mockGeneratedMessage(ctx, input);
    const full = mock.body;
    const chunkSize = 24;
    for (let i = 0; i < full.length; i += chunkSize) {
      onDelta(full.slice(i, i + chunkSize));
      await new Promise((r) => setTimeout(r, 12));
    }
    return mock;
  }

  const prompt = buildGenerationPrompt(ctx, input);
  const result = streamText({
    model: getAnthropicModel(),
    prompt,
    maxOutputTokens: 1024,
  });

  let full = "";
  for await (const part of result.textStream) {
    full += part;
    onDelta(part);
  }

  return parseModelJson(full);
}
