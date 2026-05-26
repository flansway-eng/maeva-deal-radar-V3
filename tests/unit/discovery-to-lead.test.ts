import { describe, expect, it } from "vitest";
import {
  companyNameFromDomain,
  detectTrackFromText,
  isBlockedMediaDomain,
  normalizePageTypeForFilter,
} from "@/lib/sourcing/discovery-to-lead";

describe("discovery-to-lead", () => {
  it("convertit ikpartners.com en IK Partners", () => {
    expect(companyNameFromDomain("ikpartners.com")).toBe("IK Partners");
  });

  it("utilise l'alias si présent", () => {
    const aliases = new Map([["ikpartners.com", "IK Partners"]]);
    expect(companyNameFromDomain("ikpartners.com", aliases)).toBe("IK Partners");
  });

  it("détecte le track MA depuis le snippet", () => {
    expect(
      detectTrackFromText("Expansion de l'équipe M&A advisory à Paris"),
    ).toBe("MA");
  });

  it("masque wikipedia et linkedin", () => {
    expect(isBlockedMediaDomain("fr.wikipedia.org")).toBe(true);
    expect(isBlockedMediaDomain("www.linkedin.com")).toBe(true);
    expect(isBlockedMediaDomain("ikpartners.com")).toBe(false);
  });

  it("regroupe team_page dans other", () => {
    expect(normalizePageTypeForFilter("team_page")).toBe("other");
  });
});
