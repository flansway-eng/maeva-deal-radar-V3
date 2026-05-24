/**
 * Server-only Drizzle query functions for pipeline (read + journal).
 * Falls back to the static fixture when the DB returns 0 rows.
 */
import { and, desc, eq, gte, lte, or } from "drizzle-orm";
import { db } from "../index";
import { sequenceEvents, sequenceTasks } from "../schema";
import {
  FIXTURE_EVENTS,
  FIXTURE_TASKS,
  type FixtureTask,
  type TaskStatus,
  type TaskTrack,
} from "./seed-fixture";

export type { FixtureTask, TaskStatus, TaskTrack };
export type { TaskChannel, TaskStep } from "./seed-fixture";

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface TaskFilters {
  track?: TaskTrack;
  status?: TaskStatus;
  search?: string; // matches on company name (case-insensitive)
}

// ─── Get all tasks (Kanban / Liste) ─────────────────────────────────────────

export async function getAllTasks(
  filters: TaskFilters = {},
): Promise<FixtureTask[]> {
  try {
    const rows = await db
      .select()
      .from(sequenceTasks)
      .orderBy(desc(sequenceTasks.plannedDate));

    if (rows.length === 0) {
      // DB empty → use dev fixture
      return applyFilters(FIXTURE_TASKS, filters);
    }

    // Map Drizzle rows to FixtureTask shape
    const mapped: FixtureTask[] = rows.map((r) => ({
      id: r.id,
      sequenceUid: r.sequenceUid,
      createdAt: r.createdAt.toISOString(),
      leadId: r.leadId ?? null,
      company: r.company,
      track: r.track as TaskTrack,
      contactName: r.contactName ?? null,
      title: r.title ?? null,
      location: r.location ?? null,
      source: r.source ?? null,
      stepCode: r.stepCode as FixtureTask["stepCode"],
      plannedDate: r.plannedDate,
      channel: r.channel as FixtureTask["channel"],
      messageSubject: r.messageSubject ?? null,
      messageBody: r.messageBody ?? null,
      status: r.status as TaskStatus,
      executionNote: r.executionNote ?? null,
      executedAt: r.executedAt ? r.executedAt.toISOString() : null,
      stopReason: r.stopReason ?? null,
    }));

    return applyFilters(mapped, filters);
  } catch {
    // DB not reachable yet (local dev without Supabase) → fallback
    return applyFilters(FIXTURE_TASKS, filters);
  }
}

// ─── Get today's tasks (/today — Paris clock) ────────────────────────────────

export async function getTodayTasks(): Promise<FixtureTask[]> {
  // Use Europe/Paris date
  const todayParis = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("/")
    .reverse()
    .join("-"); // → YYYY-MM-DD

  try {
    const rows = await db
      .select()
      .from(sequenceTasks)
      .where(
        and(
          eq(sequenceTasks.plannedDate, todayParis),
          or(
            eq(sequenceTasks.status, "PLANNED"),
            eq(sequenceTasks.status, "POSTPONED"),
          ),
        ),
      )
      .orderBy(sequenceTasks.channel, sequenceTasks.plannedDate);

    if (rows.length === 0) {
      return FIXTURE_TASKS.filter(
        (t) =>
          t.plannedDate === todayParis &&
          (t.status === "PLANNED" || t.status === "POSTPONED"),
      ).sort((a, b) => a.channel.localeCompare(b.channel));
    }

    return rows.map((r) => ({
      id: r.id,
      sequenceUid: r.sequenceUid,
      createdAt: r.createdAt.toISOString(),
      leadId: r.leadId ?? null,
      company: r.company,
      track: r.track as TaskTrack,
      contactName: r.contactName ?? null,
      title: r.title ?? null,
      location: r.location ?? null,
      source: r.source ?? null,
      stepCode: r.stepCode as FixtureTask["stepCode"],
      plannedDate: r.plannedDate,
      channel: r.channel as FixtureTask["channel"],
      messageSubject: r.messageSubject ?? null,
      messageBody: r.messageBody ?? null,
      status: r.status as TaskStatus,
      executionNote: r.executionNote ?? null,
      executedAt: r.executedAt ? r.executedAt.toISOString() : null,
      stopReason: r.stopReason ?? null,
    }));
  } catch {
    const todayStr = new Date().toISOString().split("T")[0] as string;
    return FIXTURE_TASKS.filter(
      (t) =>
        t.plannedDate === todayStr &&
        (t.status === "PLANNED" || t.status === "POSTPONED"),
    ).sort((a, b) => a.channel.localeCompare(b.channel));
  }
}

// ─── Get tasks for calendar (month/year) ────────────────────────────────────

export async function getCalendarTasks(
  year: number,
  month: number, // 1-based
): Promise<FixtureTask[]> {
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  try {
    const rows = await db
      .select()
      .from(sequenceTasks)
      .where(
        and(
          gte(sequenceTasks.plannedDate, firstDay),
          lte(sequenceTasks.plannedDate, lastDay),
        ),
      );

    if (rows.length === 0) {
      return FIXTURE_TASKS.filter(
        (t) => t.plannedDate >= firstDay && t.plannedDate <= lastDay,
      );
    }

    return rows.map((r) => ({
      id: r.id,
      sequenceUid: r.sequenceUid,
      createdAt: r.createdAt.toISOString(),
      leadId: r.leadId ?? null,
      company: r.company,
      track: r.track as TaskTrack,
      contactName: r.contactName ?? null,
      title: r.title ?? null,
      location: r.location ?? null,
      source: r.source ?? null,
      stepCode: r.stepCode as FixtureTask["stepCode"],
      plannedDate: r.plannedDate,
      channel: r.channel as FixtureTask["channel"],
      messageSubject: r.messageSubject ?? null,
      messageBody: r.messageBody ?? null,
      status: r.status as TaskStatus,
      executionNote: r.executionNote ?? null,
      executedAt: r.executedAt ? r.executedAt.toISOString() : null,
      stopReason: r.stopReason ?? null,
    }));
  } catch {
    return FIXTURE_TASKS.filter(
      (t) => t.plannedDate >= firstDay && t.plannedDate <= lastDay,
    );
  }
}

// ─── Get recent journal events ───────────────────────────────────────────────

export interface JournalEvent {
  id: string;
  occurredAt: string;
  eventType: string;
  taskId: string | null;
  company: string | null;
  note: string | null;
}

export async function getRecentEvents(limit = 200): Promise<JournalEvent[]> {
  try {
    const rows = await db
      .select()
      .from(sequenceEvents)
      .orderBy(desc(sequenceEvents.occurredAt))
      .limit(limit);

    if (rows.length === 0) {
      return FIXTURE_EVENTS.slice(0, limit).map((e) => ({
        id: e.id,
        occurredAt: e.occurredAt,
        eventType: e.eventType,
        taskId: e.taskId ?? null,
        company: e.company ?? null,
        note: e.note ?? null,
      }));
    }

    // Join with task company name via the task relationship
    return rows.map((r) => ({
      id: r.id,
      occurredAt: r.occurredAt.toISOString(),
      eventType: r.eventType,
      taskId: r.taskId ?? null,
      company: null, // populated by caller via task join if needed
      note: r.note ?? null,
    }));
  } catch {
    return FIXTURE_EVENTS.slice(0, limit).map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt,
      eventType: e.eventType,
      taskId: e.taskId ?? null,
      company: e.company ?? null,
      note: e.note ?? null,
    }));
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function applyFilters(
  tasks: FixtureTask[],
  filters: TaskFilters,
): FixtureTask[] {
  return tasks.filter((t) => {
    if (filters.track && t.track !== filters.track) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (
      filters.search &&
      !t.company.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });
}
