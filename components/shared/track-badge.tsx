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
          ? "bg-[#C4974C]/10 text-[#C4974C] border border-[#C4974C]/25"
          : "bg-[#4472AA]/10 text-[#4472AA] border border-[#4472AA]/25"
      }`}
    >
      {track}
    </span>
  );
}
