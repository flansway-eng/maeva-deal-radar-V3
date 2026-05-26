import type { Metadata } from "next";
import { LeadsShortlist } from "@/components/leads/leads-shortlist";
import { getCompanyAliasesList } from "@/lib/db/queries/governance";
import { getLeadsShortlist, hasPappersKeyConfigured } from "@/lib/db/queries/leads";

export const metadata: Metadata = {
  title: "Leads & Shortlist — Maeva Deal Radar Room",
  description: "Shortlist PE/MA dense avec statut de revue et confidence.",
};

export default async function LeadsPage() {
  const [leads, aliases, hasPappersKey] = await Promise.all([
    getLeadsShortlist(),
    getCompanyAliasesList(),
    hasPappersKeyConfigured(),
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#1F232B] pb-5">
        <span className="text-[10px] font-mono text-[#F5C518] uppercase tracking-widest font-bold">
          MODULE 2
        </span>
        <h1
          id="leads-title"
          className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-1"
        >
          Leads & Shortlist
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1">
          {leads.length} lead{leads.length !== 1 ? "s" : ""} · PE/MA · Revue et
          confidence
        </p>
      </div>

      <LeadsShortlist
        leads={leads}
        aliases={aliases}
        hasPappersKey={hasPappersKey}
      />
    </div>
  );
}
