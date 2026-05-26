import type { EventType } from "../schema";
import { build100FixtureTasks } from "./fixture-100-tasks";

/**
 * Stockage mémoire optionnel pour mutations sans DB (tests / dev).
 * Jamais pré-rempli au démarrage — pas de seed automatique.
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
  plannedDate: string;
  channel: TaskChannel;
  messageSubject: string | null;
  messageBody: string | null;
  status: TaskStatus;
  executionNote: string | null;
  executedAt: string | null;
  stopReason: string | null;
}

/** Vide par défaut — utiliser build100FixtureTasks() dans les tests si besoin. */
export const FIXTURE_TASKS: FixtureTask[] = [];

export interface FixtureEvent {
  id: string;
  occurredAt: string;
  eventType: EventType;
  taskId: string | null;
  actorId: string | null;
  company: string | null;
  note: string | null;
}

export const FIXTURE_EVENTS: FixtureEvent[] = [];

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

/** Utilitaire tests — charge 100 tâches en mémoire. */
export function loadFixtureTasksForTests(): FixtureTask[] {
  FIXTURE_TASKS.splice(0, FIXTURE_TASKS.length, ...build100FixtureTasks());
  return FIXTURE_TASKS;
}
