import { and, count, desc, eq, or } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { todayParisIso } from "@/lib/pipeline/dates";
import { db } from "../index";
import {
  dailyBriefs,
  leads,
  sequenceTasks,
  signalFeed,
  webDiscoveries,
} from "../schema";
import { getPendingReviewQueue } from "./governance";
import type { SignalFeedItem } from "@/lib/signals/types";
import { getRecentEvents } from "./tasks";

export type { SignalFeedItem };

export interface DashboardKpis {
  activePlanned: number;
  todayCount: number;
  overdueCount: number;
  executionRate7d: number;
  stoppedLast30d: number;
}

export interface FixtureDailyBrief {
  id: string;
  briefDate: string;
  contentMarkdown: string;
  generatedAt: string;
}

const EMPTY_KPIS: DashboardKpis = {
  activePlanned: 0,
  todayCount: 0,
  overdueCount: 0,
  executionRate7d: 0,
  stoppedLast30d: 0,
};

function computeKpisFromTasks(
  tasks: { plannedDate: string; status: string }[],
): DashboardKpis {
  const today = todayParisIso();

  const activePlanned = tasks.filter((t) => t.status === "PLANNED").length;
  const todayCount = tasks.filter(
    (t) =>
      t.plannedDate === today &&
      (t.status === "PLANNED" || t.status === "POSTPONED"),
  ).length;
  const overdueCount = tasks.filter(
    (t) => t.status === "PLANNED" && t.plannedDate < today,
  ).length;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const windowStart = sevenDaysAgo.toISOString().split("T")[0] as string;

  const inWindow = tasks.filter((t) => t.plannedDate >= windowStart);
  const doneInWindow = inWindow.filter((t) => t.status === "DONE").length;
  const executionRate7d =
    inWindow.length > 0
      ? Math.round((doneInWindow / inWindow.length) * 1000) / 10
      : 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const stopWindow = thirtyDaysAgo.toISOString().split("T")[0] as string;
  const stoppedLast30d = tasks.filter(
    (t) => t.status === "STOPPED" && t.plannedDate >= stopWindow,
  ).length;

  return {
    activePlanned,
    todayCount,
    overdueCount,
    executionRate7d,
    stoppedLast30d,
  };
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  try {
    const rows = await db
      .select({
        plannedDate: sequenceTasks.plannedDate,
        status: sequenceTasks.status,
      })
      .from(sequenceTasks);
    return computeKpisFromTasks(rows);
  } catch {
    return EMPTY_KPIS;
  }
}

export async function getLatestDailyBrief(): Promise<FixtureDailyBrief | null> {
  const today = todayParisIso();
  try {
    const rows = await db
      .select()
      .from(dailyBriefs)
      .where(eq(dailyBriefs.briefDate, today))
      .limit(1);
    const r = rows[0];
    if (r) {
      return {
        id: r.id,
        briefDate: r.briefDate,
        contentMarkdown: r.contentMarkdown,
        generatedAt: r.generatedAt.toISOString(),
      };
    }
  } catch {
    // DB indisponible
  }
  return null;
}

function mapSignalRow(r: typeof signalFeed.$inferSelect): SignalFeedItem | null {
  const url = r.sourceUrl?.trim();
  if (!url?.startsWith("http")) return null;
  const domain = url.replace(/^https?:\/\//, "").split("/")[0]?.toLowerCase();
  if (!domain || domain.includes("example.com")) return null;

  // tags stocké en JSON dans SQLite — parser
  const tags: string[] =
    typeof r.tags === "string"
      ? (() => { try { return JSON.parse(r.tags); } catch { return []; } })()
      : (r.tags ?? []);

  return {
    id: r.id,
    title: r.title,
    sourceUrl: url,
    snippet: r.snippet ?? null,
    source: r.source,
    signalType: r.signalType ?? null,
    tags,
    companyName: r.companyName ?? null,
    relevanceScore: r.relevanceScore?.toString() ?? null,
    publishedAt: (r.publishedAt ?? r.fetchedAt).toISOString(),
  };
}

export async function getSignalFeed(limit = 10): Promise<SignalFeedItem[]> {
  try {
    const rows = await db
      .select()
      .from(signalFeed)
      .orderBy(desc(signalFeed.publishedAt))
      .limit(limit * 2);

    return rows
      .map(mapSignalRow)
      .filter((s): s is SignalFeedItem => s !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export interface PipelineFunnel {
  discoveries: number;
  leads: number;
  planned: number;
  executed: number;
}

const EMPTY_FUNNEL: PipelineFunnel = {
  discoveries: 0,
  leads: 0,
  planned: 0,
  executed: 0,
};

export async function getWebDiscoveriesCount(): Promise<number> {
  noStore();
  try {
    const [row] = await db.select({ value: count() }).from(webDiscoveries);
    return Number(row?.value ?? 0);
  } catch {
    return 0;
  }
}

export async function getPipelineFunnel(): Promise<PipelineFunnel> {
  noStore();
  try {
    const discoveries = await getWebDiscoveriesCount();
    const [leadRow] = await db.select({ value: count() }).from(leads);
    const [plannedRow] = await db
      .select({ value: count() })
      .from(sequenceTasks)
      .where(
        or(
          eq(sequenceTasks.status, "PLANNED"),
          eq(sequenceTasks.status, "POSTPONED"),
        ),
      );
    const [executedRow] = await db
      .select({ value: count() })
      .from(sequenceTasks)
      .where(eq(sequenceTasks.status, "DONE"));

    return {
      discoveries,
      leads: Number(leadRow?.value ?? 0),
      planned: Number(plannedRow?.value ?? 0),
      executed: Number(executedRow?.value ?? 0),
    };
  } catch {
    return EMPTY_FUNNEL;
  }
}

export async function getDashboardData() {
  noStore();
  const [kpis, brief, signals, events, pendingReview, funnel] =
    await Promise.all([
      getDashboardKpis(),
      getLatestDailyBrief(),
      getSignalFeed(8),
      getRecentEvents(10),
      getPendingReviewQueue(),
      getPipelineFunnel(),
    ]);

  return { kpis, brief, signals, events, pendingReview, funnel };
}
