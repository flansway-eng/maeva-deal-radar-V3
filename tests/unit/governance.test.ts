import { describe, expect, it } from "vitest";
import { build100FixtureTasks } from "@/lib/db/queries/fixture-100-tasks";
import {
  FIXTURE_COMPANY_ALIASES,
  FIXTURE_REVIEW_DECISIONS,
} from "@/lib/db/queries/governance-fixture";
import { FIXTURE_TASKS } from "@/lib/db/queries/seed-fixture";
import { extractDomain } from "@/lib/governance/domain";

describe("Phase 3 governance fixtures", () => {
  it("exposes 100 fixture tasks", () => {
    expect(FIXTURE_TASKS.length).toBe(100);
    expect(build100FixtureTasks().length).toBe(100);
  });

  it("has pending review decisions", () => {
    const pending = FIXTURE_REVIEW_DECISIONS.filter((r) => !r.appliedAt);
    expect(pending.length).toBeGreaterThan(0);
  });

  it("has company aliases for PE and MA", () => {
    const pe = FIXTURE_COMPANY_ALIASES.filter((a) => a.track === "PE");
    const ma = FIXTURE_COMPANY_ALIASES.filter((a) => a.track === "MA");
    expect(pe.length).toBeGreaterThan(5);
    expect(ma.length).toBeGreaterThan(5);
  });

  it("extractDomain parses URLs", () => {
    expect(extractDomain("https://www.ardian.com/team")).toBe("ardian.com");
    expect(extractDomain("linkedin.com")).toBe("linkedin.com");
    expect(extractDomain(null)).toBeNull();
  });
});
