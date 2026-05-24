import { desc, eq } from "drizzle-orm";
import { todayParisIso } from "@/lib/pipeline/dates";
import { db } from "../index";
import { dailyBriefs, signalFeed } from "../schema";
import { getPendingReviewQueue } from "./governance";
import {
  FIXTURE_DAILY_BRIEFS,
  type FixtureDailyBrief,
} from "./innovation-fixture";
import type { SignalFeedItem } from "@/lib/signals/types";
import { FIXTURE_TASKS } from "./seed-fixture";
import { getRecentEvents } from "./tasks";

export type { SignalFeedItem };

export interface DashboardKpis {
  activePlanned: number;
  todayCount: number;
  overdueCount: number;
  executionRate7d: number;
  stoppedLast30d: number;
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const today = todayParisIso();
  const tasks = FIXTURE_TASKS;

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

  const stoppedLast30d = tasks.filter((t) => t.status === "STOPPED").length;

  return {
    activePlanned,
    todayCount,
    overdueCount,
    executionRate7d,
    stoppedLast30d,
  };
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
    // fixture
  }
  return (
    FIXTURE_DAILY_BRIEFS.find((b) => b.briefDate === today) ??
    FIXTURE_DAILY_BRIEFS[0] ??
    null
  );
}

function mapSignalRow(r: typeof signalFeed.$inferSelect): SignalFeedItem | null {
  const url = r.sourceUrl?.trim();
  if (!url?.startsWith("http")) return null;
  const domain = url.replace(/^https?:\/\//, "").split("/")[0]?.toLowerCase();
  if (!domain || domain.includes("example.com")) return null;

  return {
    id: r.id,
    title: r.title,
    sourceUrl: url,
    snippet: r.snippet ?? null,
    source: r.source,
    signalType: r.signalType ?? null,
    tags: r.tags ?? [],
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

export async function getPipelineFunnel(): Promise<PipelineFunnel> {
  const tasks = FIXTURE_TASKS;
  const planned = tasks.filter(
    (t) => t.status === "PLANNED" || t.status === "POSTPONED",
  ).length;
  const executed = tasks.filter((t) => t.status === "DONE").length;
  return {
    discoveries: 142,
    leads: 58,
    planned,
    executed,
  };
}

export async function getDashboardData() {
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
