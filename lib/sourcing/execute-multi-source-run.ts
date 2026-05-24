import "server-only";

import { revalidatePath } from "next/cache";
import { fetchBodaccSignals } from "@/lib/sources/bodacc";
import { enrichPendingLeads } from "@/lib/sources/pappers";
import { fetchRssSignals } from "@/lib/sources/rss-feeds";
import {
  executeSourcingRun,
  type ExecuteSourcingRunResult,
} from "@/lib/sourcing/execute-run";

export interface MultiSourceRunInput {
  sources: {
    tavily: boolean;
    bodacc: boolean;
    rss: boolean;
    pappers: boolean;
  };
  queries?: string[];
  depth?: "basic" | "advanced";
  limit?: number;
  actorId: string;
}

export interface MultiSourceRunCounts {
  tavily: number;
  bodacc: number;
  rss: number;
  pappers: number;
}

export type MultiSourceRunResult =
  | {
      success: true;
      runId?: string;
      counts: MultiSourceRunCounts;
      warnings: string[];
    }
  | { success: false; error: string; runId?: string; counts?: MultiSourceRunCounts };

export async function executeMultiSourceRun(
  input: MultiSourceRunInput,
): Promise<MultiSourceRunResult> {
  const { sources } = input;
  const counts: MultiSourceRunCounts = {
    tavily: 0,
    bodacc: 0,
    rss: 0,
    pappers: 0,
  };
  const warnings: string[] = [];
  let runId: string | undefined;
  let tavilyResult: ExecuteSourcingRunResult | undefined;

  if (sources.tavily) {
    if (!process.env.TAVILY_API_KEY?.trim()) {
      warnings.push("Tavily ignoré — TAVILY_API_KEY manquant");
    } else if (!input.queries?.length) {
      return { success: false, error: "Ajoutez au moins une requête Tavily." };
    } else {
      tavilyResult = await executeSourcingRun({
        queries: input.queries,
        depth: input.depth ?? "basic",
        limit: input.limit ?? 5,
        actorId: input.actorId,
      });
      if (tavilyResult.success) {
        counts.tavily = tavilyResult.count;
        runId = tavilyResult.runId;
      } else {
        warnings.push(`Tavily : ${tavilyResult.error}`);
        runId = tavilyResult.runId;
      }
    }
  }

  if (sources.bodacc) {
    try {
      counts.bodacc = await fetchBodaccSignals();
    } catch (err) {
      warnings.push(
        `BODACC : ${err instanceof Error ? err.message : "échec du fetch"}`,
      );
    }
  }

  if (sources.rss) {
    try {
      counts.rss = await fetchRssSignals();
    } catch (err) {
      warnings.push(
        `RSS : ${err instanceof Error ? err.message : "échec du fetch"}`,
      );
    }
  }

  if (sources.pappers) {
    if (!process.env.PAPPERS_API_KEY?.trim()) {
      warnings.push("Pappers ignoré — PAPPERS_API_KEY manquant");
    } else {
      try {
        counts.pappers = await enrichPendingLeads();
      } catch (err) {
        warnings.push(
          `Pappers : ${err instanceof Error ? err.message : "échec enrichissement"}`,
        );
      }
    }
  }

  const total = counts.tavily + counts.bodacc + counts.rss + counts.pappers;
  const anySourceRan =
    sources.tavily || sources.bodacc || sources.rss || sources.pappers;

  if (!anySourceRan) {
    return { success: false, error: "Aucune source sélectionnée." };
  }

  revalidatePath("/");
  revalidatePath("/sourcing");
  revalidatePath("/leads");

  if (total === 0 && warnings.length > 0 && tavilyResult && !tavilyResult.success) {
    return {
      success: false,
      error: warnings.join(" · "),
      runId,
      counts,
    };
  }

  if (total === 0 && warnings.length > 0) {
    return {
      success: false,
      error: warnings.join(" · "),
      counts,
    };
  }

  return { success: true, runId, counts, warnings };
}
