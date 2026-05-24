import { Download } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Exports — Maeva Deal Radar Room",
  description: "Exports CSV/JSON de la file et de la shortlist.",
};

export default async function ExportsPage() {
  const { user } = await auth();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-[#1F232B] pb-5">
        <span className="text-[10px] font-mono text-[#9AA0A6] uppercase tracking-widest font-bold">
          MODULE 7
        </span>
        <h1
          id="exports-title"
          className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-1"
        >
          Exports
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1">
          CSV équivalents v1 · Historique des exports
        </p>
      </div>

      <EmptyState
        title="No data yet"
        description="Les exports clean_sequence_queue et shortlist seront disponibles ici. Aucun export généré pour le moment."
        icon={<Download className="w-5 h-5" />}
      />
    </div>
  );
}
