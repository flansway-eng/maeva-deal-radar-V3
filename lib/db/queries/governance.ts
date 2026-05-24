import { desc, isNull } from "drizzle-orm";
import { extractDomain } from "@/lib/governance/domain";
import { db } from "../index";
import {
  companyAliases,
  leads,
  reviewDecisions,
  sequenceTasks,
} from "../schema";
import {
  FIXTURE_COMPANY_ALIASES,
  FIXTURE_LEADS,
  FIXTURE_REVIEW_DECISIONS,
  type FixtureCompanyAlias,
  type FixtureLead,
  type FixtureReviewDecision,
} from "./governance-fixture";
import { FIXTURE_TASKS } from "./seed-fixture";

export type {
  FixtureCompanyAlias,
  FixtureLead,
  FixtureReviewDecision,
  ReviewDecisionType,
} from "./governance-fixture";

export interface PendingReviewRow extends FixtureReviewDecision {
  previewUrl: string | null;
  leadCompany: string | null;
  track: "PE" | "MA" | null;
}

export interface QualityAuditReport {
  generatedAt: string;
  leadStats: {
    total: number;
    pending: number;
    keep: number;
    stop: number;
    correct: number;
    pendingPct: number;
    keepPct: number;
    stopPct: number;
  };
  taskStats: {
    active: number;
    planned: number;
    stopped: number;
  };
  suspectDomains: { domain: string; taskCount: number; hasAlias: boolean }[];
  sourcesToInvestigate: {
    source: string;
    rawCompany: string | null;
    confidence: string | null;
  }[];
}

export async function getPendingReviewQueue(): Promise<PendingReviewRow[]> {
  try {
    const rows = await db
      .select()
      .from(reviewDecisions)
      .where(isNull(reviewDecisions.appliedAt))
      .orderBy(desc(reviewDecisions.createdAt));

    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        source: r.source,
        rawCompany: r.rawCompany ?? null,
        decision: r.decision,
        correctedCompany: r.correctedCompany ?? null,
        reason: r.reason ?? null,
        appliedAt: null,
        leadId: null,
        previewUrl: r.source.startsWith("http") ? r.source : null,
        leadCompany: r.correctedCompany ?? r.rawCompany,
        track: null,
      }));
    }
  } catch {
    // fixture fallback
  }

  return FIXTURE_REVIEW_DECISIONS.filter((r) => !r.appliedAt).map((r) => {
    const lead = r.leadId
      ? FIXTURE_LEADS.find((l) => l.id === r.leadId)
      : FIXTURE_LEADS.find(
          (l) =>
            l.companyNameOriginal === r.rawCompany ||
            l.companyName === r.correctedCompany,
        );
    return {
      ...r,
      previewUrl: r.source.startsWith("http") ? r.source : null,
      leadCompany: lead?.companyName ?? r.correctedCompany,
      track: lead?.track ?? null,
    };
  });
}

export async function getCompanyAliasesList(): Promise<FixtureCompanyAlias[]> {
  try {
    const rows = await db.select().from(companyAliases);
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        domain: r.domain,
        canonicalName: r.canonicalName,
        track: r.track ?? null,
        notes: r.notes ?? null,
      }));
    }
  } catch {
    // fixture
  }
  return [...FIXTURE_COMPANY_ALIASES];
}

export async function getLeadsForGovernance(): Promise<FixtureLead[]> {
  try {
    const rows = await db.select().from(leads);
    if (rows.length > 0) {
      return rows.map((r) => ({
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
      }));
    }
  } catch {
    // fixture
  }
  return [...FIXTURE_LEADS];
}

export async function buildQualityAuditReport(): Promise<QualityAuditReport> {
  const leadList = await getLeadsForGovernance();
  const aliases = await getCompanyAliasesList();
  const aliasDomains = new Set(aliases.map((a) => a.domain));

  type TaskSlice = {
    company: string;
    status: string;
    source: string | null;
  };

  let tasks: TaskSlice[] = FIXTURE_TASKS.map((t) => ({
    company: t.company,
    status: t.status,
    source: t.source,
  }));

  try {
    const rows = await db.select().from(sequenceTasks);
    if (rows.length > 0) {
      tasks = rows.map((r) => ({
        company: r.company,
        status: r.status,
        source: r.source ?? null,
      }));
    }
  } catch {
    // fixture
  }

  const pending = leadList.filter((l) => l.reviewStatus === "PENDING").length;
  const keep = leadList.filter((l) => l.reviewStatus === "KEEP").length;
  const stop = leadList.filter((l) => l.reviewStatus === "STOP").length;
  const correct = leadList.filter((l) => l.reviewStatus === "CORRECT").length;
  const total = leadList.length || 1;

  const domainCounts = new Map<string, number>();
  for (const t of tasks) {
    const domain = extractDomain(t.source);
    if (domain) {
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    }
  }

  const suspectDomains = [...domainCounts.entries()]
    .map(([domain, taskCount]) => ({
      domain,
      taskCount,
      hasAlias: aliasDomains.has(domain),
    }))
    .filter((d) => !d.hasAlias && d.taskCount >= 1)
    .sort((a, b) => b.taskCount - a.taskCount)
    .slice(0, 10);

  const lowConfidence = leadList
    .filter((l) => {
      const score = l.confidenceScore
        ? Number.parseFloat(l.confidenceScore)
        : 1;
      return score < 0.65 && l.reviewStatus === "PENDING";
    })
    .slice(0, 8)
    .map((l) => ({
      source: l.pageUrl ?? l.website ?? "—",
      rawCompany: l.companyNameOriginal,
      confidence: l.confidenceScore,
    }));

  const active = tasks.filter(
    (t) => t.status === "PLANNED" || t.status === "POSTPONED",
  );

  return {
    generatedAt: new Date().toISOString(),
    leadStats: {
      total: leadList.length,
      pending,
      keep,
      stop,
      correct,
      pendingPct: Math.round((pending / total) * 100),
      keepPct: Math.round((keep / total) * 100),
      stopPct: Math.round((stop / total) * 100),
    },
    taskStats: {
      active: active.length,
      planned: tasks.filter((t) => t.status === "PLANNED").length,
      stopped: tasks.filter((t) => t.status === "STOPPED").length,
    },
    suspectDomains,
    sourcesToInvestigate: lowConfidence,
  };
}

export { extractDomain } from "@/lib/governance/domain";
