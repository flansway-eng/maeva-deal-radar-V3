"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, signalFeed } from "@/lib/db/schema";

export async function createLeadFromSignal(
  signalId: string,
): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  let signal: typeof signalFeed.$inferSelect | undefined;
  try {
    const rows = await db
      .select()
      .from(signalFeed)
      .where(eq(signalFeed.id, signalId))
      .limit(1);
    signal = rows[0];
  } catch {
    return { ok: false, error: "Signal introuvable" };
  }

  if (!signal?.sourceUrl?.startsWith("http")) {
    return { ok: false, error: "Signal sans source vérifiable" };
  }

  const companyName =
    signal.companyName?.trim() ||
    signal.title.split("—")[0]?.trim() ||
    signal.title.slice(0, 80);

  const track =
    signal.tags?.includes("PE") || signal.tags?.includes("MA")
      ? signal.tags.includes("MA")
        ? "MA"
        : "PE"
      : "PE";

  const leadId = randomUUID();

  try {
    await db.insert(leads).values({
      id: leadId,
      companyName,
      companyNameOriginal: companyName,
      pageUrl: signal.sourceUrl,
      track: track as "PE" | "MA",
      primarySignal: signal.title,
      reviewStatus: "PENDING",
      confidenceScore: signal.relevanceScore ?? "0.5",
    });

    await db
      .update(signalFeed)
      .set({ leadId })
      .where(eq(signalFeed.id, signalId));
  } catch {
    return { ok: false, error: "Impossible de créer le lead" };
  }

  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true, leadId };
}
