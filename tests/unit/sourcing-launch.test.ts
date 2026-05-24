import { describe, expect, it } from "vitest";
import { FIXTURE_SOURCING_RUNS } from "@/lib/db/queries/sourcing-fixture";
import { DEFAULT_SOURCING_QUERIES } from "@/lib/sourcing/constants";
import { executeSourcingRun } from "@/lib/sourcing/execute-run";

describe("sourcing launch", () => {
  it("exposes default Tavily queries", () => {
    expect(DEFAULT_SOURCING_QUERIES.length).toBe(8);
    expect(DEFAULT_SOURCING_QUERIES[0]).toContain("private equity");
  });

  it("executes a run and stores fixture results", async () => {
    const before = FIXTURE_SOURCING_RUNS.length;
    const result = await executeSourcingRun({
      queries: ["private equity Paris"],
      depth: "basic",
      limit: 2,
      actorId: "00000000-0000-0000-0000-000000000000",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.count).toBeGreaterThan(0);
      expect(FIXTURE_SOURCING_RUNS.length).toBeGreaterThan(before);
      const run = FIXTURE_SOURCING_RUNS.find((r) => r.id === result.runId);
      expect(run?.status).toBe("DONE");
    }
  });
});
