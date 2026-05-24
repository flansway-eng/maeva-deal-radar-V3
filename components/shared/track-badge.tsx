import type { TaskTrack } from "@/lib/db/queries/tasks";

interface TrackBadgeProps {
  track: TaskTrack;
  size?: "sm" | "md";
}

export function TrackBadge({ track, size = "md" }: TrackBadgeProps) {
  const textSize = size === "sm" ? "text-[8px]" : "text-[9px]";
  const isPE = track === "PE";

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-widest ${textSize} ${
        isPE
          ? "bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/20"
          : "bg-[#5B8DEF]/10 text-[#5B8DEF] border border-[#5B8DEF]/20"
      }`}
    >
      {track}
    </span>
  );
}
