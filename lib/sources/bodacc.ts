import "server-only";

import { db } from "@/lib/db";
import { type SignalType, signalFeed } from "@/lib/db/schema";

const BODACC_BASE =
  "https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets";

const PE_MA_KEYWORDS = [
  "cession",
  "fusion",
  "acquisition",
  "apport",
  "scission",
  "capital",
  "investissement",
  "holding",
  "fonds",
  "transmission",
  "nomination",
  "gérant",
  "directeur",
  "président",
];

interface BodaccRecord {
  id: string;
  registre?: string;
  commercant?: string;
  typeavis?: string;
  familleavis?: string;
  dateparution?: string;
  ville?: string;
  complementlegal?: string;
}

function mapBodaccType(familleavis: string | undefined): SignalType {
  const f = familleavis?.toLowerCase() ?? "";
  if (f.includes("vente") || f.includes("cession")) return "CESSION";
  if (f.includes("fusion")) return "FUSION";
  if (f.includes("nomination")) return "NOMINATION";
  return "NEWS";
}

function detectTags(r: BodaccRecord): string[] {
  const tags: string[] = ["BODACC", "IDF"];
  const text = [r.commercant, r.complementlegal].join(" ").toLowerCase();
  if (
    text.includes("private equity") ||
    text.includes("lbo") ||
    text.includes("fonds")
  ) {
    tags.push("PE");
  }
  if (
    text.includes("fusion") ||
    text.includes("acquisition") ||
    text.includes("cession")
  ) {
    tags.push("MA");
  }
  return tags;
}

function isRelevant(r: BodaccRecord): boolean {
  const text = [r.commercant, r.complementlegal, r.familleavis]
    .join(" ")
    .toLowerCase();
  return PE_MA_KEYWORDS.some((kw) => text.includes(kw));
}

export async function fetchBodaccSignals(): Promise<number> {
  const params = new URLSearchParams({
    where: `departement_code_insee in ("75","77","78","91","92","93","94","95")`,
    order_by: "dateparution DESC",
    limit: "100",
    select:
      "id,registre,commercant,typeavis,familleavis,dateparution,ville,complementlegal",
  });

  const res = await fetch(
    `${BODACC_BASE}/annonces-commerciales/records?${params}`,
    { next: { revalidate: 1800 } },
  );

  if (!res.ok) {
    throw new Error(`BODACC fetch failed: ${res.status}`);
  }

  const data = (await res.json()) as { results?: BodaccRecord[] };
  const relevant = (data.results ?? []).filter(isRelevant);

  let inserted = 0;
  for (const r of relevant) {
    if (!r.id || !r.commercant) continue;

    const sourceUrl = `https://www.bodacc.fr/annonce/detail-annonce/A/${r.id}`;
    const publishedAt = r.dateparution ? new Date(r.dateparution) : new Date();

    try {
      await db
        .insert(signalFeed)
        .values({
          source: "BODACC",
          externalId: `bodacc-${r.id}`,
          sourceUrl,
          publishedAt,
          title: `${r.familleavis ?? "Annonce"} — ${r.commercant}`,
          snippet: r.complementlegal?.substring(0, 300) ?? null,
          companyName: r.commercant,
          signalType: mapBodaccType(r.familleavis),
          tags: detectTags(r),
          rawJson: r as unknown as Record<string, unknown>,
        })
        .onConflictDoNothing({ target: signalFeed.externalId });
      inserted++;
    } catch {
      // DB indisponible — pas de fallback fictif
    }
  }

  return inserted;
}
