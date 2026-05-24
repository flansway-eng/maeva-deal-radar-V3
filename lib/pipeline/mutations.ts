import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  addFixtureEvent,
  findFixtureTask,
  patchFixtureTask,
  stopFixtureCompanyInFixture,
} from "@/lib/db/queries/seed-fixture";
import { type EventType, sequenceEvents, sequenceTasks } from "@/lib/db/schema";
import type { ActionResult } from "./types";

const ACTIVE_STATUSES = ["PLANNED", "POSTPONED"] as const;

async function logEvent(params: {
  eventType: EventType;
  taskId?: string | null;
  actorId: string;
  note?: string | null;
  payload?: Record<string, unknown>;
  company?: string | null;
}) {
  const row = {
    eventType: params.eventType,
    taskId: params.taskId ?? null,
    actorId: params.actorId,
    note: params.note ?? null,
    payload: params.payload ?? null,
  };

  try {
    await db.insert(sequenceEvents).values(row);
  } catch {
    addFixtureEvent({
      eventType: params.eventType,
      taskId: params.taskId ?? null,
      company: params.company ?? null,
      note: params.note ?? null,
    });
  }
}

async function updateTaskInDb(
  taskId: string,
  patch: Partial<typeof sequenceTasks.$inferInsert>,
): Promise<boolean> {
  try {
    const updated = await db
      .update(sequenceTasks)
      .set(patch)
      .where(eq(sequenceTasks.id, taskId))
      .returning({ id: sequenceTasks.id });
    return updated.length > 0;
  } catch {
    return false;
  }
}

async function resolveTaskCompany(taskId: string): Promise<string | null> {
  const fixture = findFixtureTask(taskId);
  if (fixture) return fixture.company;

  try {
    const rows = await db
      .select({ company: sequenceTasks.company })
      .from(sequenceTasks)
      .where(eq(sequenceTasks.id, taskId))
      .limit(1);
    return rows[0]?.company ?? null;
  } catch {
    return null;
  }
}

export async function markTaskDoneMutation(input: {
  taskId: string;
  actorId: string;
  note?: string;
}): Promise<ActionResult> {
  const now = new Date();
  const patch = {
    status: "DONE" as const,
    executedAt: now,
    executionNote: input.note ?? null,
  };

  const updated = await updateTaskInDb(input.taskId, patch);
  if (!updated) {
    const fixture = findFixtureTask(input.taskId);
    if (!fixture) return { ok: false, error: "Tâche introuvable" };
    patchFixtureTask(input.taskId, {
      status: "DONE",
      executedAt: now.toISOString(),
      executionNote: input.note ?? null,
    });
  }

  const company = await resolveTaskCompany(input.taskId);
  await logEvent({
    eventType: "TASK_DONE",
    taskId: input.taskId,
    actorId: input.actorId,
    note: input.note,
    company,
  });

  return { ok: true, taskId: input.taskId, company: company ?? undefined };
}

export async function postponeTaskMutation(input: {
  taskId: string;
  actorId: string;
  newPlannedDate: string;
  note?: string;
}): Promise<ActionResult> {
  const patch = {
    status: "POSTPONED" as const,
    plannedDate: input.newPlannedDate,
    executionNote: input.note ?? null,
  };

  const updated = await updateTaskInDb(input.taskId, patch);
  if (!updated) {
    if (!findFixtureTask(input.taskId)) {
      return { ok: false, error: "Tâche introuvable" };
    }
    patchFixtureTask(input.taskId, patch);
  }

  const company = await resolveTaskCompany(input.taskId);
  await logEvent({
    eventType: "TASK_POSTPONED",
    taskId: input.taskId,
    actorId: input.actorId,
    note: input.note ?? `Reporté au ${input.newPlannedDate}`,
    payload: { newPlannedDate: input.newPlannedDate },
    company,
  });

  return { ok: true, taskId: input.taskId, company: company ?? undefined };
}

export async function cancelTaskMutation(input: {
  taskId: string;
  actorId: string;
  reason: string;
}): Promise<ActionResult> {
  const patch = {
    status: "CANCELLED" as const,
    stopReason: input.reason,
  };

  const updated = await updateTaskInDb(input.taskId, patch);
  if (!updated) {
    if (!findFixtureTask(input.taskId)) {
      return { ok: false, error: "Tâche introuvable" };
    }
    patchFixtureTask(input.taskId, patch);
  }

  const company = await resolveTaskCompany(input.taskId);
  await logEvent({
    eventType: "TASK_CANCELLED",
    taskId: input.taskId,
    actorId: input.actorId,
    note: input.reason,
    company,
  });

  return { ok: true, taskId: input.taskId, company: company ?? undefined };
}

export async function stopCompanyMutation(input: {
  company: string;
  actorId: string;
  reason: string;
}): Promise<ActionResult> {
  const company = input.company.trim();
  if (!company) return { ok: false, error: "Nom de société requis" };

  try {
    await db
      .update(sequenceTasks)
      .set({ status: "STOPPED", stopReason: input.reason })
      .where(
        and(
          eq(sequenceTasks.company, company),
          inArray(sequenceTasks.status, [...ACTIVE_STATUSES]),
        ),
      );
  } catch {
    // fixture fallback below
  }

  const stoppedCount = stopFixtureCompanyInFixture(company, input.reason);

  await logEvent({
    eventType: "SEQUENCE_STOPPED",
    taskId: null,
    actorId: input.actorId,
    note: input.reason,
    company,
    payload: { stoppedCount },
  });

  return { ok: true, company };
}

export async function moveTaskStatusMutation(input: {
  taskId: string;
  actorId: string;
  newStatus: "PLANNED" | "DONE" | "POSTPONED" | "CANCELLED" | "STOPPED";
  note?: string;
}): Promise<ActionResult> {
  switch (input.newStatus) {
    case "DONE":
      return markTaskDoneMutation({
        taskId: input.taskId,
        actorId: input.actorId,
        note: input.note,
      });
    case "POSTPONED": {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const newPlannedDate = d.toISOString().split("T")[0] as string;
      return postponeTaskMutation({
        taskId: input.taskId,
        actorId: input.actorId,
        newPlannedDate,
        note: input.note ?? "Reporté via Kanban (+1 jour)",
      });
    }
    case "CANCELLED":
      return cancelTaskMutation({
        taskId: input.taskId,
        actorId: input.actorId,
        reason: input.note ?? "Annulé via Kanban",
      });
    case "STOPPED": {
      const company = await resolveTaskCompany(input.taskId);
      if (!company) return { ok: false, error: "Société introuvable" };
      return stopCompanyMutation({
        company,
        actorId: input.actorId,
        reason: input.note ?? "Séquence arrêtée via Kanban",
      });
    }
    case "PLANNED": {
      const patch = {
        status: "PLANNED" as const,
        executedAt: null,
        stopReason: null,
      };
      const updated = await updateTaskInDb(input.taskId, patch);
      if (!updated) {
        if (!findFixtureTask(input.taskId)) {
          return { ok: false, error: "Tâche introuvable" };
        }
        patchFixtureTask(input.taskId, {
          status: "PLANNED",
          executedAt: null,
          stopReason: null,
        });
      }
      const company = await resolveTaskCompany(input.taskId);
      await logEvent({
        eventType: "TASK_POSTPONED",
        taskId: input.taskId,
        actorId: input.actorId,
        note: "Réouverture en planifié",
        company,
        payload: { reopened: true },
      });
      return { ok: true, taskId: input.taskId, company: company ?? undefined };
    }
    default:
      return { ok: false, error: "Statut non supporté" };
  }
}
