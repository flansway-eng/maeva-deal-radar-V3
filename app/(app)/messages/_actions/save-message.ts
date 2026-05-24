"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { getMessageContext } from "@/lib/db/queries/messages";
import { saveTaskMessageMutation } from "@/lib/messages/save";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";

const schema = z.object({
  taskId: z.string().min(1),
  messageSubject: z.string().max(500).nullable(),
  messageBody: z.string().min(1).max(8000),
});

export async function saveMessage(
  input: z.infer<typeof schema>,
): Promise<ActionResult> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Entrée invalide",
    };
  }

  const ctx = await getMessageContext(parsed.data.taskId);
  if (!ctx) return { ok: false, error: "Tâche introuvable" };

  const ok = await saveTaskMessageMutation({
    taskId: parsed.data.taskId,
    messageSubject: parsed.data.messageSubject,
    messageBody: parsed.data.messageBody,
    actorId: user.id,
    company: ctx.company,
  });

  if (!ok) return { ok: false, error: "Échec de l'enregistrement" };

  revalidatePipelineViews();
  return { ok: true, taskId: parsed.data.taskId };
}
