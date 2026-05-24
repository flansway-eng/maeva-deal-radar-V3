"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";

const schema = z.object({ leadId: z.string().min(1) });

export async function generateMessagesForLead(
  input: z.infer<typeof schema>,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const { user } = await auth();
  if (!user) return { ok: false, error: "Non authentifié" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Lead invalide" };

  return {
    ok: true,
    message:
      "Génération de messages pour ce lead — bientôt disponible. Utilisez /messages en attendant.",
  };
}
