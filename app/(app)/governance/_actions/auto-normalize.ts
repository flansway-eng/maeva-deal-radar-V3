"use server";

import { auth } from "@/lib/auth";
import { autoNormalizeMutation } from "@/lib/governance/mutations";
import { revalidatePipelineViews } from "@/lib/pipeline/revalidate-pipeline";
import type { ActionResult } from "@/lib/pipeline/types";

export async function autoNormalize(): Promise<
  ActionResult & { normalized?: number }
> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const result = await autoNormalizeMutation(user.id);
  if (result.ok) revalidatePipelineViews();
  return result;
}
