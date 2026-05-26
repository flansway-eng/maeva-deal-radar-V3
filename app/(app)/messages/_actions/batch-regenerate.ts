"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getMessageContext,
  updateTaskMessage,
} from "@/lib/db/queries/messages";
import { addFixtureEvent } from "@/lib/db/queries/seed-fixture";
import { sequenceEvents } from "@/lib/db/schema";
import { generateMessageContent } from "@/lib/messages/generate";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";

const schema = z.object({
  taskIds: z.array(z.string().min(1)).min(1).max(20),
  tone: z.enum(["sobre", "direct", "personnalise"]).default("sobre"),
  length: z.enum(["court", "standard"]).default("standard"),
  angle: z
    .enum(["transaction", "portefeuille", "equipe"])
    .default("transaction"),
});

export async function batchRegenerateMessages(
  input: z.infer<typeof schema>,
): Promise<ActionResult & { count?: number }> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Entrée invalide",
    };
  }

  let count = 0;
  for (const taskId of parsed.data.taskIds) {
    const ctx = await getMessageContext(taskId);
    if (!ctx) continue;

    const generated = await generateMessageContent(ctx, {
      taskId,
      tone: parsed.data.tone,
      length: parsed.data.length,
      angle: parsed.data.angle,
    });

    const ok = await updateTaskMessage(
      taskId,
      generated.subject,
      generated.body,
    );
    if (ok) count++;
  }

  try {
    await db.insert(sequenceEvents).values({
      eventType: "MESSAGES_REGENERATED",
      // actorId supprimé (non disponible en SQLite)
      note: `Régénération batch — ${count} message(s)`,
      // payload sérialisé en JSON pour SQLite
      payload: JSON.stringify({ taskIds: parsed.data.taskIds, count }),
    });
  } catch {
    addFixtureEvent({
      eventType: "MESSAGES_REGENERATED",
      taskId: null,
      company: null,
      note: `Batch — ${count} messages`,
    });
  }

  revalidatePipelineViews();
  return { ok: true, count };
}
