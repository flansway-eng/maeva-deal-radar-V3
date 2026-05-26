import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  FIXTURE_TASKS,
  findFixtureTask,
  loadFixtureTasksForTests,
  patchFixtureTask,
  stopFixtureCompanyInFixture,
} from "@/lib/db/queries/seed-fixture";
import { addDaysIso } from "@/lib/pipeline/dates";

describe("pipeline fixture mutations", () => {
  const sampleId = "f1000000-0000-0000-0000-000000000001";

  beforeAll(() => {
    loadFixtureTasksForTests();
  });

  beforeEach(() => {
    patchFixtureTask(sampleId, {
      status: "PLANNED",
      executedAt: null,
      stopReason: null,
      executionNote: null,
    });
  });

  it("addDaysIso shifts calendar days", () => {
    expect(addDaysIso("2026-05-23", 1)).toBe("2026-05-24");
    expect(addDaysIso("2026-05-31", 1)).toBe("2026-06-01");
  });

  it("patchFixtureTask updates status in memory", () => {
    patchFixtureTask(sampleId, { status: "DONE" });
    expect(findFixtureTask(sampleId)?.status).toBe("DONE");
  });

  it("stopFixtureCompanyInFixture stops active tasks only", () => {
    const company = findFixtureTask(sampleId)?.company ?? "";
    expect(company.length).toBeGreaterThan(0);
    const stopped = stopFixtureCompanyInFixture(company, "Test stop");
    expect(stopped).toBeGreaterThan(0);
    for (const t of FIXTURE_TASKS) {
      if (t.company === company && t.status === "STOPPED") {
        expect(t.stopReason).toBe("Test stop");
      }
    }
  });
});
