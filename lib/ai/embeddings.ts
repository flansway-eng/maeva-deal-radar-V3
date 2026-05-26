import "server-only";

import { eq, isNull, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, signalFeed } from "@/lib/db/schema";

export async function generateEmbedding(
  text: string,
): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.substring(0, 8000),
    }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    data?: { embedding: number[] }[];
  };
  return data.data?.[0]?.embedding ?? null;
}

export function leadToText(lead: typeof leads.$inferSelect): string {
  return [
    lead.companyName,
    lead.sector,
    lead.targetRole,
    lead.primarySignal,
    lead.personalizationFact,
    lead.geography,
  ]
    .filter(Boolean)
    .join(" — ");
}

export function signalToText(signal: typeof signalFeed.$inferSelect): string {
  // tags stocké en JSON dans SQLite — parser
  const tagsArr: string[] = (() => {
    try { return typeof signal.tags === "string" ? JSON.parse(signal.tags) : []; }
    catch { return []; }
  })();
  return [
    signal.title,
    signal.companyName,
    signal.snippet,
    signal.signalType,
    ...tagsArr,
  ]
    .filter(Boolean)
    .join(" — ");
}

export interface SemanticSearchResult {
  entityType: "lead" | "signal";
  entityId: string;
  title: string;
  snippet: string | null;
  score: number;
}

/**
 * Recherche sémantique — SQLite ne supporte pas pgvector.
 * Retourne toujours un tableau vide (fonctionnalité non disponible en SQLite).
 * Pour la recherche vectorielle, utilisez Supabase/PostgreSQL avec pgvector.
 */
export async function semanticSearch(
  _query: string,
  _limit = 10,
): Promise<SemanticSearchResult[]> {
  console.warn("[embeddings] semanticSearch: pgvector non disponible en SQLite — retourne []");
  return [];
}

/**
 * Génération d'embeddings en batch — SQLite stocke les embeddings en JSON text.
 * Les vecteurs sont stockés mais pas indexés (pas de recherche vectorielle).
 */
export async function generateEmbeddingsBatch(): Promise<number> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return 0;

  let count = 0;

  try {
    // Leads sans embedding
    const leadRows = await db
      .select()
      .from(leads)
      .where(isNull(leads.embedding))
      .limit(20);

    for (const row of leadRows) {
      const text = leadToText(row);
      const embedding = await generateEmbedding(text);
      if (!embedding) continue;

      // Stocker l'embedding comme JSON text dans SQLite
      await db
        .update(leads)
        .set({ embedding: JSON.stringify(embedding) })
        .where(eq(leads.id, row.id));
      count++;
    }

    // Signaux sans embedding
    const signalRows = await db
      .select()
      .from(signalFeed)
      .where(isNull(signalFeed.embedding))
      .limit(20);

    for (const row of signalRows) {
      const text = signalToText(row);
      const embedding = await generateEmbedding(text);
      if (!embedding) continue;

      await db
        .update(signalFeed)
        .set({ embedding: JSON.stringify(embedding) })
        .where(eq(signalFeed.id, row.id));
      count++;
    }
  } catch {
    return count;
  }

  return count;
}
