import "server-only";

import { db } from "@/lib/db";
import { type SignalType, signalFeed } from "@/lib/db/schema";
import {
  SIGNAL_FEED_MIN_SCORE,
  SIGNAL_FEED_QUERIES,
} from "@/lib/signals/constants";
import { extractDomain, tavilySearch } from "@/lib/tavily/search";

function categoryTags(query: string): string[] {
  const q = query.toLowerCase();
  const tags = ["TAVILY", "FR"];
  if (q.includes("private equity")) tags.push("PE", "IDF");
  if (q.includes("m&a") || q.includes("deal")) tags.push("MA", "MID-CAP");
  return tags;
}

function inferSignalType(title: string): SignalType {
  const t = title.toLowerCase();
  if (t.includes("nomination") || t.includes("nommé")) return "NOMINATION";
  if (t.includes("fusion")) return "FUSION";
  if (t.includes("cession") || t.includes("rachat")) return "CESSION";
  if (t.includes("deal") || t.includes("acquisition")) return "DEAL";
  return "NEWS";
}

function isAllowedUrl(url: string): boolean {
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  const domain = extractDomain(url).toLowerCase();
  return Boolean(domain && !domain.includes("example.com"));
}

/**
 * Alimente signal_feed via Tavily News — jamais de mock.
 */
export async function runSignalFeedJob(): Promise<number> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[signal-tavily] TAVILY_API_KEY absent — 0 insertion.");
    return 0;
  }

  const seenUrls = new Set<string>();
  let inserted = 0;

  for (const query of SIGNAL_FEED_QUERIES) {
    const searchResult = await tavilySearch({
      query,
      maxResults: 8,
      searchDepth: "basic",
      topic: "news",
      allowMock: false,
    });

    if ("error" in searchResult) {
      console.error(`[signal-tavily] "${query}": ${searchResult.error}`);
      continue;
    }

    for (const result of searchResult.results) {
      const url = result.url?.trim();
      if (!url || !isAllowedUrl(url)) continue;
      if (result.score <= SIGNAL_FEED_MIN_SCORE) continue;

      const normalized = url.split("#")[0] ?? url;
      if (seenUrls.has(normalized)) continue;
      seenUrls.add(normalized);

      const title = result.title?.trim();
      if (!title) continue;

      try {
        await db
          .insert(signalFeed)
          .values({
            source: "TAVILY",
            sourceUrl: normalized,
            publishedAt: new Date(),
            title,
            snippet: result.content?.slice(0, 280) || null,
            signalType: inferSignalType(title),
            // relevanceScore est real en SQLite — convertir en number
            relevanceScore: Number(result.score.toFixed(2)),
            // tags et rawJson sérialisés en JSON pour SQLite
            tags: JSON.stringify(categoryTags(query)),
            rawJson: JSON.stringify(result),
          })
          .onConflictDoUpdate({
            target: signalFeed.sourceUrl,
            set: {
              fetchedAt: new Date(),
              relevanceScore: Number(result.score.toFixed(2)),
            },
          });
        inserted++;
      } catch {
        // pas de fallback fictif
      }
    }
  }

  return inserted;
}
