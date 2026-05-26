import type { JournalEvent } from "@/lib/db/queries/tasks";

const DOT_COLORS: Record<string, string> = {
  TASK_DONE: "bg-[#4ADE80]",
  REVIEW_DECISION_APPLIED: "bg-[#C4974C]",
  COMPANY_NORMALIZED: "bg-[#4472AA]",
  AI_DAILY_BRIEF_GENERATED: "bg-[#C4974C]",
  SEQUENCE_STOPPED: "bg-[#E07070]",
};

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `Il y a ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  return "Hier";
}

function describeEvent(event: JournalEvent): string {
  const company = event.company ? ` pour ${event.company}` : "";
  switch (event.eventType) {
    case "TASK_DONE":
      return `Tâche marquée comme DONE${company}.`;
    case "TASK_POSTPONED":
      return `Tâche reportée${company}.`;
    case "REVIEW_DECISION_APPLIED":
      return `Décision de gouvernance appliquée${company}.`;
    case "COMPANY_NORMALIZED":
      return "Normalisation automatique effectuée.";
    case "AI_DAILY_BRIEF_GENERATED":
      return "Daily Brief IA généré.";
    case "MESSAGES_REGENERATED":
      return "Messages régénérés en lot.";
    default:
      return event.note ?? event.eventType;
  }
}

interface DashboardActivityProps {
  events: JournalEvent[];
}

export function DashboardActivity({ events }: DashboardActivityProps) {
  const slice = events.slice(0, 6);

  return (
    <div className="bg-[#0C1A2E] border border-[#1A3050] rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#1A3050] pb-4 mb-4">
        <h2 className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#EDE8DC] uppercase">
          JOURNAL D'ACTIVITÉ RÉCENTE
        </h2>
        <span className="text-[8px] font-mono text-[#8899AE] uppercase bg-[#07101E] border border-[#1A3050] px-2 py-0.5 rounded tracking-wider">
          LATEST EVENTS
        </span>
      </div>

      <div className="space-y-4">
        {slice.length === 0 && (
          <p className="text-[11px] font-mono text-[#8899AE]">Aucun événement récent.</p>
        )}
        {slice.map((event) => (
          <div key={event.id} className="flex items-start gap-3">
            <div
              className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                DOT_COLORS[event.eventType] ?? "bg-[#8899AE]"
              }`}
            />
            <div>
              <p className="text-[11px] text-[#EDE8DC] leading-relaxed">{describeEvent(event)}</p>
              <span className="text-[9px] font-mono text-[#8899AE] tracking-wide">
                {formatRelative(event.occurredAt)} · Système
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
