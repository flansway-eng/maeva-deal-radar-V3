import {
  buildBriefPrompt,
  generateDailyBriefContent,
  mockDailyBrief,
} from "@/lib/brief/generate";
import { db } from "@/lib/db";
import { getDashboardKpis, getSignalFeed } from "@/lib/db/queries/dashboard";
import { getPendingReviewQueue } from "@/lib/db/queries/governance";
import { upsertFixtureBrief } from "@/lib/db/queries/innovation-fixture";
import { addFixtureEvent } from "@/lib/db/queries/seed-fixture";
import { getRecentEvents, getTodayTasks } from "@/lib/db/queries/tasks";
import { dailyBriefs, sequenceEvents } from "@/lib/db/schema";
import { todayParisIso } from "@/lib/pipeline/dates";
import { sendDailyBriefPushNotification } from "@/lib/push/subscriptions";

export async function runDailyBriefJob(
  actorId = "00000000-0000-0000-0000-000000000000",
) {
  const today = todayParisIso();
  const [kpis, todayTasks, events, signals, pending] = await Promise.all([
    getDashboardKpis(),
    getTodayTasks(),
    getRecentEvents(15),
    getSignalFeed(5),
    getPendingReviewQueue(),
  ]);

  const todaySummary = todayTasks
    .map((t) => `- ${t.company} · ${t.stepCode} · ${t.channel}`)
    .join("\n");
  const eventsSummary =
    events
      .slice(0, 8)
      .map((e) => `- ${e.eventType} ${e.company ?? ""}`)
      .join("\n") || "Aucun";
  const signalSummary = signals.map((s) => `- ${s.title}`).join("\n");

  const prompt = buildBriefPrompt({
    kpis,
    todayTasksSummary: todaySummary || "Aucune tâche",
    recentEvents: eventsSummary,
    signalHeadlines: signalSummary || "Pas de signal",
    pendingReviewCount: pending.length,
  });

  const content = hasAnthropic()
    ? await generateDailyBriefContent(prompt)
    : mockDailyBrief({ kpis, pendingReviewCount: pending.length });

  const brief = {
    id: `b1000000-0000-0000-0000-${Date.now()}`,
    briefDate: today,
    contentMarkdown: content,
    generatedAt: new Date().toISOString(),
  };

  try {
    await db
      .insert(dailyBriefs)
      .values({
        briefDate: today,
        contentMarkdown: content,
      })
      .onConflictDoUpdate({
        target: dailyBriefs.briefDate,
        set: { contentMarkdown: content, generatedAt: new Date() },
      });
  } catch {
    upsertFixtureBrief(brief);
  }

  try {
    await db.insert(sequenceEvents).values({
      eventType: "AI_DAILY_BRIEF_GENERATED",
      actorId,
      note: `Daily brief ${today}`,
    });
  } catch {
    addFixtureEvent({
      eventType: "AI_DAILY_BRIEF_GENERATED",
      taskId: null,
      company: null,
      note: `Daily brief ${today}`,
    });
  }

  await sendDailyBriefPushNotification({
    title: "Daily Brief — Deal Radar",
    body: content.slice(0, 120).replace(/\n/g, " "),
  });

  return brief;
}

function hasAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
