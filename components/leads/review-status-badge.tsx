import type { LeadReviewStatus } from "@/lib/db/queries/governance-fixture";

const CONFIG: Record<LeadReviewStatus, { label: string; className: string }> = {
  PENDING: {
    label: "En attente",
    className: "bg-[#9AA0A6]/15 text-[#9AA0A6] border-[#9AA0A6]/30",
  },
  KEEP: {
    label: "Conservé",
    className: "bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30",
  },
  STOP: {
    label: "Arrêté",
    className: "bg-[#F87171]/15 text-[#F87171] border-[#F87171]/30",
  },
  CORRECT: {
    label: "Corrigé",
    className: "bg-[#5B8DEF]/15 text-[#5B8DEF] border-[#5B8DEF]/30",
  },
};

export function ReviewStatusBadge({ status }: { status: LeadReviewStatus }) {
  const cfg = CONFIG[status];
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
