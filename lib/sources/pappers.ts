import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, type PappersCompanyData } from "@/lib/db/schema";

const PAPPERS_BASE = "https://api.pappers.fr/v2";

export type PappersCompany = PappersCompanyData;

export function hasPappersApiKey(): boolean {
  return Boolean(process.env.PAPPERS_API_KEY?.trim());
}

export async function enrichLeadWithPappers(
  companyName: string,
): Promise<PappersCompany | null> {
  const key = process.env.PAPPERS_API_KEY?.trim();
  if (!key) {
    console.warn("PAPPERS_API_KEY manquant — enrichissement désactivé");
    return null;
  }

  const searchRes = await fetch(
    `${PAPPERS_BASE}/recherche?q=${encodeURIComponent(companyName)}&api_token=${key}&precision=standard`,
  );
  if (!searchRes.ok) return null;

  const searchData = (await searchRes.json()) as {
    resultats?: { siren?: string }[];
  };
  const topResult = searchData.resultats?.[0];
  if (!topResult?.siren) return null;

  const detailRes = await fetch(
    `${PAPPERS_BASE}/entreprise?siren=${topResult.siren}&api_token=${key}&dirigeants=true&finances=true`,
  );
  if (!detailRes.ok) return null;

  return (await detailRes.json()) as PappersCompany;
}

export async function enrichLeadById(
  leadId: string,
): Promise<PappersCompany | null> {
  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  const lead = rows[0];
  if (!lead) return null;

  const data = await enrichLeadWithPappers(lead.companyName);
  if (!data) return null;

  try {
    await db
      .update(leads)
      .set({
        siren: data.siren,
        capitalSocial: data.capital ?? null,
        formeJuridique: data.forme_juridique ?? null,
        pappersData: data,
      })
      .where(eq(leads.id, leadId));
  } catch {
    return data;
  }

  return data;
}

export async function enrichPendingLeads(): Promise<number> {
  if (!hasPappersApiKey()) return 0;

  let batch: (typeof leads.$inferSelect)[] = [];
  try {
    batch = await db
      .select()
      .from(leads)
      .where(and(eq(leads.reviewStatus, "KEEP"), isNull(leads.siren)))
      .limit(10);
  } catch {
    return 0;
  }

  let count = 0;
  for (const lead of batch) {
    const data = await enrichLeadWithPappers(lead.companyName);
    if (!data) continue;

    try {
      await db
        .update(leads)
        .set({
          siren: data.siren,
          capitalSocial: data.capital ?? null,
          formeJuridique: data.forme_juridique ?? null,
          pappersData: data,
        })
        .where(eq(leads.id, lead.id));
      count++;
    } catch {
      // continue
    }
  }

  return count;
}
