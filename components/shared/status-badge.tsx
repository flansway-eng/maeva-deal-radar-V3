import type { TaskStatus } from "@/lib/db/queries/tasks";

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PLANNED: {
    label: "Planifié",
    bg: "bg-[#8899AE]/10",
    text: "text-[#8899AE]",
    dot: "bg-[#8899AE]",
  },
  DONE: {
    label: "Fait",
    bg: "bg-[#4ADE80]/10",
    text: "text-[#4ADE80]",
    dot: "bg-[#4ADE80]",
  },
  POSTPONED: {
    label: "Reporté",
    bg: "bg-[#C4974C]/10",
    text: "text-[#C4974C]",
    dot: "bg-[#C4974C]",
  },
  CANCELLED: {
    label: "Annulé",
    bg: "bg-[#E07070]/10",
    text: "text-[#E07070]",
    dot: "bg-[#E07070]",
  },
  STOPPED: {
    label: "Arrêté",
    bg: "bg-[#4E6070]/10",
    text: "text-[#4E6070]",
    dot: "bg-[#4E6070]",
  },
};

interface StatusBadgeProps {
  status: TaskStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const textSize = size === "sm" ? "text-[9px]" : "text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${textSize} ${cfg.bg} ${cfg.text} border border-current/20`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
