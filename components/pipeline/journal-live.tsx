"use client";

import { JournalTimeline } from "@/components/pipeline/journal-timeline";
import type { JournalEvent } from "@/lib/db/queries/tasks";

interface JournalLiveProps {
  initialEvents: JournalEvent[];
}

export function JournalLive({ initialEvents }: JournalLiveProps) {
  return <JournalTimeline events={initialEvents} />;
}
