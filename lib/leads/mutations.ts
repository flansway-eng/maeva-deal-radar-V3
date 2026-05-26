import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  findFixtureLead,
  patchFixtureLead,
} from "@/lib/db/queries/governance-fixture";
import { addFixtureEvent, FIXTURE_TASKS } from "@/lib/db/queries/seed-fixture";
import { leads, sequenceEvents, sequenceTasks } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/pipeline/types";

const ACTIVE = ["PLANNED", "POSTPONED"] as const;

async function resolveLead(leadId: string) {
  const fixture = findFixtureLead(leadId);
  if (fixture) return fixture;

  try {
    const rows = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
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
    };
  } catch {
    return null;
  }
}

async function logLeadEvent(params: {
  eventType:
    | "REVIEW_DECISION_APPLIED"
    | "SEQUENCE_STOPPED"
    | "COMPANY_CORRECTED";
  actorId: string;
  company: string;
  note: string;
  payload?: Record<string, unknown>;
}) {
  try {
    await db.insert(sequenceEvents).values({
      eventType: params.eventType,
      // actorId supprimé (non disponible en SQLite)
      note: params.note,
      // payload sérialisé en JSON pour SQLite
      payload: params.payload ? JSON.stringify(params.payload) : null,
    });
  } catch {
    addFixtureEvent({
      eventType: params.eventType,
      taskId: null,
      company: params.company,
      note: params.note,
    });
  }
}

async function stopPlannedTasksForLead(
  leadId: string,
  company: string,
  actorId: string,
): Promise<void> {
  try {
    await db
      .update(sequenceTasks)
      .set({ status: "STOPPED", stopReason: "Lead marqué STOP" })
      .where(
        and(
          eq(sequenceTasks.leadId, leadId),
          inArray(sequenceTasks.status, [...ACTIVE]),
        ),
      );
  } catch {
    // fixture
  }

  for (let i = 0; i < FIXTURE_TASKS.length; i++) {
    const t = FIXTURE_TASKS[i];
    if (!t) continue;
    const matchesLead =
      t.leadId === leadId ||
      (t.company === company &&
        (t.status === "PLANNED" || t.status === "POSTPONED"));
    if (matchesLead) {
      FIXTURE_TASKS[i] = {
        ...t,
        status: "STOPPED",
        stopReason: "Lead marqué STOP",
      };
    }
  }

  await logLeadEvent({
    eventType: "SEQUENCE_STOPPED",
    actorId,
    company,
    note: `Séquences arrêtées pour le lead ${company}`,
  });
}

export async function markLeadKeepMutation(
  leadId: string,
  actorId: string,
): Promise<ActionResult> {
  const lead = await resolveLead(leadId);
  if (!lead) return { ok: false, error: "Lead introuvable" };

  try {
    await db
      .update(leads)
      .set({ reviewStatus: "KEEP" })
      .where(eq(leads.id, leadId));
  } catch {
    // fixture
  }

  patchFixtureLead(leadId, { reviewStatus: "KEEP" });

  await logLeadEvent({
    eventType: "REVIEW_DECISION_APPLIED",
    actorId,
    company: lead.companyName,
    note: `KEEP — ${lead.companyName}`,
    payload: { leadId, decision: "KEEP" },
  });

  return { ok: true, company: lead.companyName };
}

export async function markLeadStopMutation(
  leadId: string,
  actorId: string,
): Promise<ActionResult> {
  const lead = await resolveLead(leadId);
  if (!lead) return { ok: false, error: "Lead introuvable" };

  try {
    await db
      .update(leads)
      .set({ reviewStatus: "STOP" })
      .where(eq(leads.id, leadId));
  } catch {
    // fixture
  }

  patchFixtureLead(leadId, { reviewStatus: "STOP" });
  await stopPlannedTasksForLead(leadId, lead.companyName, actorId);

  return { ok: true, company: lead.companyName };
}

export async function correctLeadCompanyMutation(
  leadId: string,
  correctedName: string,
  actorId: string,
): Promise<ActionResult> {
  const lead = await resolveLead(leadId);
  if (!lead) return { ok: false, error: "Lead introuvable" };

  const trimmed = correctedName.trim();
  if (!trimmed) return { ok: false, error: "Nom corrigé requis" };

  const fromName = lead.companyName;

  try {
    await db
      .update(leads)
      .set({ companyName: trimmed, reviewStatus: "CORRECT" })
      .where(eq(leads.id, leadId));
  } catch {
    // fixture
  }

  patchFixtureLead(leadId, {
    companyName: trimmed,
    reviewStatus: "CORRECT",
  });

  for (let i = 0; i < FIXTURE_TASKS.length; i++) {
    const t = FIXTURE_TASKS[i];
    if (t && (t.leadId === leadId || t.company === fromName)) {
      FIXTURE_TASKS[i] = {
        ...t,
        company: trimmed,
        messageSubject: t.messageSubject?.replaceAll(fromName, trimmed) ?? null,
        messageBody: t.messageBody?.replaceAll(fromName, trimmed) ?? null,
      };
    }
  }

  await logLeadEvent({
    eventType: "COMPANY_CORRECTED",
    actorId,
    company: trimmed,
    note: `${fromName} → ${trimmed}`,
    payload: { leadId, from: fromName, to: trimmed },
  });

  return { ok: true, company: trimmed };
}

export async function markLeadsKeepBulkMutation(
  leadIds: string[],
  actorId: string,
): Promise<ActionResult & { applied?: number }> {
  let applied = 0;
  for (const id of leadIds) {
    const r = await markLeadKeepMutation(id, actorId);
    if (r.ok) applied += 1;
  }
  return { ok: true, applied };
}

export async function markLeadsStopBulkMutation(
  leadIds: string[],
  actorId: string,
): Promise<ActionResult & { applied?: number }> {
  let applied = 0;
  for (const id of leadIds) {
    const r = await markLeadStopMutation(id, actorId);
    if (r.ok) applied += 1;
  }
  return { ok: true, applied };
}
