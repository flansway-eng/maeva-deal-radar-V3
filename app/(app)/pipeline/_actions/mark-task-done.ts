"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { markTaskDoneMutation } from "@/lib/pipeline/mutations";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";

const schema = z.object({
  taskId: z.string().min(1),
  note: z.string().max(500).optional(),
});

export async function markTaskDone(
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

  const result = await markTaskDoneMutation({
    taskId: parsed.data.taskId,
    actorId: user.id,
    note: parsed.data.note,
  });

  if (result.ok) revalidatePipelineViews();
  return result;
}
