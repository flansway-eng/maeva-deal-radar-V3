"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { regenerateMessagesMutation } from "@/lib/governance/mutations";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";

const schema = z.object({
  company: z.string().min(1).max(200),
  newName: z.string().min(1).max(200),
});

export async function regenerateMessages(
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

  const result = await regenerateMessagesMutation(
    parsed.data.company,
    parsed.data.newName,
    user.id,
  );
  if (result.ok) revalidatePipelineViews();
  return result;
}
