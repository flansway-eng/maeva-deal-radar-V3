import type { TaskStatus } from "@/lib/db/queries/tasks";

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PLANNED: {
    label: "Planifié",
    bg: "bg-[#9AA0A6]/10",
    text: "text-[#9AA0A6]",
    dot: "bg-[#9AA0A6]",
  },
  DONE: {
    label: "Fait",
    bg: "bg-[#4ADE80]/10",
    text: "text-[#4ADE80]",
    dot: "bg-[#4ADE80]",
  },
  POSTPONED: {
    label: "Reporté",
    bg: "bg-[#FBBF24]/10",
    text: "text-[#FBBF24]",
    dot: "bg-[#FBBF24]",
  },
  CANCELLED: {
    label: "Annulé",
    bg: "bg-[#F87171]/10",
    text: "text-[#F87171]",
    dot: "bg-[#F87171]",
  },
  STOPPED: {
    label: "Arrêté",
    bg: "bg-[#71717A]/10",
    text: "text-[#71717A]",
    dot: "bg-[#71717A]",
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
