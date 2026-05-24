import { eq } from "drizzle-orm";
import { FIXTURE_LEADS } from "@/lib/db/queries/governance-fixture";
import type { MessageContext } from "@/lib/messages/types";
import { db } from "../index";
import { leads, sequenceTasks } from "../schema";
import {
  FIXTURE_TASKS,
  type FixtureTask,
  findFixtureTask,
  patchFixtureTask,
} from "./seed-fixture";

export async function getTaskById(taskId: string): Promise<FixtureTask | null> {
  const fixture = findFixtureTask(taskId);
  if (fixture) return fixture;

  try {
    const rows = await db
      .select()
      .from(sequenceTasks)
      .where(eq(sequenceTasks.id, taskId))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return mapRow(r);
  } catch {
    return fixture ?? null;
  }
}

export async function getSequenceStepsForCompany(
  company: string,
): Promise<FixtureTask[]> {
  const fromFixture = FIXTURE_TASKS.filter((t) => t.company === company).sort(
    (a, b) => a.stepCode.localeCompare(b.stepCode),
  );
  if (fromFixture.length > 0) return fromFixture;

  try {
    const rows = await db
      .select()
      .from(sequenceTasks)
      .where(eq(sequenceTasks.company, company));
    if (rows.length === 0) return fromFixture;
    return rows
      .map(mapRow)
      .sort((a, b) => a.stepCode.localeCompare(b.stepCode));
  } catch {
    return fromFixture;
  }
}

export async function getMessageContext(
  taskId: string,
): Promise<MessageContext | null> {
  const task = await getTaskById(taskId);
  if (!task) return null;

  let companyNameOriginal: string | null = null;
  let personalizationFact: string | null = null;
  let personaName: string | null = task.contactName;

  if (task.leadId) {
    const lead = FIXTURE_LEADS.find((l) => l.id === task.leadId);
    if (lead) {
      companyNameOriginal = lead.companyNameOriginal;
      personaName = task.contactName ?? lead.companyName;
    }

    try {
      const rows = await db
        .select()
        .from(leads)
        .where(eq(leads.id, task.leadId))
        .limit(1);
      const r = rows[0];
      if (r) {
        companyNameOriginal = r.companyNameOriginal ?? companyNameOriginal;
        personalizationFact = r.personalizationFact ?? null;
        personaName = r.personaName ?? personaName;
      }
    } catch {
      // fixture only
    }
  }

  return {
    taskId: task.id,
    company: task.company,
    companyNameOriginal,
    track: task.track,
    channel: task.channel,
    stepCode: task.stepCode,
    contactName: task.contactName,
    title: task.title,
    source: task.source,
    personalizationFact,
    personaName,
  };
}

export async function updateTaskMessage(
  taskId: string,
  messageSubject: string | null,
  messageBody: string,
): Promise<boolean> {
  try {
    const updated = await db
      .update(sequenceTasks)
      .set({ messageSubject, messageBody })
      .where(eq(sequenceTasks.id, taskId))
      .returning({ id: sequenceTasks.id });
    if (updated.length > 0) return true;
  } catch {
    // fixture
  }

  const patched = patchFixtureTask(taskId, { messageSubject, messageBody });
  return Boolean(patched);
}

function mapRow(r: typeof sequenceTasks.$inferSelect): FixtureTask {
  return {
    id: r.id,
    sequenceUid: r.sequenceUid,
    createdAt: r.createdAt.toISOString(),
    leadId: r.leadId ?? null,
    company: r.company,
    track: r.track as FixtureTask["track"],
    contactName: r.contactName ?? null,
    title: r.title ?? null,
    location: r.location ?? null,
    source: r.source ?? null,
    stepCode: r.stepCode as FixtureTask["stepCode"],
    plannedDate: r.plannedDate,
    channel: r.channel as FixtureTask["channel"],
    messageSubject: r.messageSubject ?? null,
    messageBody: r.messageBody ?? null,
    status: r.status as FixtureTask["status"],
    executionNote: r.executionNote ?? null,
    executedAt: r.executedAt ? r.executedAt.toISOString() : null,
    stopReason: r.stopReason ?? null,
  };
}
