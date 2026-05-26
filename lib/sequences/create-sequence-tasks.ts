import "server-only";

import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import type { FixtureLead } from "@/lib/db/queries/governance-fixture";
import { db } from "@/lib/db";
import { sequenceTasks } from "@/lib/db/schema";
import { addDaysIso, todayParisIso } from "@/lib/pipeline/dates";
import { SEQUENCE_STEPS, sequenceUidFor } from "./constants";
import type { SequenceStepMessage } from "./generate-sequence-messages";

export async function sequenceExistsForLead(leadId: string): Promise<boolean> {
  const uids = SEQUENCE_STEPS.map((s) => sequenceUidFor(leadId, s.stepCode));
  try {
    const rows = await db
      .select({ sequenceUid: sequenceTasks.sequenceUid })
      .from(sequenceTasks)
      .where(inArray(sequenceTasks.sequenceUid, uids))
      .limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function createSequenceTasksForLead(
  lead: FixtureLead,
  messages: SequenceStepMessage[],
): Promise<number> {
  const today = todayParisIso();
  const messageByStep = new Map(messages.map((m) => [m.stepCode, m]));

  let inserted = 0;
  for (const step of SEQUENCE_STEPS) {
    const msg = messageByStep.get(step.stepCode);
    if (!msg) continue;

    await db.insert(sequenceTasks).values({
      id: randomUUID(),
      sequenceUid: sequenceUidFor(lead.id, step.stepCode),
      leadId: lead.id,
      company: lead.companyName,
      track: lead.track,
      title: lead.targetRole ?? null,
      location: "Île-de-France",
      source: lead.pageUrl ?? lead.website ?? null,
      stepCode: step.stepCode,
      plannedDate: addDaysIso(today, step.offsetDays),
      channel: step.channel,
      messageSubject: msg.subject,
      messageBody: msg.body,
      status: "PLANNED",
    });
    inserted += 1;
  }

  return inserted;
}
