import type { MessageContext } from "./types";

const VARS = [
  "company",
  "persona_name",
  "personalization_fact",
  "contact_name",
  "track",
] as const;

export function interpolateMessageTemplate(
  template: string,
  ctx: MessageContext,
): string {
  const map: Record<string, string> = {
    company: ctx.company,
    persona_name: ctx.personaName ?? ctx.contactName ?? "Madame, Monsieur",
    personalization_fact:
      ctx.personalizationFact ??
      "votre activité récente sur le marché francilien",
    contact_name: ctx.contactName ?? "",
    track: ctx.track,
  };

  let out = template;
  for (const key of VARS) {
    out = out.replaceAll(`{{${key}}}`, map[key] ?? "");
  }
  return out.trim();
}

export function extractVariablesUsed(text: string): string[] {
  return VARS.filter((v) => text.includes(`{{${v}}}`));
}
