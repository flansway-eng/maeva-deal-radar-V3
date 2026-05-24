import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { leads, signalFeed } from "@/lib/db/schema";

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
  return [
    signal.title,
    signal.companyName,
    signal.snippet,
    signal.signalType,
    ...(signal.tags ?? []),
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

export async function semanticSearch(
  query: string,
  limit = 10,
): Promise<SemanticSearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) return [];

  const vectorStr = `[${queryEmbedding.join(",")}]`;

  try {
    const result = await db.execute(sql`
      SELECT * FROM (
        SELECT
          'lead'::text AS entity_type,
          id::text AS entity_id,
          company_name AS title,
          primary_signal AS snippet,
          1 - (embedding <=> ${vectorStr}::vector) AS score
        FROM leads
        WHERE embedding IS NOT NULL
        UNION ALL
        SELECT
          'signal'::text AS entity_type,
          id::text AS entity_id,
          title AS title,
          snippet AS snippet,
          1 - (embedding <=> ${vectorStr}::vector) AS score
        FROM signal_feed
        WHERE embedding IS NOT NULL
      ) combined
      ORDER BY score DESC
      LIMIT ${limit}
    `);

    const rows = result as unknown as SemanticSearchResult[];
    return rows.map((r) => ({
      entityType: r.entityType === "lead" ? "lead" : "signal",
      entityId: String(r.entityId),
      title: String(r.title ?? ""),
      snippet: r.snippet ? String(r.snippet) : null,
      score: Number(r.score ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function generateEmbeddingsBatch(): Promise<number> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return 0;

  let count = 0;

  try {
    const leadRows = await db.execute(sql`
      SELECT id, company_name, sector, target_role, primary_signal,
             personalization_fact, geography
      FROM leads
      WHERE embedding IS NULL
      LIMIT 20
    `);

    for (const row of leadRows as unknown as Record<string, unknown>[]) {
      const text = [
        row.company_name,
        row.sector,
        row.target_role,
        row.primary_signal,
        row.personalization_fact,
        row.geography,
      ]
        .filter(Boolean)
        .join(" — ");
      const embedding = await generateEmbedding(String(text));
      if (!embedding) continue;

      const vectorStr = `[${embedding.join(",")}]`;
      await db.execute(sql`
        UPDATE leads SET embedding = ${vectorStr}::vector
        WHERE id = ${row.id}::uuid
      `);
      count++;
    }

    const signalRows = await db.execute(sql`
      SELECT id, title, company_name, snippet, signal_type, tags
      FROM signal_feed
      WHERE embedding IS NULL
      LIMIT 20
    `);

    for (const row of signalRows as unknown as Record<string, unknown>[]) {
      const text = [
        row.title,
        row.company_name,
        row.snippet,
        row.signal_type,
        Array.isArray(row.tags) ? (row.tags as string[]).join(" ") : null,
      ]
        .filter(Boolean)
        .join(" — ");
      const embedding = await generateEmbedding(String(text));
      if (!embedding) continue;

      const vectorStr = `[${embedding.join(",")}]`;
      await db.execute(sql`
        UPDATE signal_feed SET embedding = ${vectorStr}::vector
        WHERE id = ${row.id}::uuid
      `);
      count++;
    }
  } catch {
    return count;
  }

  return count;
}
