import type { Metadata } from "next";
import { GovernanceHub } from "@/components/governance/governance-hub";
import { getPendingReviewQueue } from "@/lib/db/queries/governance";

export const metadata: Metadata = {
  title: "Gouvernance — Maeva Deal Radar Room",
  description: "Review queue, normalisation et audit qualité.",
};

export default async function GovernancePage() {
  const pending = await getPendingReviewQueue();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#1F232B] pb-5">
        <span className="text-[10px] font-mono text-[#F5C518] uppercase tracking-widest font-bold">
          MODULE 5
        </span>
        <h1
          id="governance-title"
          className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-1"
        >
          Gouvernance
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1">
          {pending.length} décision{pending.length !== 1 ? "s" : ""} en attente
          · Normalisation · Audit qualité
        </p>
      </div>

      <GovernanceHub />
    </div>
  );
}
