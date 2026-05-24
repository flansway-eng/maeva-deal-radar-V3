import { describe, expect, it } from "vitest";
import { mockGeneratedMessage } from "@/lib/messages/prompts";
import type { MessageContext } from "@/lib/messages/types";
import { interpolateMessageTemplate } from "@/lib/messages/variables";

const baseCtx: MessageContext = {
  taskId: "f1000000-0000-0000-0000-000000000001",
  company: "Ardian",
  companyNameOriginal: "ARDIAN PE",
  track: "PE",
  channel: "EMAIL",
  stepCode: "STEP_0_EMAIL",
  contactName: "Sophie Mercier",
  title: "Director",
  source: "https://ardian.com",
  personalizationFact: "closing récent",
  personaName: "Sophie",
};

describe("message generation helpers", () => {
  it("interpolates template variables", () => {
    const out = interpolateMessageTemplate(
      "Bonjour {{persona_name}}, {{company}} — {{personalization_fact}}",
      baseCtx,
    );
    expect(out).toContain("Sophie");
    expect(out).toContain("Ardian");
    expect(out).toContain("closing récent");
  });

  it("mock generation returns subject for email", () => {
    const msg = mockGeneratedMessage(baseCtx, {
      taskId: baseCtx.taskId,
      tone: "sobre",
      length: "court",
      angle: "transaction",
    });
    expect(msg.subject).toBeTruthy();
    expect(msg.body).toContain("Ardian");
    expect(msg.body).toContain("Île-de-France");
  });
});
