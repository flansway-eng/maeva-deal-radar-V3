import "server-only";

import { generateText } from "ai";
import { desc, eq, like } from "drizzle-orm";
import { getAnthropicModel, hasAnthropicApiKey } from "@/lib/ai/anthropic";
import { db } from "@/lib/db";
import { type LeadQualificationData, leads, signalFeed } from "@/lib/db/schema";
import {
  enrichLeadWithPappers,
  type PappersCompany,
} from "@/lib/sources/pappers";

export async function qualifyLead(
  leadId: string,
): Promise<LeadQualificationData | { error: string }> {
  let lead: typeof leads.$inferSelect | undefined;
  try {
    const rows = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    lead = rows[0];
  } catch {
    return { error: "Lead introuvable" };
  }

  if (!lead) return { error: "Lead introuvable" };

  let pappersData: PappersCompany | null | undefined = lead.pappersData;
  if (!pappersData && process.env.PAPPERS_API_KEY) {
    pappersData = await enrichLeadWithPappers(lead.companyName);
  }

  let signals: (typeof signalFeed.$inferSelect)[] = [];
  try {
    signals = await db
      .select()
      .from(signalFeed)
      .where(like(signalFeed.companyName, `%${lead.companyName}%`))
      .orderBy(desc(signalFeed.publishedAt))
      .limit(5);
  } catch {
    signals = [];
  }

  if (!hasAnthropicApiKey()) {
    return { error: "ANTHROPIC_API_KEY manquant pour la qualification" };
  }

  const prompt = buildQualifyPrompt(lead, pappersData ?? null, signals);

  try {
    const { text } = await generateText({
      model: getAnthropicModel(),
      prompt,
      maxOutputTokens: 1000,
    });

    const raw = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    const qualification = JSON.parse(raw) as LeadQualificationData;

    try {
      await db
        .update(leads)
        .set({
          confidenceScore: String(qualification.qualification_score),
          qualificationData: qualification,
          qualifiedAt: new Date(),
          ...(pappersData
            ? {
                siren: pappersData.siren,
                pappersData,
                formeJuridique: pappersData.forme_juridique ?? null,
                capitalSocial: pappersData.capital ?? null,
              }
            : {}),
        })
        .where(eq(leads.id, leadId));
    } catch {
      // retourne quand même la qualification
    }

    return qualification;
  } catch {
    return { error: "Échec de la qualification IA" };
  }
}

function buildQualifyPrompt(
  lead: typeof leads.$inferSelect,
  pappersData: PappersCompany | null,
  signals: (typeof signalFeed.$inferSelect)[],
): string {
  const dirigeants =
    pappersData?.dirigeants
      ?.slice(0, 3)
      .map((d) => `${d.prenom} ${d.nom} (${d.qualite})`)
      .join(", ") ?? "";

  return `Tu es un analyste M&A expert du marché français.

Lead à qualifier :
- Société : ${lead.companyName}
- Track : ${lead.track}
- Signal principal : ${lead.primarySignal ?? "—"}
- Rôle cible : ${lead.targetRole ?? "—"}
- Source : ${lead.pageUrl ?? "—"}
- Confiance actuelle : ${lead.confidenceScore ?? "—"}

${
  pappersData
    ? `Données légales (Pappers) :
- Forme : ${pappersData.forme_juridique ?? "—"}
- Capital : ${pappersData.capital?.toLocaleString("fr-FR") ?? "—"} €
- Dirigeants : ${dirigeants || "—"}`
    : ""
}

${
  signals.length > 0
    ? `Signaux récents détectés :
${signals.map((s) => `- [${s.source}] ${s.title} (${s.publishedAt?.toISOString() ?? ""})`).join("\n")}`
    : ""
}

Analyse en JSON strict :
{
  "qualification_score": 0.0,
  "synthese": "2-3 phrases",
  "signaux_positifs": [],
  "signaux_negatifs": [],
  "angle_recommande": "string",
  "timing": "URGENT | NORMAL | ATTENDRE",
  "timing_raison": "string"
}
Réponds UNIQUEMENT en JSON valide, sans markdown.`;
}
