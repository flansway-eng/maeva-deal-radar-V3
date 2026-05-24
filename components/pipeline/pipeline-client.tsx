"use client";

import { Calendar, LayoutGrid, List, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CalendarView } from "@/components/pipeline/calendar-view";
import { KanbanView } from "@/components/pipeline/kanban-view";
import { ListView } from "@/components/pipeline/list-view";
import type {
  FixtureTask,
  TaskStatus,
  TaskTrack,
} from "@/lib/db/queries/tasks";

type ViewMode = "KANBAN" | "LISTE" | "CALENDRIER";

interface PipelineClientProps {
  tasks: FixtureTask[];
}

const STATUS_OPTIONS: { value: TaskStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tous statuts" },
  { value: "PLANNED", label: "Planifié" },
  { value: "DONE", label: "Fait" },
  { value: "POSTPONED", label: "Reporté" },
  { value: "CANCELLED", label: "Annulé" },
  { value: "STOPPED", label: "Arrêté" },
];

const TRACK_OPTIONS: { value: TaskTrack | "ALL"; label: string }[] = [
  { value: "ALL", label: "PE & MA" },
  { value: "PE", label: "PE" },
  { value: "MA", label: "MA" },
];

export function PipelineClient({ tasks }: PipelineClientProps) {
  const [view, setView] = useState<ViewMode>("KANBAN");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [trackFilter, setTrackFilter] = useState<TaskTrack | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (trackFilter !== "ALL" && t.track !== trackFilter) return false;
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (search && !t.company.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [tasks, trackFilter, statusFilter, search]);

  const VIEW_BUTTONS: {
    mode: ViewMode;
    icon: React.ReactNode;
    label: string;
  }[] = [
    {
      mode: "KANBAN",
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      label: "Kanban",
    },
    { mode: "LISTE", icon: <List className="w-3.5 h-3.5" />, label: "Liste" },
    {
      mode: "CALENDRIER",
      icon: <Calendar className="w-3.5 h-3.5" />,
      label: "Calendrier",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-[#111317] border border-[#1F232B] rounded-xl">
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-[#0A0B0D] border border-[#1F232B] rounded-lg p-1 shrink-0">
          {VIEW_BUTTONS.map(({ mode, icon, label }) => (
            <button
              key={mode}
              id={`pipeline-view-${mode.toLowerCase()}-btn`}
              type="button"
              onClick={() => setView(mode)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                view === mode
                  ? "bg-[#1F232B] text-[#E8EAED]"
                  : "text-[#9AA0A6] hover:text-[#E8EAED]"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-wrap items-center gap-2">
          {/* Track filter */}
          <select
            id="pipeline-track-filter"
            value={trackFilter}
            onChange={(e) =>
              setTrackFilter(e.target.value as TaskTrack | "ALL")
            }
            className="px-2.5 py-1.5 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs font-mono text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF] cursor-pointer"
          >
            {TRACK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            id="pipeline-status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TaskStatus | "ALL")
            }
            className="px-2.5 py-1.5 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs font-mono text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF] cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9AA0A6] pointer-events-none" />
            <input
              id="pipeline-search-input"
              type="text"
              placeholder="Rechercher par société..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs font-mono text-[#E8EAED] placeholder-[#9AA0A6]/40 focus:outline-none focus:border-[#5B8DEF] transition-all"
            />
            {search && (
              <button
                id="pipeline-search-clear-btn"
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9AA0A6] hover:text-[#E8EAED] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Result count */}
        <span className="text-xs font-mono text-[#9AA0A6] shrink-0">
          {filteredTasks.length} résultat{filteredTasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Active view */}
      {view === "KANBAN" && <KanbanView tasks={filteredTasks} />}
      {view === "LISTE" && <ListView tasks={filteredTasks} />}
      {view === "CALENDRIER" && <CalendarView tasks={filteredTasks} />}
    </div>
  );
}
