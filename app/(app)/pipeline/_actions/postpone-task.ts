"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { postponeTaskMutation } from "@/lib/pipeline/mutations";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date ISO requise");

const schema = z.object({
  taskId: z.string().min(1),
  newPlannedDate: isoDate,
  note: z.string().max(500).optional(),
});

export async function postponeTask(
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

  const result = await postponeTaskMutation({
    taskId: parsed.data.taskId,
    actorId: user.id,
    newPlannedDate: parsed.data.newPlannedDate,
    note: parsed.data.note,
  });

  if (result.ok) revalidatePipelineViews();
  return result;
}
