export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="border-b border-[#1F232B] pb-5 space-y-2">
        <div className="h-3 w-24 bg-[#16191F] rounded" />
        <div className="h-8 w-64 bg-[#16191F] rounded" />
        <div className="h-3 w-48 bg-[#16191F] rounded" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-14 bg-[#111317] border border-[#1F232B] rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}
