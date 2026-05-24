"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JournalTimeline } from "@/components/pipeline/journal-timeline";
import { createClient } from "@/lib/auth/client";
import type { JournalEvent } from "@/lib/db/queries/tasks";

interface JournalLiveProps {
  initialEvents: JournalEvent[];
}

export function JournalLive({ initialEvents }: JournalLiveProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [live, setLive] = useState(false);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;

    const supabase = createClient();
    const channel = supabase
      .channel("sequence_events_journal")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sequence_events" },
        () => {
          setLive(true);
          router.refresh();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setLive(true);
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div className="space-y-3">
      {live && (
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#4ADE80]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
          Temps réel actif
        </div>
      )}
      <JournalTimeline events={events} />
    </div>
  );
}
