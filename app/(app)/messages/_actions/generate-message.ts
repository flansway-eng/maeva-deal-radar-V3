"use server";

import { createStreamableValue } from "@ai-sdk/rsc";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getMessageContext } from "@/lib/db/queries/messages";
import { streamMessageContent } from "@/lib/messages/generate";
import type { GenerateMessageInput } from "@/lib/messages/types";

const schema = z.object({
  taskId: z.string().min(1),
  tone: z.enum(["sobre", "direct", "personnalise"]),
  length: z.enum(["court", "standard"]),
  angle: z.enum(["transaction", "portefeuille", "equipe"]),
});

export async function generateMessageStream(input: z.infer<typeof schema>) {
  const { user } = await auth();
  if (!user) {
    throw new Error("Non authentifié");
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Entrée invalide");
  }

  const ctx = await getMessageContext(parsed.data.taskId);
  if (!ctx) throw new Error("Tâche introuvable");

  type StreamState = {
    body: string;
    subject: string | null;
    done: boolean;
  };

  const stream = createStreamableValue<StreamState>({
    body: "",
    subject: null,
    done: false,
  });

  const genInput: GenerateMessageInput = parsed.data;

  void (async () => {
    try {
      let bodyBuffer = "";
      const result = await streamMessageContent(ctx, genInput, (chunk) => {
        bodyBuffer += chunk;
        stream.update({
          body: bodyBuffer,
          subject: null,
          done: false,
        });
      });
      stream.done({
        body: result.body || bodyBuffer,
        subject: result.subject,
        done: true,
      });
    } catch (err) {
      stream.error(
        err instanceof Error ? err : new Error("Génération échouée"),
      );
    }
  })();

  return { stream: stream.value };
}
