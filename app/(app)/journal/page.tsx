import { History } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JournalLive } from "@/components/pipeline/journal-live";
import { EmptyState } from "@/components/shared/empty-state";
import { auth } from "@/lib/auth";
import { getRecentEvents } from "@/lib/db/queries/tasks";

export const metadata: Metadata = {
  title: "Journal — Maeva Deal Radar Room",
  description: "Audit trail complet de toutes les actions sur votre pipeline.",
};

export default async function JournalPage() {
  const { user } = await auth();
  if (!user) redirect("/login");

  const events = await getRecentEvents(200);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#1F232B] pb-5">
        <span className="text-[10px] font-mono text-[#9AA0A6] uppercase tracking-widest font-bold">
          MODULE 6
        </span>
        <h1
          id="journal-title"
          className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-1"
        >
          Journal d'Activité
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1">
          {events.length} événement{events.length !== 1 ? "s" : ""} · Audit
          trail complet · Traçabilité totale
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="Journal vide"
          description="Aucun événement enregistré. Les actions de pipeline apparaissent ici en temps réel."
          icon={<History className="w-5 h-5" />}
        />
      ) : (
        <div className="bg-[#111317] border border-[#1F232B] rounded-xl p-6">
          <JournalLive initialEvents={events} />
        </div>
      )}
    </div>
  );
}
