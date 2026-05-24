import { describe, expect, it } from "vitest";
import {
  findFixtureLead,
  FIXTURE_LEADS,
  patchFixtureLead,
} from "@/lib/db/queries/governance-fixture";

describe("leads fixtures & status", () => {
  it("Astorg has confidence 0.87", () => {
    const astorg = FIXTURE_LEADS.find((l) => l.companyName === "Astorg");
    expect(astorg?.confidenceScore).toBe("0.87");
    expect(astorg?.targetRole).toBeTruthy();
    expect(astorg?.primarySignal).toBeTruthy();
  });

  it("patchFixtureLead sets KEEP on Astorg", () => {
    const astorg = FIXTURE_LEADS.find((l) => l.companyName === "Astorg");
    expect(astorg).toBeDefined();
    if (!astorg) return;

    patchFixtureLead(astorg.id, { reviewStatus: "KEEP" });
    const updated = findFixtureLead(astorg.id);
    expect(updated?.reviewStatus).toBe("KEEP");
  });
});
