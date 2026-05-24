import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { addFixtureEvent } from "@/lib/db/queries/seed-fixture";
import {
  appendDiscoveries,
  type FixtureSourcingRun,
  type FixtureWebDiscovery,
  prependSourcingRun,
  updateFixtureSourcingRun,
} from "@/lib/db/queries/sourcing-fixture";
import { sequenceEvents, sourcingRuns, webDiscoveries } from "@/lib/db/schema";
import { extractDomain, tavilySearch } from "@/lib/tavily/search";

export interface ExecuteSourcingRunInput {
  queries: string[];
  depth: "basic" | "advanced";
  limit: number;
  actorId: string;
}

export type ExecuteSourcingRunResult =
  | { success: true; runId: string; count: number }
  | { success: false; error: string; runId?: string };

export async function executeSourcingRun(
  input: ExecuteSourcingRunInput,
): Promise<ExecuteSourcingRunResult> {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();

  const run: FixtureSourcingRun = {
    id: runId,
    triggeredAt: startedAt,
    queries: input.queries,
    status: "RUNNING",
    resultsCount: 0,
    errorMessage: null,
  };

  prependSourcingRun(run);

  try {
    await db.insert(sourcingRuns).values({
      id: runId,
      queries: input.queries,
      status: "RUNNING",
      resultsCount: 0,
      triggeredBy: input.actorId,
    });
  } catch {
    // fixture fallback
  }

  const discoveries: FixtureWebDiscovery[] = [];

  try {
    for (const query of input.queries) {
      const searchResult = await tavilySearch({
        query,
        maxResults: input.limit,
        searchDepth: input.depth,
      });

      if ("error" in searchResult) {
        throw new Error(searchResult.error);
      }

      for (const r of searchResult.results) {
        discoveries.push({
          id: randomUUID(),
          runId,
          sourceTitle: r.title,
          sourceUrl: r.url,
          domain: extractDomain(r.url),
          companyNameRaw: r.title.split("—")[0]?.trim() ?? r.title,
          pageType: inferPageType(r.url),
          snippet: r.content.slice(0, 240),
          score: r.score.toFixed(2),
        });
      }
    }

    const deduped = dedupeByUrl(discoveries);
    appendDiscoveries(deduped);

    updateFixtureSourcingRun(runId, {
      status: "DONE",
      resultsCount: deduped.length,
      errorMessage: null,
    });

    try {
      await db
        .update(sourcingRuns)
        .set({
          status: "DONE",
          resultsCount: deduped.length,
          errorMessage: null,
        })
        .where(eq(sourcingRuns.id, runId));

      for (const d of deduped) {
        await db
          .insert(webDiscoveries)
          .values({
            id: d.id,
            runId,
            sourceTitle: d.sourceTitle,
            sourceUrl: d.sourceUrl,
            domain: d.domain,
            companyNameRaw: d.companyNameRaw,
            pageType: d.pageType,
            snippet: d.snippet,
            score: d.score,
          })
          .onConflictDoUpdate({
            target: webDiscoveries.sourceUrl,
            set: {
              sourceTitle: d.sourceTitle,
              snippet: d.snippet,
              score: d.score,
              runId,
              domain: d.domain,
              companyNameRaw: d.companyNameRaw,
              pageType: d.pageType,
            },
          });
      }

      await db.insert(sequenceEvents).values({
        eventType: "SOURCING_RUN_COMPLETED",
        actorId: input.actorId,
        note: `Sourcing run ${runId} — ${deduped.length} découvertes`,
      });
    } catch {
      addFixtureEvent({
        eventType: "SOURCING_RUN_COMPLETED",
        taskId: null,
        company: null,
        note: `Sourcing run ${runId} — ${deduped.length} découvertes`,
      });
    }

    return { success: true, runId, count: deduped.length };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur inconnue lors du sourcing";

    updateFixtureSourcingRun(runId, {
      status: "FAILED",
      errorMessage: message,
    });

    try {
      await db
        .update(sourcingRuns)
        .set({ status: "FAILED", errorMessage: message })
        .where(eq(sourcingRuns.id, runId));
    } catch {
      // fixture only
    }

    return { success: false, error: message, runId };
  }
}

function inferPageType(url: string): string {
  if (url.includes("team")) return "team_page";
  if (url.includes("news") || url.includes("insights")) return "news";
  if (url.includes("portfolio") || url.includes("invest")) return "portfolio";
  return "fund_page";
}

function dedupeByUrl(items: FixtureWebDiscovery[]): FixtureWebDiscovery[] {
  const seen = new Set<string>();
  return items.filter((d) => {
    if (seen.has(d.sourceUrl)) return false;
    seen.add(d.sourceUrl);
    return true;
  });
}
