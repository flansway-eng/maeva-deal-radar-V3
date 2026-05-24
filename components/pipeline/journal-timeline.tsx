"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  PauseCircle,
  RefreshCw,
  ShieldCheck,
  Wand2,
  XCircle,
} from "lucide-react";
import type { JournalEvent } from "@/lib/db/queries/tasks";

const EVENT_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  TASK_DONE: {
    label: "Tâche exécutée",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: "text-[#4ADE80]",
  },
  TASK_POSTPONED: {
    label: "Tâche reportée",
    icon: <PauseCircle className="w-3.5 h-3.5" />,
    color: "text-[#FBBF24]",
  },
  TASK_CANCELLED: {
    label: "Tâche annulée",
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: "text-[#F87171]",
  },
  SEQUENCE_STOPPED: {
    label: "Séquence arrêtée",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: "text-[#71717A]",
  },
  COMPANY_CORRECTED: {
    label: "Société corrigée",
    icon: <Wand2 className="w-3.5 h-3.5" />,
    color: "text-[#5B8DEF]",
  },
  COMPANY_NORMALIZED: {
    label: "Normalisation auto",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    color: "text-[#5B8DEF]",
  },
  MESSAGES_REGENERATED: {
    label: "Messages régénérés",
    icon: <Wand2 className="w-3.5 h-3.5" />,
    color: "text-[#9AA0A6]",
  },
  REVIEW_DECISION_APPLIED: {
    label: "Décision appliquée",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    color: "text-[#F5C518]",
  },
  CALENDAR_IMPORTED: {
    label: "Calendrier importé",
    icon: <Calendar className="w-3.5 h-3.5" />,
    color: "text-[#9AA0A6]",
  },
  AI_DAILY_BRIEF_GENERATED: {
    label: "Brief IA généré",
    icon: <Clock className="w-3.5 h-3.5" />,
    color: "text-[#F5C518]",
  },
  SOURCING_RUN_COMPLETED: {
    label: "Run sourcing terminé",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    color: "text-[#5B8DEF]",
  },
};

function getConfig(eventType: string) {
  return (
    EVENT_CONFIG[eventType] ?? {
      label: eventType,
      icon: <Clock className="w-3.5 h-3.5" />,
      color: "text-[#9AA0A6]",
    }
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";

  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

interface JournalTimelineProps {
  events: JournalEvent[];
}

export function JournalTimeline({ events }: JournalTimelineProps) {
  // Group by day
  const groups: { dateLabel: string; events: JournalEvent[] }[] = [];
  let currentLabel = "";

  for (const event of events) {
    const label = formatDateGroup(event.occurredAt);
    if (label !== currentLabel) {
      groups.push({ dateLabel: label, events: [] });
      currentLabel = label;
    }
    const lastGroup = groups[groups.length - 1];
    if (lastGroup) lastGroup.events.push(event);
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.dateLabel}>
          {/* Date group header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono font-bold text-[#E8EAED] uppercase tracking-widest">
              {group.dateLabel}
            </span>
            <div className="flex-1 h-px bg-[#1F232B]" />
            <span className="text-[10px] font-mono text-[#9AA0A6]">
              {group.events.length} event{group.events.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Events */}
          <div className="relative pl-6 space-y-1">
            {/* Vertical timeline line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-[#1F232B]" />

            {group.events.map((event) => {
              const cfg = getConfig(event.eventType);
              return (
                <div
                  key={event.id}
                  className="relative flex items-start gap-4 py-2.5 px-3 rounded-lg hover:bg-[#111317] transition-colors group"
                >
                  {/* Node dot */}
                  <div
                    className={`absolute left-[-15px] top-[13px] w-5 h-5 rounded-full flex items-center justify-center bg-[#0A0B0D] border border-[#1F232B] ${cfg.color}`}
                  >
                    {cfg.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        {event.company && (
                          <span className="text-xs text-[#E8EAED] font-bold truncate">
                            · {event.company}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#9AA0A6] shrink-0">
                        {formatTime(event.occurredAt)}
                      </span>
                    </div>
                    {event.note && (
                      <p className="mt-0.5 text-[11px] text-[#9AA0A6] italic">
                        {event.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
