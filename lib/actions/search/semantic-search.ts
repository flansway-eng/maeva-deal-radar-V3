"use server";

import { type SemanticSearchResult, semanticSearch } from "@/lib/ai/embeddings";
import { auth } from "@/lib/auth";

export async function semanticSearchAction(
  query: string,
): Promise<SemanticSearchResult[]> {
  const { user } = await auth();
  if (!user) return [];
  if (!query.trim()) return [];

  return semanticSearch(query.trim(), 12);
}
