"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { executeMultiSourceRun } from "@/lib/sourcing/execute-multi-source-run";

const sourcesSchema = z.object({
  tavily: z.boolean(),
  bodacc: z.boolean(),
  rss: z.boolean(),
  pappers: z.boolean(),
});

const schema = z
  .object({
    sources: sourcesSchema,
    queries: z.array(z.string().min(1)).max(20).optional(),
    depth: z.enum(["basic", "advanced"]).optional(),
    limit: z.number().int().min(1).max(20).optional(),
  })
  .superRefine((data, ctx) => {
    const { sources } = data;
    if (!sources.tavily && !sources.bodacc && !sources.rss && !sources.pappers) {
      ctx.addIssue({
        code: "custom",
        message: "Activez au moins une source.",
        path: ["sources"],
      });
    }
    if (sources.tavily && (!data.queries || data.queries.length === 0)) {
      ctx.addIssue({
        code: "custom",
        message: "Ajoutez au moins une requête Tavily.",
        path: ["queries"],
      });
    }
  });

export type LaunchSourcingRunInput = z.infer<typeof schema>;

export type LaunchSourcingRunResult =
  | {
      success: true;
      runId?: string;
      counts: {
        tavily: number;
        bodacc: number;
        rss: number;
        pappers: number;
      };
      warnings: string[];
    }
  | {
      success: false;
      error: string;
      runId?: string;
      counts?: {
        tavily: number;
        bodacc: number;
        rss: number;
        pappers: number;
      };
    };

export async function launchSourcingRun(
  input: LaunchSourcingRunInput,
): Promise<LaunchSourcingRunResult> {
  const { user } = await auth();
  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Entrée invalide",
    };
  }

  const result = await executeMultiSourceRun({
    sources: parsed.data.sources,
    queries: parsed.data.queries,
    depth: parsed.data.depth,
    limit: parsed.data.limit,
    actorId: user.id,
  });

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/leads");
  if (result.runId) {
    revalidatePath(`/sourcing/runs/${result.runId}`);
  }

  return result;
}
