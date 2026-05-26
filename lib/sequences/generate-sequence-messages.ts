import { generateText } from "ai";
import { getAnthropicModel, hasAnthropicApiKey } from "@/lib/ai/anthropic";
import type { FixtureLead } from "@/lib/db/queries/governance-fixture";
import type { TaskStep } from "@/lib/db/queries/seed-fixture";
import { SEQUENCE_STEPS } from "./constants";

export interface SequenceStepMessage {
  stepCode: TaskStep;
  subject: string | null;
  body: string;
}

export function buildSequenceGenerationPrompt(lead: FixtureLead): string {
  return `Génère 4 messages de prospection sobres et professionnels
pour Maeva, professionnelle M&A/PE IDF, ciblant ${lead.companyName}.
Source publique : ${lead.pageUrl ?? lead.website ?? "non renseignée"}.
Signal : ${lead.primarySignal ?? "non renseigné"}.
Ton institutionnel, pas agressif, référence la source.

Track cible : ${lead.track}.
Rôle visé : ${lead.targetRole ?? "non renseigné"}.

Produis exactement 4 messages distincts :
- STEP_0_EMAIL (J+0) : premier contact email
- STEP_1_LINKEDIN (J+3) : message LinkedIn court (sans objet)
- STEP_2_FOLLOWUP_1_EMAIL (J+7) : relance email 1
- STEP_3_FOLLOWUP_2_EMAIL (J+14) : relance email 2

Chaque relance doit être plus courte que la précédente, sans répéter mot pour mot.
Mentionner Paris ou l'Île-de-France au moins une fois dans la séquence.
Français, vouvoiement, pas de superlatifs agressifs.

Format de réponse STRICT (JSON uniquement, sans markdown) :
{"messages":[{"stepCode":"STEP_0_EMAIL","subject":"objet court","body":"corps avec \\n"},{"stepCode":"STEP_1_LINKEDIN","subject":null,"body":"..."},{"stepCode":"STEP_2_FOLLOWUP_1_EMAIL","subject":"...","body":"..."},{"stepCode":"STEP_3_FOLLOWUP_2_EMAIL","subject":"...","body":"..."}]}`;
}

function parseSequenceJson(raw: string): SequenceStepMessage[] | null {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as {
      messages?: Array<{
        stepCode?: string;
        subject?: string | null;
        body?: string;
      }>;
    };
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      return null;
    }
    return parsed.messages
      .filter(
        (m): m is SequenceStepMessage =>
          Boolean(m.stepCode && m.body && typeof m.body === "string"),
      )
      .map((m) => ({
        stepCode: m.stepCode as TaskStep,
        subject: m.subject ?? null,
        body: m.body,
      }));
  } catch {
    return null;
  }
}

function mockSequenceMessages(lead: FixtureLead): SequenceStepMessage[] {
  const source = lead.pageUrl ?? lead.website ?? "votre site";
  const signal = lead.primarySignal ?? "l'actualité de votre équipe";
  const company = lead.companyName;

  return SEQUENCE_STEPS.map((step, index) => {
    const isLinkedIn = step.channel === "LINKEDIN";
    const subject = isLinkedIn
      ? null
      : index === 0
        ? `Échange ${lead.track} Île-de-France — ${company}`
        : index === 2
          ? `Relance — ${company}`
          : `Dernier mot — ${company}`;

    const intro =
      index === 0
        ? `Bonjour,\n\nJe me permets de vous contacter au sujet de ${company}. En parcourant ${source}, j'ai noté que ${signal}.`
        : index === 1
          ? `Bonjour,\n\nSuite à mon email, je me permets une prise de contact LinkedIn concernant ${company} — ${signal} m'a semblé un angle pertinent pour un échange mid-market en Île-de-France.`
          : index === 2
            ? `Bonjour,\n\nJe me permets une courte relance concernant ${company} et le signal repéré via ${source} (${signal}).`
            : `Bonjour,\n\nDernière relance de ma part : je reste disponible pour un échange de 15 minutes sur vos priorités ${lead.track} à Paris, en lien avec ${signal}.`;

    const close =
      index < 3
        ? "\n\nSeriez-vous ouvert à un court échange ?\n\nBien cordialement,\nMaeva"
        : "\n\nSans réponse de votre part, je n'insisterai pas davantage.\n\nCordialement,\nMaeva";

    return {
      stepCode: step.stepCode,
      subject,
      body: `${intro}${close}`,
    };
  });
}

function normalizeMessages(
  raw: SequenceStepMessage[],
  lead: FixtureLead,
): SequenceStepMessage[] {
  const byStep = new Map(raw.map((m) => [m.stepCode, m]));
  const mocks = mockSequenceMessages(lead);

  return SEQUENCE_STEPS.map((step) => {
    const found = byStep.get(step.stepCode);
    const fallback = mocks.find((m) => m.stepCode === step.stepCode)!;
    if (!found?.body?.trim()) return fallback;
    return {
      stepCode: step.stepCode,
      subject: step.channel === "EMAIL" ? found.subject ?? fallback.subject : null,
      body: found.body.trim(),
    };
  });
}

export async function generateSequenceMessages(
  lead: FixtureLead,
): Promise<SequenceStepMessage[]> {
  if (!hasAnthropicApiKey()) {
    return mockSequenceMessages(lead);
  }

  const prompt = buildSequenceGenerationPrompt(lead);

  try {
    const { text } = await generateText({
      model: getAnthropicModel(),
      prompt,
      maxOutputTokens: 4096,
    });
    const parsed = parseSequenceJson(text);
    if (parsed && parsed.length >= SEQUENCE_STEPS.length) {
      return normalizeMessages(parsed, lead);
    }
  } catch {
    // fallback mock
  }

  return mockSequenceMessages(lead);
}
