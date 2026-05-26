import { desc, eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/lib/db";
import { sourcingRuns, webDiscoveries } from "@/lib/db/schema";
import type {
  FixtureSourcingRun,
  FixtureWebDiscovery,
} from "./sourcing-fixture";

export type { FixtureSourcingRun, FixtureWebDiscovery };

export async function getSourcingRuns(): Promise<FixtureSourcingRun[]> {
  noStore();
  try {
    const rows = await db
      .select()
      .from(sourcingRuns)
      .orderBy(desc(sourcingRuns.triggeredAt));

    return rows.map((r) => ({
      id: r.id,
      triggeredAt: r.triggeredAt.toISOString(),
      // queries stocké en JSON dans SQLite — parser
      queries: typeof r.queries === "string" ? JSON.parse(r.queries) : r.queries,
      status: r.status,
      resultsCount: r.resultsCount ?? 0,
      errorMessage: r.errorMessage ?? null,
    }));
  } catch {
    return [];
  }
}

export async function getSourcingRunById(
  id: string,
): Promise<FixtureSourcingRun | null> {
  noStore();
  try {
    const rows = await db
      .select()
      .from(sourcingRuns)
      .where(eq(sourcingRuns.id, id))
      .limit(1);
    const r = rows[0];
    if (r) {
      return {
        id: r.id,
        triggeredAt: r.triggeredAt.toISOString(),
        queries: typeof r.queries === "string" ? JSON.parse(r.queries) : r.queries,
        status: r.status,
        resultsCount: r.resultsCount ?? 0,
        errorMessage: r.errorMessage ?? null,
      };
    }
  } catch {
    // DB indisponible
  }

  return null;
}

export async function getDiscoveriesForRun(
  runId: string,
): Promise<FixtureWebDiscovery[]> {
  noStore();
  try {
    const rows = await db
      .select()
      .from(webDiscoveries)
      .where(eq(webDiscoveries.runId, runId))
      .orderBy(desc(webDiscoveries.score));

    return rows.map((r) => ({
      id: r.id,
      runId: r.runId ?? runId,
      sourceTitle: r.sourceTitle,
      sourceUrl: r.sourceUrl,
      domain: r.domain,
      companyNameRaw: r.companyNameRaw ?? null,
      pageType: r.pageType ?? "other",
      snippet: r.snippet ?? null,
      score: r.score?.toString() ?? "0",
    }));
  } catch {
    return [];
  }
}
