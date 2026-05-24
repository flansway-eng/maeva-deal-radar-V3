import {
  getFixtureDiscoveriesForRun,
  getFixtureSourcingRun,
} from "@/lib/db/queries/sourcing-fixture";
import { DEFAULT_SOURCING_QUERIES } from "@/lib/sourcing/constants";
import { executeSourcingRun } from "@/lib/sourcing/execute-run";

export interface RunSourcingInput {
  queries?: string[];
  maxResultsPerQuery?: number;
  searchDepth?: "basic" | "advanced";
  actorId?: string;
}

/** @deprecated Préférer launchSourcingRun — conservé pour scripts/cron éventuels */
export async function runSourcingJob(input: RunSourcingInput = {}) {
  const result = await executeSourcingRun({
    queries: input.queries?.length
      ? input.queries
      : [...DEFAULT_SOURCING_QUERIES],
    depth: input.searchDepth ?? "basic",
    limit: input.maxResultsPerQuery ?? 5,
    actorId: input.actorId ?? "00000000-0000-0000-0000-000000000000",
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  const run = getFixtureSourcingRun(result.runId);
  const discoveries = getFixtureDiscoveriesForRun(result.runId);

  if (!run) {
    throw new Error("Run introuvable après exécution");
  }

  return { run, discoveries };
}
