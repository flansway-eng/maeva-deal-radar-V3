import { describe, expect, it } from "vitest";
import { lintMessageQuality } from "@/lib/messages/quality-linter";

describe("lintMessageQuality", () => {
  it("flags long messages", () => {
    const body = "x".repeat(801);
    const issues = lintMessageQuality({ body });
    expect(issues.some((i) => i.id === "length")).toBe(true);
  });

  it("flags old company title", () => {
    const issues = lintMessageQuality({
      body: "Bonjour, ARDIAN PRIVATE EQUITY est intéressant en Île-de-France.",
      companyNameOriginal: "ARDIAN PRIVATE EQUITY",
      source: "https://ardian.com",
    });
    expect(issues.some((i) => i.id === "old-title")).toBe(true);
  });

  it("flags forbidden aggressive tone", () => {
    const issues = lintMessageQuality({
      body: "Offre urgente pour Paris et l'Île-de-France via linkedin.",
      source: "linkedin",
    });
    expect(issues.some((i) => i.severity === "error")).toBe(true);
  });

  it("passes clean short message", () => {
    const issues = lintMessageQuality({
      body: "Bonjour, votre équipe à Paris et en Île-de-France — j'ai vu votre page linkedin.",
      source: "https://ardian.com/team",
      companyNameOriginal: "ARDIAN PRIVATE EQUITY",
    });
    expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });
});
