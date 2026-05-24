export function ConfidenceBar({ score }: { score: number | null }) {
  if (score === null || Number.isNaN(score)) {
    return <span className="font-mono text-[#9AA0A6]">—</span>;
  }

  const pct = Math.round(score * 100);
  const color =
    score < 0.5
      ? "bg-[#F87171]"
      : score < 0.75
        ? "bg-[#FBBF24]"
        : "bg-[#4ADE80]";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden border border-[#1F232B]">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[10px] text-[#E8EAED] w-8 text-right">
        {score.toFixed(2)}
      </span>
    </div>
  );
}
