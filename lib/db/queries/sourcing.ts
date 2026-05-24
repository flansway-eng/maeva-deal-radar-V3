import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sourcingRuns, webDiscoveries } from "@/lib/db/schema";
import {
  FIXTURE_SOURCING_RUNS,
  type FixtureSourcingRun,
  type FixtureWebDiscovery,
  getFixtureDiscoveriesForRun,
  getFixtureSourcingRun,
} from "./sourcing-fixture";

export type { FixtureSourcingRun, FixtureWebDiscovery };

export async function getSourcingRuns(): Promise<FixtureSourcingRun[]> {
  try {
    const rows = await db
      .select()
      .from(sourcingRuns)
      .orderBy(desc(sourcingRuns.triggeredAt));

    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        triggeredAt: r.triggeredAt.toISOString(),
        queries: r.queries,
        status: r.status,
        resultsCount: r.resultsCount ?? 0,
        errorMessage: r.errorMessage ?? null,
      }));
    }
  } catch {
    // fixture fallback
  }

  return [...FIXTURE_SOURCING_RUNS];
}

export async function getSourcingRunById(
  id: string,
): Promise<FixtureSourcingRun | null> {
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
        queries: r.queries,
        status: r.status,
        resultsCount: r.resultsCount ?? 0,
        errorMessage: r.errorMessage ?? null,
      };
    }
  } catch {
    // fixture
  }

  return getFixtureSourcingRun(id) ?? null;
}

export async function getDiscoveriesForRun(
  runId: string,
): Promise<FixtureWebDiscovery[]> {
  try {
    const rows = await db
      .select()
      .from(webDiscoveries)
      .where(eq(webDiscoveries.runId, runId))
      .orderBy(desc(webDiscoveries.score));

    if (rows.length > 0) {
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
    }
  } catch {
    // fixture
  }

  return getFixtureDiscoveriesForRun(runId);
}
