"use server";

import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getCompanyAliasesList } from "@/lib/db/queries/governance";
import { db } from "@/lib/db";
import { leads, webDiscoveries } from "@/lib/db/schema";
import {
  companyNameFromDomain,
  detectTrackFromText,
  domainFromLeadWebsite,
  leadWebsiteFromDomain,
  normalizeDiscoveryDomain,
} from "@/lib/sourcing/discovery-to-lead";

const inputSchema = z.object({
  discoveryIds: z.array(z.string().min(1)).min(1),
});

export type ConvertToLeadsResult =
  | { ok: true; created: number; skipped: number }
  | { ok: false; error: string };

export async function convertToLeads(
  discoveryIds: string[],
): Promise<ConvertToLeadsResult> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = inputSchema.safeParse({ discoveryIds });
  if (!parsed.success) return { ok: false, error: "Sélection invalide" };

  let discoveries: (typeof webDiscoveries.$inferSelect)[];
  try {
    discoveries = await db
      .select()
      .from(webDiscoveries)
      .where(inArray(webDiscoveries.id, parsed.data.discoveryIds));
  } catch {
    return { ok: false, error: "Impossible de charger les découvertes" };
  }

  if (discoveries.length === 0) {
    return { ok: false, error: "Aucune découverte trouvée" };
  }

  const aliases = await getCompanyAliasesList();
  const aliasByDomain = new Map(
    aliases.map((a) => [
      normalizeDiscoveryDomain(a.domain),
      a.canonicalName,
    ] as const),
  );
  const aliasTrackByDomain = new Map(
    aliases
      .filter((a) => a.track)
      .map((a) => [normalizeDiscoveryDomain(a.domain), a.track!] as const),
  );

  let existingByDomain: Map<string, string>;
  try {
    const existingLeads = await db
      .select({ id: leads.id, website: leads.website })
      .from(leads);
    existingByDomain = new Map();
    for (const row of existingLeads) {
      const d = domainFromLeadWebsite(row.website ?? null);
      if (d) existingByDomain.set(normalizeDiscoveryDomain(d), row.id);
    }
  } catch {
    return { ok: false, error: "Impossible de lire les leads existants" };
  }

  let created = 0;
  let skipped = 0;
  const seenDomains = new Set<string>();

  for (const discovery of discoveries) {
    const domain = normalizeDiscoveryDomain(discovery.domain);
    if (seenDomains.has(domain)) {
      skipped += 1;
      continue;
    }
    seenDomains.add(domain);

    if (existingByDomain.has(domain)) {
      skipped += 1;
      continue;
    }

    const companyName = companyNameFromDomain(domain, aliasByDomain);
    const track =
      aliasTrackByDomain.get(domain) ??
      detectTrackFromText(
        discovery.snippet,
        discovery.sourceTitle,
        discovery.pageType,
      );
    const score =
      discovery.score != null ? Number(discovery.score) : undefined;
    const leadId = randomUUID();

    try {
      await db.insert(leads).values({
        id: leadId,
        discoveryId: discovery.id,
        companyName,
        companyNameOriginal:
          discovery.companyNameRaw?.trim() || discovery.sourceTitle || companyName,
        website: leadWebsiteFromDomain(domain),
        pageUrl: discovery.sourceUrl,
        track,
        primarySignal: discovery.snippet?.slice(0, 200) ?? discovery.sourceTitle,
        reviewStatus: "PENDING",
        confidenceScore:
          score != null && !Number.isNaN(score) ? score : 0.5,
      });
      existingByDomain.set(domain, leadId);
      created += 1;
    } catch {
      skipped += 1;
    }
  }

  revalidatePath("/leads");
  revalidatePath("/sourcing");
  revalidatePath("/");

  return { ok: true, created, skipped };
}
