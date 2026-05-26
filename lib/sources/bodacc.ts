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
  registre?: string | string[];
  commercant?: string;
  typeavis?: string;
  familleavis?: string;
  familleavis_lib?: string;
  dateparution?: string;
  ville?: string;
  acte?: string | null;
  numerodepartement?: string;
  cp?: string;
}

function recordText(r: BodaccRecord): string {
  return [r.commercant, r.familleavis, r.familleavis_lib, r.acte]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function extractActeSnippet(acte: string | null | undefined): string | null {
  if (!acte) return null;
  try {
    const parsed = JSON.parse(acte) as { descriptif?: string };
    return parsed.descriptif ?? acte;
  } catch {
    return acte;
  }
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
  const text = recordText(r);
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
  const text = recordText(r);
  return PE_MA_KEYWORDS.some((kw) => text.includes(kw));
}

/** Départements Île-de-France (champ API : numerodepartement). */
const IDF_DEPARTMENTS_WHERE = `numerodepartement in ("75", "77", "78", "91", "92", "93", "94", "95")`;

export async function fetchBodaccSignals(): Promise<number> {
  const params = new URLSearchParams({
    where: IDF_DEPARTMENTS_WHERE,
    order_by: "dateparution DESC",
    limit: "100",
    select:
      "id,registre,commercant,typeavis,familleavis,familleavis_lib,dateparution,ville,acte,numerodepartement,cp",
  });

  const res = await fetch(
    `${BODACC_BASE}/annonces-commerciales/records?${params}`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `BODACC fetch failed: ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ""}`,
    );
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
          title: `${r.familleavis_lib ?? r.familleavis ?? "Annonce"} — ${r.commercant}`,
          snippet: extractActeSnippet(r.acte)?.substring(0, 300) ?? null,
          companyName: r.commercant,
          signalType: mapBodaccType(r.familleavis),
          // tags et rawJson sérialisés en JSON pour SQLite
          tags: JSON.stringify(detectTags(r)),
          rawJson: JSON.stringify(r),
        })
        .onConflictDoNothing({ target: signalFeed.externalId });
      inserted++;
    } catch {
      // DB indisponible — pas de fallback fictif
    }
  }

  return inserted;
}
