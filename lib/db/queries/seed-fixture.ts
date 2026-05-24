import type { EventType } from "../schema";
import { build100FixtureTasks } from "./fixture-100-tasks";

/**
 * Dev-only seed fixture.
 * Injected by query functions when the DB returns 0 rows (empty Supabase instance).
 * Removed automatically once the real seed script runs in Phase 3.
 */

export type TaskStatus =
  | "PLANNED"
  | "DONE"
  | "POSTPONED"
  | "CANCELLED"
  | "STOPPED";
export type TaskTrack = "PE" | "MA";
export type TaskChannel = "EMAIL" | "LINKEDIN";
export type TaskStep =
  | "STEP_0_EMAIL"
  | "STEP_1_LINKEDIN"
  | "STEP_2_FOLLOWUP_1_EMAIL"
  | "STEP_3_FOLLOWUP_2_EMAIL";

export interface FixtureTask {
  id: string;
  sequenceUid: string;
  createdAt: string;
  leadId: string | null;
  company: string;
  track: TaskTrack;
  contactName: string | null;
  title: string | null;
  location: string | null;
  source: string | null;
  stepCode: TaskStep;
  plannedDate: string; // ISO date YYYY-MM-DD
  channel: TaskChannel;
  messageSubject: string | null;
  messageBody: string | null;
  status: TaskStatus;
  executionNote: string | null;
  executedAt: string | null;
  stopReason: string | null;
}

/** 100 tâches actives (Phase 3 acceptance). */
export const FIXTURE_TASKS: FixtureTask[] = build100FixtureTasks();

export interface FixtureEvent {
  id: string;
  occurredAt: string;
  eventType: EventType;
  taskId: string | null;
  actorId: string | null;
  company: string | null;
  note: string | null;
}

export const FIXTURE_EVENTS: FixtureEvent[] = [
  {
    id: "e1000000-0000-0000-0000-000000000001",
    occurredAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    eventType: "TASK_DONE" as const,
    taskId: "f1000000-0000-0000-0000-000000000006",
    actorId: null,
    company: "Eurazeo",
    note: "Réponse positive reçue",
  },
  {
    id: "e1000000-0000-0000-0000-000000000002",
    occurredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    eventType: "REVIEW_DECISION_APPLIED" as const,
    taskId: null,
    actorId: null,
    company: "Ardian",
    note: "Lead approuvé (KEEP)",
  },
  {
    id: "e1000000-0000-0000-0000-000000000003",
    occurredAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    eventType: "COMPANY_NORMALIZED" as const,
    taskId: null,
    actorId: null,
    company: "12 leads",
    note: "Normalisation automatique",
  },
  {
    id: "e1000000-0000-0000-0000-000000000004",
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    eventType: "TASK_POSTPONED" as const,
    taskId: "f1000000-0000-0000-0000-000000000010",
    actorId: null,
    company: "JP Morgan M&A",
    note: "Nicolas en congés jusqu'au 1er juin",
  },
  {
    id: "e1000000-0000-0000-0000-000000000005",
    occurredAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    eventType: "TASK_DONE" as const,
    taskId: "f1000000-0000-0000-0000-000000000012",
    actorId: null,
    company: "BNP Paribas CIB",
    note: null,
  },
  {
    id: "e1000000-0000-0000-0000-000000000006",
    occurredAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    eventType: "SEQUENCE_STOPPED" as const,
    taskId: "f1000000-0000-0000-0000-000000000008",
    actorId: null,
    company: "Blackstone",
    note: "Pas de réponse après 3 tentatives",
  },
];

// ─── Phase 2 — mutations en mémoire (fallback sans DB) ───────────────────────

export function findFixtureTask(taskId: string): FixtureTask | undefined {
  return FIXTURE_TASKS.find((t) => t.id === taskId);
}

export function patchFixtureTask(
  taskId: string,
  patch: Partial<FixtureTask>,
): FixtureTask | undefined {
  const idx = FIXTURE_TASKS.findIndex((t) => t.id === taskId);
  if (idx === -1) return undefined;
  const current = FIXTURE_TASKS[idx];
  if (!current) return undefined;
  const next = { ...current, ...patch };
  FIXTURE_TASKS[idx] = next;
  return next;
}

export function stopFixtureCompanyInFixture(
  company: string,
  reason: string,
): number {
  let count = 0;
  for (let i = 0; i < FIXTURE_TASKS.length; i++) {
    const task = FIXTURE_TASKS[i];
    if (!task) continue;
    if (
      task.company === company &&
      (task.status === "PLANNED" || task.status === "POSTPONED")
    ) {
      FIXTURE_TASKS[i] = {
        ...task,
        status: "STOPPED",
        stopReason: reason,
      };
      count++;
    }
  }
  return count;
}

let fixtureEventCounter = 100;

export function addFixtureEvent(event: {
  eventType: EventType;
  taskId: string | null;
  company: string | null;
  note: string | null;
}): void {
  fixtureEventCounter += 1;
  const id = `e1000000-0000-0000-0000-${String(fixtureEventCounter).padStart(12, "0")}`;
  FIXTURE_EVENTS.unshift({
    id,
    occurredAt: new Date().toISOString(),
    eventType: event.eventType,
    taskId: event.taskId,
    actorId: null,
    company: event.company,
    note: event.note,
  });
}
