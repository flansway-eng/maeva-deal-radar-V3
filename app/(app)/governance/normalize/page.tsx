import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NormalizeClient } from "@/components/governance/normalize-client";
import { auth } from "@/lib/auth";
import { getCompanyAliasesList } from "@/lib/db/queries/governance";

export const metadata: Metadata = {
  title: "Normalize — Gouvernance",
};

export default async function NormalizePage() {
  const { user } = await auth();
  if (!user) redirect("/login");

  const aliases = await getCompanyAliasesList();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#1F232B] pb-5">
        <Link
          href="/governance"
          className="text-[10px] font-mono text-[#5B8DEF] hover:underline"
        >
          ← Gouvernance
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-2">
          Normalize
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1">
          {aliases.length} alias domaine → nom canonique
        </p>
      </div>

      <NormalizeClient aliases={aliases} />
    </div>
  );
}
