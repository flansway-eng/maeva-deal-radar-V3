import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { FixtureSourcingRun } from "@/lib/db/queries/sourcing";

function StatusBadge({ status }: { status: FixtureSourcingRun["status"] }) {
  const styles =
    status === "DONE"
      ? "bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/30"
      : status === "FAILED"
        ? "bg-[#F87171]/10 text-[#F87171] border-[#F87171]/30"
        : "bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/30";

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${styles}`}
    >
      {status}
    </span>
  );
}

interface SourcingRunsTableProps {
  runs: FixtureSourcingRun[];
}

export function SourcingRunsTable({ runs }: SourcingRunsTableProps) {
  return (
    <div className="bg-[#111317] border border-[#1F232B] rounded-xl overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#1F232B] text-[#9AA0A6] font-mono uppercase text-[10px]">
            <th className="text-left px-4 py-3">Date</th>
            <th className="text-left px-4 py-3">Statut</th>
            <th className="text-left px-4 py-3">Résultats</th>
            <th className="text-left px-4 py-3">Queries</th>
            <th className="text-right px-4 py-3">Détail</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr
              key={run.id}
              className="border-b border-[#1F232B]/50 hover:bg-[#0A0B0D] group"
            >
              <td className="px-4 py-3 text-[#E8EAED] font-mono">
                {new Date(run.triggeredAt).toLocaleString("fr-FR")}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={run.status} />
                {run.errorMessage && (
                  <p className="text-[10px] text-[#F87171] mt-1 max-w-[200px] truncate">
                    {run.errorMessage}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-[#E8EAED] font-semibold">
                {run.resultsCount}
              </td>
              <td className="px-4 py-3 text-[#9AA0A6] truncate max-w-xs">
                {run.queries.join(" · ")}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/sourcing/runs/${run.id}`}
                  className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#5B8DEF] hover:text-[#F5C518] transition-colors"
                >
                  Voir
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
