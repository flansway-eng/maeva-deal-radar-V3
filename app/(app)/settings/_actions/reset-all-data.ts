"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { resetAllDataMutation } from "@/lib/settings/reset-all-data";

const schema = z.object({
  confirmation: z.literal("RESET"),
});

export async function resetAllData(
  input: z.infer<typeof schema>,
): Promise<{ ok: false; error: string } | never> {
  const { user } = await auth();
  if (!user) redirect("/login");

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Saisissez RESET pour confirmer la réinitialisation.",
    };
  }

  const result = await resetAllDataMutation();
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  redirect("/?reset=success");
}
