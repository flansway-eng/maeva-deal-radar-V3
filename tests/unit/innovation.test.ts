import { describe, expect, it } from "vitest";
import { mockDailyBrief } from "@/lib/brief/generate";
import {
  getDashboardKpis,
  getLatestDailyBrief,
  getPipelineFunnel,
  getSignalFeed,
} from "@/lib/db/queries/dashboard";
import { FIXTURE_DAILY_BRIEFS } from "@/lib/db/queries/innovation-fixture";
import { FIXTURE_TASKS } from "@/lib/db/queries/seed-fixture";

describe("Phase 5 innovation", () => {
  it("computes dashboard KPIs from fixture tasks", async () => {
    const kpis = await getDashboardKpis();
    expect(kpis.activePlanned).toBeGreaterThan(0);
    expect(kpis.executionRate7d).toBeGreaterThanOrEqual(0);
    expect(kpis.executionRate7d).toBeLessThanOrEqual(100);
    expect(FIXTURE_TASKS.length).toBe(100);
  });

  it("returns daily brief from fixture", async () => {
    const brief = await getLatestDailyBrief();
    expect(brief).not.toBeNull();
    expect(brief?.contentMarkdown.length).toBeGreaterThan(10);
    expect(FIXTURE_DAILY_BRIEFS.length).toBeGreaterThan(0);
  });

  it("returns only verified signal feed items from DB (no fixture fallback)", async () => {
    const signals = await getSignalFeed(10);
    for (const s of signals) {
      expect(s.sourceUrl).toMatch(/^https?:\/\//);
      expect(s.sourceUrl).not.toContain("example.com");
      expect(s.title.length).toBeGreaterThan(0);
    }
  });

  it("builds pipeline funnel from tasks", async () => {
    const funnel = await getPipelineFunnel();
    expect(funnel.discoveries).toBeGreaterThan(funnel.executed);
    expect(funnel.planned).toBeGreaterThan(0);
  });

  it("mockDailyBrief includes KPI figures", () => {
    const text = mockDailyBrief({
      kpis: {
        activePlanned: 12,
        todayCount: 5,
        overdueCount: 1,
        executionRate7d: 88.5,
        stoppedLast30d: 2,
      },
      pendingReviewCount: 2,
    });
    expect(text).toContain("5");
    expect(text).toContain("88.5");
  });
});
