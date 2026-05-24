"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { cancelTaskMutation } from "@/lib/pipeline/mutations";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";

const schema = z.object({
  taskId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export async function cancelTask(
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

  const result = await cancelTaskMutation({
    taskId: parsed.data.taskId,
    actorId: user.id,
    reason: parsed.data.reason,
  });

  if (result.ok) revalidatePipelineViews();
  return result;
}
