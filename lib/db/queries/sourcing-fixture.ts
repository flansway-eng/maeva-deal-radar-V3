export interface FixtureSourcingRun {
  id: string;
  triggeredAt: string;
  queries: string[];
  status: "RUNNING" | "DONE" | "FAILED";
  resultsCount: number;
  errorMessage: string | null;
}

export interface FixtureWebDiscovery {
  id: string;
  runId: string;
  sourceTitle: string;
  sourceUrl: string;
  domain: string;
  companyNameRaw: string | null;
  pageType: string;
  snippet: string | null;
  score: string;
}

export const FIXTURE_SOURCING_RUNS: FixtureSourcingRun[] = [];

export let FIXTURE_WEB_DISCOVERIES: FixtureWebDiscovery[] = [];

export function prependSourcingRun(run: FixtureSourcingRun): void {
  FIXTURE_SOURCING_RUNS.unshift(run);
}

export function appendDiscoveries(items: FixtureWebDiscovery[]): void {
  const byUrl = new Map(
    FIXTURE_WEB_DISCOVERIES.map((d) => [d.sourceUrl, d] as const),
  );
  for (const item of items) {
    byUrl.set(item.sourceUrl, item);
  }
  FIXTURE_WEB_DISCOVERIES = Array.from(byUrl.values());
}

export function updateFixtureSourcingRun(
  id: string,
  patch: Partial<FixtureSourcingRun>,
): void {
  const idx = FIXTURE_SOURCING_RUNS.findIndex((r) => r.id === id);
  if (idx >= 0) {
    const current = FIXTURE_SOURCING_RUNS[idx];
    if (current) {
      FIXTURE_SOURCING_RUNS[idx] = { ...current, ...patch };
    }
  }
}

export function getFixtureSourcingRun(
  id: string,
): FixtureSourcingRun | undefined {
  return FIXTURE_SOURCING_RUNS.find((r) => r.id === id);
}

export function getFixtureDiscoveriesForRun(
  runId: string,
): FixtureWebDiscovery[] {
  return FIXTURE_WEB_DISCOVERIES.filter((d) => d.runId === runId);
}
