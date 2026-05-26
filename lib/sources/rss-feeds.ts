import "server-only";

import { XMLParser } from "fast-xml-parser";
import { db } from "@/lib/db";
import { type SignalSource, signalFeed } from "@/lib/db/schema";

const RSS_FEEDS: { url: string; source: SignalSource }[] = [
  { url: "https://www.bfmtv.com/rss/economie/", source: "RSS_BFM" },
  {
    url: "https://www.bfmtv.com/rss/economie/entreprises/",
    source: "RSS_BFM",
  },
  {
    url: "https://www.lemonde.fr/economie/rss_full.xml",
    source: "RSS_LEMONDE",
  },
];

const PE_MA_KEYWORDS = [
  "acquisition",
  "cession",
  "rachat",
  "fusion",
  "private equity",
  "fonds d'investissement",
  "lbo",
  "capital-investissement",
  "deal",
  "m&a",
  "transaction",
  "portefeuille",
  "investissement",
  "holding",
];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isBlockedUrl(url: string | undefined): boolean {
  if (!url?.startsWith("http")) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("example.com");
  } catch {
    return true;
  }
}

export async function fetchRssSignals(): Promise<number> {
  const parser = new XMLParser({ ignoreAttributes: false });
  let count = 0;

  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "MaevaDealRadar/2.0" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const parsed = parser.parse(xml);
      const items = parsed?.rss?.channel?.item ?? [];
      const list = Array.isArray(items) ? items : [items];

      for (const item of list) {
        const link =
          typeof item.link === "string" ? item.link : item.link?.["#text"];
        if (isBlockedUrl(link)) continue;

        const title = String(item.title ?? "").trim();
        const description = stripHtml(String(item.description ?? ""));
        const text = `${title} ${description}`.toLowerCase();
        const isRelevant = PE_MA_KEYWORDS.some((kw) => text.includes(kw));
        if (!isRelevant || !title) continue;

        const publishedAt = item.pubDate
          ? new Date(String(item.pubDate))
          : new Date();

        try {
          await db
            .insert(signalFeed)
            .values({
              source: feed.source,
              sourceUrl: link,
              publishedAt,
              title,
              snippet: description.substring(0, 400) || null,
              signalType: "NEWS",
              // tags et rawJson sérialisés en JSON pour SQLite
              tags: JSON.stringify([feed.source === "RSS_BFM" ? "BFM" : "LEMONDE", "FR"]),
              rawJson: JSON.stringify(item),
            })
            .onConflictDoUpdate({
              target: signalFeed.sourceUrl,
              set: { fetchedAt: new Date() },
            });
          count++;
        } catch {
          // pas de fallback
        }
      }
    } catch (err) {
      console.error(`RSS fetch failed for ${feed.url}:`, err);
    }
  }

  return count;
}
