import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  FIXTURE_COMPANY_ALIASES,
  FIXTURE_LEADS,
  FIXTURE_REVIEW_DECISIONS,
  patchReviewDecision,
  type ReviewDecisionType,
  upsertFixtureAlias,
} from "@/lib/db/queries/governance-fixture";
import {
  addFixtureEvent,
  FIXTURE_TASKS,
  patchFixtureTask,
} from "@/lib/db/queries/seed-fixture";
import {
  companyAliases,
  type EventType,
  leads,
  reviewDecisions,
  sequenceEvents,
  sequenceTasks,
} from "@/lib/db/schema";
import { extractDomain } from "@/lib/governance/domain";
import type { ActionResult } from "@/lib/pipeline/types";

const ACTIVE = ["PLANNED", "POSTPONED"] as const;

export interface ReviewBatchItem {
  reviewId: string;
  decision: ReviewDecisionType;
  correctedCompany?: string;
  reason?: string;
}

async function logGovernanceEvent(params: {
  eventType: EventType;
  actorId: string;
  company: string | null;
  note: string | null;
  payload?: Record<string, unknown>;
}) {
  try {
    await db.insert(sequenceEvents).values({
      eventType: params.eventType,
      actorId: params.actorId,
      note: params.note,
      payload: params.payload ?? null,
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

function renameCompanyInFixtureMessages(
  fromCompany: string,
  toCompany: string,
): number {
  let count = 0;
  for (let i = 0; i < FIXTURE_TASKS.length; i++) {
    const t = FIXTURE_TASKS[i];
    if (!t || t.company !== fromCompany) continue;
    const subject =
      t.messageSubject?.replaceAll(fromCompany, toCompany) ?? null;
    const body = t.messageBody?.replaceAll(fromCompany, toCompany) ?? null;
    FIXTURE_TASKS[i] = {
      ...t,
      company: toCompany,
      messageSubject: subject,
      messageBody: body,
    };
    count++;
  }
  return count;
}

async function regenerateMessagesDb(
  fromCompany: string,
  toCompany: string,
): Promise<number> {
  try {
    const rows = await db
      .select()
      .from(sequenceTasks)
      .where(eq(sequenceTasks.company, fromCompany));

    for (const row of rows) {
      await db
        .update(sequenceTasks)
        .set({
          company: toCompany,
          messageSubject: row.messageSubject?.replaceAll(
            fromCompany,
            toCompany,
          ),
          messageBody: row.messageBody?.replaceAll(fromCompany, toCompany),
        })
        .where(eq(sequenceTasks.id, row.id));
    }
    if (rows.length > 0) return rows.length;
  } catch {
    // fixture
  }
  return renameCompanyInFixtureMessages(fromCompany, toCompany);
}

async function stopCompanyTasks(
  company: string,
  reason: string,
  actorId: string,
): Promise<void> {
  try {
    await db
      .update(sequenceTasks)
      .set({ status: "STOPPED", stopReason: reason })
      .where(
        and(
          eq(sequenceTasks.company, company),
          inArray(sequenceTasks.status, [...ACTIVE]),
        ),
      );
  } catch {
    // fixture
  }

  for (let i = 0; i < FIXTURE_TASKS.length; i++) {
    const t = FIXTURE_TASKS[i];
    if (
      t &&
      t.company === company &&
      (t.status === "PLANNED" || t.status === "POSTPONED")
    ) {
      FIXTURE_TASKS[i] = { ...t, status: "STOPPED", stopReason: reason };
    }
  }

  await logGovernanceEvent({
    eventType: "SEQUENCE_STOPPED",
    actorId,
    company,
    note: reason,
  });
}

export async function applyReviewDecisionsMutation(
  items: ReviewBatchItem[],
  actorId: string,
): Promise<ActionResult & { applied?: number }> {
  if (items.length === 0) {
    return { ok: false, error: "Aucune décision à appliquer" };
  }

  let applied = 0;
  const now = new Date();

  for (const item of items) {
    const fixture = FIXTURE_REVIEW_DECISIONS.find(
      (r) => r.id === item.reviewId,
    );
    const rawCompany = fixture?.rawCompany ?? null;
    const companyBefore =
      fixture?.correctedCompany ?? rawCompany ?? "Société inconnue";

    let companyAfter = companyBefore;
    if (item.decision === "CORRECT" && item.correctedCompany?.trim()) {
      companyAfter = item.correctedCompany.trim();
    } else if (item.decision === "KEEP" && fixture?.correctedCompany) {
      companyAfter = fixture.correctedCompany;
    }

    try {
      await db
        .update(reviewDecisions)
        .set({
          decision: item.decision,
          correctedCompany: item.correctedCompany ?? null,
          reason: item.reason ?? null,
          appliedAt: now,
          appliedBy: actorId,
        })
        .where(eq(reviewDecisions.id, item.reviewId));
    } catch {
      patchReviewDecision(item.reviewId, {
        decision: item.decision,
        correctedCompany: item.correctedCompany ?? null,
        reason: item.reason ?? null,
        appliedAt: now.toISOString(),
      });
    }

    if (fixture?.leadId) {
      try {
        const leadPatch: {
          reviewStatus: ReviewDecisionType;
          companyName?: string;
        } = { reviewStatus: item.decision };
        if (item.decision === "CORRECT") {
          leadPatch.companyName = companyAfter;
        }
        await db
          .update(leads)
          .set(leadPatch)
          .where(eq(leads.id, fixture.leadId));
      } catch {
        const lead = FIXTURE_LEADS.find((l) => l.id === fixture.leadId);
        if (lead) {
          lead.reviewStatus = item.decision;
          if (item.decision === "CORRECT") lead.companyName = companyAfter;
        }
      }
    }

    if (item.decision === "STOP") {
      await stopCompanyTasks(
        companyAfter,
        item.reason ?? "Décision STOP — review queue",
        actorId,
      );
    }

    if (item.decision === "CORRECT" && companyBefore !== companyAfter) {
      const regen = await regenerateMessagesDb(companyBefore, companyAfter);
      await logGovernanceEvent({
        eventType: "COMPANY_CORRECTED",
        actorId,
        company: companyAfter,
        note: `Correction ${companyBefore} → ${companyAfter}`,
        payload: { regen },
      });
      await logGovernanceEvent({
        eventType: "MESSAGES_REGENERATED",
        actorId,
        company: companyAfter,
        note: `${regen} message(s) mis à jour`,
      });
    }

    await logGovernanceEvent({
      eventType: "REVIEW_DECISION_APPLIED",
      actorId,
      company: companyAfter,
      note: item.reason ?? `${item.decision} appliqué`,
      payload: { reviewId: item.reviewId, decision: item.decision },
    });

    applied++;
  }

  return { ok: true, applied };
}

export async function upsertAliasMutation(
  input: {
    id?: string;
    domain: string;
    canonicalName: string;
    track?: "PE" | "MA" | null;
    notes?: string | null;
  },
  actorId: string,
): Promise<ActionResult> {
  const domain = input.domain
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
  const canonicalName = input.canonicalName.trim();
  if (!domain || !canonicalName) {
    return { ok: false, error: "Domaine et nom canonique requis" };
  }

  try {
    await db
      .insert(companyAliases)
      .values({
        id: input.id,
        domain,
        canonicalName,
        track: input.track ?? null,
        notes: input.notes ?? null,
      })
      .onConflictDoUpdate({
        target: companyAliases.domain,
        set: {
          canonicalName,
          track: input.track ?? null,
          notes: input.notes ?? null,
        },
      });
  } catch {
    upsertFixtureAlias({
      id: input.id,
      domain,
      canonicalName,
      track: input.track ?? null,
      notes: input.notes ?? null,
    });
  }

  await logGovernanceEvent({
    eventType: "COMPANY_NORMALIZED",
    actorId,
    company: canonicalName,
    note: `Alias ${domain} → ${canonicalName}`,
  });

  return { ok: true, company: canonicalName };
}

export async function autoNormalizeMutation(
  actorId: string,
): Promise<ActionResult & { normalized?: number }> {
  const aliases = [...FIXTURE_COMPANY_ALIASES];
  try {
    const rows = await db.select().from(companyAliases);
    for (const r of rows) {
      aliases.push({
        id: r.id,
        domain: r.domain,
        canonicalName: r.canonicalName,
        track: r.track ?? null,
        notes: r.notes ?? null,
      });
    }
  } catch {
    // fixture only
  }

  const aliasByDomain = new Map(
    aliases.map((a) => [a.domain, a.canonicalName]),
  );
  let normalized = 0;

  const tasksToScan = [...FIXTURE_TASKS];
  for (const task of tasksToScan) {
    if (task.status !== "PLANNED" && task.status !== "POSTPONED") continue;

    const domain = extractDomain(task.source);
    if (!domain) continue;

    const canonical = aliasByDomain.get(domain);
    if (!canonical || canonical === task.company) continue;

    const updated = await regenerateMessagesDb(task.company, canonical);
    if (updated > 0) normalized += updated;

    patchFixtureTask(task.id, { company: canonical });
    try {
      await db
        .update(sequenceTasks)
        .set({ company: canonical })
        .where(eq(sequenceTasks.id, task.id));
    } catch {
      // ok
    }

    await logGovernanceEvent({
      eventType: "COMPANY_NORMALIZED",
      actorId,
      company: canonical,
      note: `Auto-normalize via ${domain}`,
      payload: { taskId: task.id, domain },
    });
  }

  return { ok: true, normalized };
}

export async function regenerateMessagesMutation(
  company: string,
  newName: string,
  actorId: string,
): Promise<ActionResult & { count?: number }> {
  if (!company.trim() || !newName.trim()) {
    return { ok: false, error: "Noms requis" };
  }
  const count = await regenerateMessagesDb(company.trim(), newName.trim());
  await logGovernanceEvent({
    eventType: "MESSAGES_REGENERATED",
    actorId,
    company: newName.trim(),
    note: `${count} message(s) régénérés pour ${company}`,
  });
  return { ok: true, count, company: newName.trim() };
}
