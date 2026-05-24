"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { patchFixtureTask } from "@/lib/db/queries/seed-fixture";

const schema = z.object({
  taskId: z.string().min(1),
  audioBase64: z.string().min(1),
});

export async function transcribeVoiceNote(input: z.infer<typeof schema>) {
  const { user } = await auth();
  if (!user) return { ok: false as const, error: "Non authentifié" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Entrée invalide" };
  }

  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  const transcript = hasOpenAI
    ? await whisperTranscribe(parsed.data.audioBase64)
    : mockTranscript(parsed.data.taskId);

  patchFixtureTask(parsed.data.taskId, { executionNote: transcript });

  return { ok: true as const, transcript };
}

async function whisperTranscribe(_audioBase64: string): Promise<string> {
  // Stub — brancher OpenAI Whisper API quand OPENAI_API_KEY est configurée
  return mockTranscript("task");
}

function mockTranscript(taskId: string): string {
  return `[Note vocale ${new Date().toLocaleTimeString("fr-FR")}] Relance prévue demain matin — tâche ${taskId.slice(-4)}.`;
}
