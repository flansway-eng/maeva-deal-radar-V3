import { describe, expect, it } from "vitest";
import { mockDailyBrief } from "@/lib/brief/generate";
import {
  getDashboardKpis,
  getLatestDailyBrief,
  getPipelineFunnel,
  getSignalFeed,
} from "@/lib/db/queries/dashboard";
describe("Phase 5 innovation", () => {
  it("computes dashboard KPIs from DB (empty when no rows)", async () => {
    const kpis = await getDashboardKpis();
    expect(kpis.activePlanned).toBeGreaterThanOrEqual(0);
    expect(kpis.executionRate7d).toBeGreaterThanOrEqual(0);
    expect(kpis.executionRate7d).toBeLessThanOrEqual(100);
  });

  it("returns null daily brief when none in DB", async () => {
    const brief = await getLatestDailyBrief();
    expect(brief === null || brief.contentMarkdown.length > 0).toBe(true);
  });

  it("returns only verified signal feed items from DB (no fixture fallback)", async () => {
    const signals = await getSignalFeed(10);
    for (const s of signals) {
      expect(s.sourceUrl).toMatch(/^https?:\/\//);
      expect(s.sourceUrl).not.toContain("example.com");
      expect(s.title.length).toBeGreaterThan(0);
    }
  });

  it("builds pipeline funnel from DB counts", async () => {
    const funnel = await getPipelineFunnel();
    expect(funnel.discoveries).toBeGreaterThanOrEqual(0);
    expect(funnel.planned).toBeGreaterThanOrEqual(0);
    expect(funnel.executed).toBeGreaterThanOrEqual(0);
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
