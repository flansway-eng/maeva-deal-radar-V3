import { describe, expect, it } from "vitest";
import type { FixtureLead } from "@/lib/db/queries/governance-fixture";
import { SEQUENCE_STEPS, sequenceUidFor } from "@/lib/sequences/constants";
import {
  buildSequenceGenerationPrompt,
  generateSequenceMessages,
} from "@/lib/sequences/generate-sequence-messages";

const sampleLead: FixtureLead = {
  id: "l-test-0001",
  companyName: "IK Partners",
  companyNameOriginal: null,
  website: "https://ikpartners.com",
  pageUrl: "https://ikpartners.com/team",
  track: "PE",
  targetRole: "Partner",
  primarySignal: "team expansion IDF",
  reviewStatus: "KEEP",
  confidenceScore: "0.72",
};

describe("generate-sequence", () => {
  it("construit un prompt avec société et signal", () => {
    const prompt = buildSequenceGenerationPrompt(sampleLead);
    expect(prompt).toContain("IK Partners");
    expect(prompt).toContain("team expansion IDF");
    expect(prompt).toContain("STEP_0_EMAIL");
  });

  it("génère 4 messages mock sans clé API", async () => {
    const messages = await generateSequenceMessages(sampleLead);
    expect(messages).toHaveLength(4);
    expect(messages[0]?.stepCode).toBe("STEP_0_EMAIL");
    expect(messages[0]?.subject).toBeTruthy();
    expect(messages[1]?.subject).toBeNull();
  });

  it("forme un sequence_uid unique par étape", () => {
    expect(sequenceUidFor(sampleLead.id, "STEP_0_EMAIL")).toBe(
      "l-test-0001_STEP_0_EMAIL",
    );
    expect(SEQUENCE_STEPS).toHaveLength(4);
  });
});
