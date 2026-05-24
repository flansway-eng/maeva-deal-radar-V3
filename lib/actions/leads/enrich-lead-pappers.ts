"use server";

import { auth } from "@/lib/auth";
import {
  findFixtureLead,
  patchFixtureLead,
} from "@/lib/db/queries/governance-fixture";
import { enrichLeadById, type PappersCompany } from "@/lib/sources/pappers";

export async function enrichLeadAction(
  leadId: string,
): Promise<{ ok: true; data: PappersCompany } | { ok: false; error: string }> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const data = await enrichLeadById(leadId);
  if (!data) {
    return {
      ok: false,
      error: "Enrichissement indisponible — vérifiez PAPPERS_API_KEY",
    };
  }

  const fixture = findFixtureLead(leadId);
  if (fixture) {
    patchFixtureLead(leadId, {
      siren: data.siren,
      formeJuridique: data.forme_juridique ?? null,
      capitalSocial: data.capital ?? null,
      pappersData: data,
    });
  }

  return { ok: true, data };
}
