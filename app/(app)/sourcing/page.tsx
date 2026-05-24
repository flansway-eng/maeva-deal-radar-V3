import { Search } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { LaunchRunDialog } from "@/components/sourcing/launch-run-dialog";
import { SourcingRunsTable } from "@/components/sourcing/sourcing-runs-table";
import { auth } from "@/lib/auth";
import { getSourcingRuns } from "@/lib/db/queries/sourcing";

export const metadata: Metadata = {
  title: "Sourcing Web — Maeva Deal Radar Room",
  description: "Runs Tavily et découvertes web PE/MA Île-de-France.",
};

export default async function SourcingPage() {
  const { user } = await auth();
  if (!user) redirect("/login");

  const runs = await getSourcingRuns();
  const hasTavilyKey = Boolean(process.env.TAVILY_API_KEY?.trim());
  const hasPappersKey = Boolean(process.env.PAPPERS_API_KEY?.trim());

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1F232B] pb-5">
        <div>
          <span className="text-[10px] font-mono text-[#5B8DEF] uppercase tracking-widest font-bold">
            MODULE 1
          </span>
          <h1
            id="sourcing-title"
            className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-1"
          >
            Sourcing Web
          </h1>
          <p className="text-xs text-[#9AA0A6] mt-1">
            {runs.length} run{runs.length !== 1 ? "s" : ""} · Tavily · BODACC · RSS · Signal Feed
          </p>
        </div>
        <LaunchRunDialog
          hasTavilyKey={hasTavilyKey}
          hasPappersKey={hasPappersKey}
        />
      </div>

      {runs.length === 0 ? (
        <EmptyState
          title="No data yet"
          description="Aucun run pour le moment. Lancez un run multi-sources (Tavily, BODACC, RSS, Pappers) depuis le bouton ci-dessus."
          icon={<Search className="w-5 h-5" />}
        />
      ) : (
        <SourcingRunsTable runs={runs} />
      )}
    </div>
  );
}
