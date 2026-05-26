"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getLeadById } from "@/lib/db/queries/leads";
import {
  createSequenceTasksForLead,
  sequenceExistsForLead,
} from "@/lib/sequences/create-sequence-tasks";
import { generateSequenceMessages } from "@/lib/sequences/generate-sequence-messages";

const schema = z.object({ leadId: z.string().min(1) });

export type GenerateSequenceResult =
  | { ok: true; companyName: string; created: number }
  | { ok: false; error: string };

export async function generateSequence(
  leadId: string,
): Promise<GenerateSequenceResult> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = schema.safeParse({ leadId });
  if (!parsed.success) return { ok: false, error: "Lead invalide" };

  const lead = await getLeadById(parsed.data.leadId);
  if (!lead) return { ok: false, error: "Lead introuvable" };

  if (lead.reviewStatus !== "KEEP") {
    return {
      ok: false,
      error: "La séquence n'est disponible que pour les leads KEEP",
    };
  }

  if (await sequenceExistsForLead(lead.id)) {
    return {
      ok: false,
      error: "Une séquence existe déjà pour ce lead",
    };
  }

  const messages = await generateSequenceMessages(lead);

  try {
    const created = await createSequenceTasksForLead(lead, messages);
    if (created !== 4) {
      return { ok: false, error: "Création de séquence incomplète" };
    }
  } catch {
    return { ok: false, error: "Impossible de créer les tâches de séquence" };
  }

  revalidatePath("/pipeline");
  revalidatePath("/messages");
  revalidatePath("/leads");
  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/");

  return { ok: true, companyName: lead.companyName, created: 4 };
}
