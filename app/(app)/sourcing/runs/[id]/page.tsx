import { ArrowLeft, Globe } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { auth } from "@/lib/auth";
import {
  getDiscoveriesForRun,
  getSourcingRunById,
} from "@/lib/db/queries/sourcing";

export const metadata: Metadata = {
  title: "Détail run sourcing — Maeva Deal Radar Room",
};

interface RunDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SourcingRunDetailPage({
  params,
}: RunDetailPageProps) {
  const { user } = await auth();
  if (!user) redirect("/login");

  const { id } = await params;
  const run = await getSourcingRunById(id);
  if (!run) notFound();

  const discoveries = await getDiscoveriesForRun(id);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#1F232B] pb-5">
        <Link
          href="/sourcing"
          className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#5B8DEF] hover:text-[#F5C518] mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au sourcing
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#E8EAED]">
          Run · {new Date(run.triggeredAt).toLocaleString("fr-FR")}
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1 font-mono">
          {run.status} · {run.resultsCount} résultat
          {run.resultsCount !== 1 ? "s" : ""}
        </p>
        {run.errorMessage && (
          <p className="text-xs text-[#F87171] mt-2">{run.errorMessage}</p>
        )}
      </div>

      {discoveries.length === 0 ? (
        <EmptyState
          title="No data yet"
          description="Aucune découverte web pour ce run."
          icon={<Globe className="w-5 h-5" />}
        />
      ) : (
        <div className="bg-[#111317] border border-[#1F232B] rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1F232B] text-[#9AA0A6] font-mono uppercase text-[10px]">
                <th className="text-left px-4 py-3">Titre</th>
                <th className="text-left px-4 py-3">Domaine</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {discoveries.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-[#1F232B]/50 hover:bg-[#0A0B0D]"
                >
                  <td className="px-4 py-2.5">
                    <a
                      href={d.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#E8EAED] hover:text-[#5B8DEF]"
                    >
                      {d.sourceTitle}
                    </a>
                    {d.snippet && (
                      <p className="text-[10px] text-[#9AA0A6] mt-0.5 line-clamp-2">
                        {d.snippet}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#9AA0A6]">
                    {d.domain}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[10px]">
                    {d.pageType}
                  </td>
                  <td className="px-4 py-2.5 font-mono">{d.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
