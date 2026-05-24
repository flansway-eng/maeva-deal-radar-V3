import { db } from "@/lib/db";
import { updateTaskMessage } from "@/lib/db/queries/messages";
import { addFixtureEvent } from "@/lib/db/queries/seed-fixture";
import { sequenceEvents } from "@/lib/db/schema";

export async function saveTaskMessageMutation(params: {
  taskId: string;
  messageSubject: string | null;
  messageBody: string;
  actorId: string;
  company: string;
}): Promise<boolean> {
  const ok = await updateTaskMessage(
    params.taskId,
    params.messageSubject,
    params.messageBody,
  );

  if (ok) {
    try {
      await db.insert(sequenceEvents).values({
        eventType: "MESSAGES_REGENERATED",
        taskId: params.taskId,
        actorId: params.actorId,
        note: "Message enregistré manuellement",
        payload: { action: "save" },
      });
    } catch {
      addFixtureEvent({
        eventType: "MESSAGES_REGENERATED",
        taskId: params.taskId,
        company: params.company,
        note: "Message enregistré",
      });
    }
  }

  return ok;
}
