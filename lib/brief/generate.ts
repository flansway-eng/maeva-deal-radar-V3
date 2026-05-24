import { generateText } from "ai";
import { getAnthropicModel, hasAnthropicApiKey } from "@/lib/ai/anthropic";
import type { DashboardKpis } from "@/lib/db/queries/dashboard";
import { todayParisIso } from "@/lib/pipeline/dates";

export function buildBriefPrompt(params: {
  kpis: DashboardKpis;
  todayTasksSummary: string;
  recentEvents: string;
  signalHeadlines: string;
  pendingReviewCount: number;
}): string {
  return `Tu rédiges le Daily Brief matinal de Maeva, prospectrice M&A/PE basée à Paris.

Données du jour :
- Tâches actives (PLANNED) : ${params.kpis.activePlanned}
- Tâches du jour : ${params.kpis.todayCount}
- En retard : ${params.kpis.overdueCount}
- Taux exécution 7j : ${params.kpis.executionRate7d}%
- Review en attente : ${params.pendingReviewCount}

Tâches du jour :
${params.todayTasksSummary}

Événements récents (24h) :
${params.recentEvents}

Signaux marché :
${params.signalHeadlines}

Rédige un brief markdown court (3 paragraphes max) en français :
1. Salutation + synthèse chiffrée du jour
2. Un signal / opportunité notable
3. Une alerte qualité si pertinent

Utilise **gras** pour les chiffres clés. Ton sobre institutionnel.`;
}

export function mockDailyBrief(params: {
  kpis: DashboardKpis;
  pendingReviewCount: number;
}): string {
  const name = "Maeva";
  return `Bonjour **${name}**. Aujourd'hui, **${params.kpis.todayCount} tâches** sont dans votre file, dont **${params.kpis.activePlanned} actives** au total. Le taux d'exécution sur 7 jours est de **${params.kpis.executionRate7d}%**.

**À noter** : le marché mid-market francilien reste actif — surveillez les signaux PE sur les clôturings de fonds.

${
  params.kpis.overdueCount > 0 || params.pendingReviewCount > 0
    ? `**Alerte** : ${params.kpis.overdueCount} tâche(s) en retard et ${params.pendingReviewCount} décision(s) de gouvernance en attente.`
    : "**Qualité** : pipeline à jour, aucune alerte critique."
}`;
}

export async function generateDailyBriefContent(
  prompt: string,
): Promise<string> {
  if (!hasAnthropicApiKey()) {
    return mockDailyBrief({
      kpis: {
        activePlanned: 0,
        todayCount: 0,
        overdueCount: 0,
        executionRate7d: 0,
        stoppedLast30d: 0,
      },
      pendingReviewCount: 0,
    });
  }

  try {
    const { text } = await generateText({
      model: getAnthropicModel(),
      prompt,
      maxOutputTokens: 800,
    });
    return text.trim();
  } catch {
    return `Brief du ${todayParisIso()} — génération indisponible. Consultez /today pour votre file.`;
  }
}
