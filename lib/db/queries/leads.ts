import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  findFixtureLead,
  type FixtureLead,
} from "@/lib/db/queries/governance-fixture";
import { getLeadsForGovernance } from "@/lib/db/queries/governance";
import { leads } from "@/lib/db/schema";

export type { FixtureLead };

function mapLeadRow(r: typeof leads.$inferSelect): FixtureLead {
  return {
    id: r.id,
    companyName: r.companyName,
    companyNameOriginal: r.companyNameOriginal ?? null,
    website: r.website ?? null,
    pageUrl: r.pageUrl ?? null,
    track: r.track as "PE" | "MA",
    targetRole: r.targetRole ?? null,
    primarySignal: r.primarySignal ?? null,
    reviewStatus: r.reviewStatus ?? "PENDING",
    confidenceScore: r.confidenceScore?.toString() ?? null,
    siren: r.siren ?? null,
    capitalSocial: r.capitalSocial ?? null,
    formeJuridique: r.formeJuridique ?? null,
    pappersData: r.pappersData ?? null,
    qualificationData: r.qualificationData ?? null,
    qualifiedAt: r.qualifiedAt?.toISOString() ?? null,
  };
}

export async function getLeadsShortlist(): Promise<FixtureLead[]> {
  return getLeadsForGovernance();
}

export async function getLeadById(id: string): Promise<FixtureLead | null> {
  const fixture = findFixtureLead(id);
  if (fixture) return fixture;

  try {
    const rows = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return mapLeadRow(r);
  } catch {
    return findFixtureLead(id) ?? null;
  }
}

export async function hasPappersKeyConfigured(): Promise<boolean> {
  return Boolean(process.env.PAPPERS_API_KEY?.trim());
}
