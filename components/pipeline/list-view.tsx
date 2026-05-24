"use client";

import { ArrowUpDown, List } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { StepLabel } from "@/components/shared/step-label";
import { TrackBadge } from "@/components/shared/track-badge";
import type { FixtureTask } from "@/lib/db/queries/tasks";
import { TaskActionMenu } from "./task-action-menu";

type SortKey = "company" | "plannedDate" | "status" | "track";
type SortDir = "asc" | "desc";

interface ListViewProps {
  tasks: FixtureTask[];
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export function ListView({ tasks }: ListViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("plannedDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "company") cmp = a.company.localeCompare(b.company);
    else if (sortKey === "plannedDate")
      cmp = a.plannedDate.localeCompare(b.plannedDate);
    else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
    else if (sortKey === "track") cmp = a.track.localeCompare(b.track);
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Aucune tâche"
        description="Modifiez les filtres ou lancez un sourcing."
        icon={<List className="w-5 h-5" />}
      />
    );
  }

  function SortBtn({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <button
        type="button"
        onClick={() => handleSort(col)}
        className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
          active ? "text-[#E8EAED]" : "text-[#9AA0A6] hover:text-[#E8EAED]"
        }`}
      >
        {label}
        <ArrowUpDown className={`w-3 h-3 ${active ? "text-[#F5C518]" : ""}`} />
      </button>
    );
  }

  return (
    <div className="bg-[#111317] border border-[#1F232B] rounded-xl overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-0 border-b border-[#1F232B] px-4 py-2.5 bg-[#0A0B0D]">
        <SortBtn col="company" label="Société / Contact" />
        <SortBtn col="track" label="Track" />
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#9AA0A6]">
          Étape
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#9AA0A6]">
          Canal
        </div>
        <SortBtn col="plannedDate" label="Date" />
        <SortBtn col="status" label="Statut" />
        <div className="w-8" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#1F232B]">
        {sorted.map((task) => {
          const isOverdue =
            task.status === "PLANNED" &&
            // biome-ignore lint/style/noNonNullAssertion: ISO split always produces non-null [0]
            task.plannedDate < new Date().toISOString().split("T")[0]!;

          return (
            <div
              key={task.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-0 px-4 py-2.5 hover:bg-[#16191F] transition-colors group"
            >
              {/* Company + Contact */}
              <div className="min-w-0 pr-3">
                <p className="text-xs font-semibold text-[#E8EAED] truncate">
                  {task.company}
                </p>
                {task.contactName && (
                  <p className="text-[10px] text-[#9AA0A6] truncate">
                    {task.contactName}
                    {task.title ? ` · ${task.title}` : ""}
                  </p>
                )}
              </div>
              {/* Track */}
              <div className="flex items-center">
                <TrackBadge track={task.track} size="sm" />
              </div>
              {/* Step */}
              <div className="flex items-center">
                <StepLabel
                  stepCode={task.stepCode}
                  channel={task.channel}
                  showIcon={false}
                />
              </div>
              {/* Channel */}
              <div className="flex items-center">
                <StepLabel stepCode={task.stepCode} channel={task.channel} />
              </div>
              {/* Date */}
              <div className="flex items-center">
                <span
                  className={`text-[10px] font-mono ${
                    isOverdue ? "text-[#F87171]" : "text-[#9AA0A6]"
                  }`}
                >
                  {isOverdue ? "⚠ " : ""}
                  {formatDate(task.plannedDate)}
                </span>
              </div>
              {/* Status */}
              <div className="flex items-center">
                <StatusBadge status={task.status} size="sm" />
              </div>
              <div className="flex items-center pl-2">
                <TaskActionMenu task={task} compact />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
