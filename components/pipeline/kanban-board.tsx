"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { moveTaskStatus } from "@/app/(app)/pipeline/_actions/move-task-status";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { StepLabel } from "@/components/shared/step-label";
import { TrackBadge } from "@/components/shared/track-badge";
import type { FixtureTask, TaskStatus } from "@/lib/db/queries/tasks";
import { TaskActionMenu } from "./task-action-menu";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "PLANNED", label: "Planifié" },
  { status: "DONE", label: "Fait" },
  { status: "POSTPONED", label: "Reporté" },
  { status: "CANCELLED", label: "Annulé" },
  { status: "STOPPED", label: "Arrêté" },
];

interface KanbanBoardProps {
  tasks: FixtureTask[];
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const byStatus = useMemo(
    () =>
      Object.fromEntries(
        COLUMNS.map((col) => [
          col.status,
          tasks.filter((t) => t.status === col.status),
        ]),
      ) as Record<TaskStatus, FixtureTask[]>,
    [tasks],
  );

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId)
    : undefined;

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Aucune tâche"
        description="Modifiez les filtres ou lancez un run de sourcing pour alimenter votre pipeline."
        icon={<LayoutGrid className="w-5 h-5" />}
      />
    );
  }

  const resolveTargetStatus = (overId: string): TaskStatus | null => {
    if (COLUMNS.some((c) => c.status === overId)) {
      return overId as TaskStatus;
    }
    return tasks.find((t) => t.id === overId)?.status ?? null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const newStatus = resolveTargetStatus(String(over.id));
    if (!newStatus) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    startTransition(async () => {
      await moveTaskStatus({ taskId, newStatus });
      router.refresh();
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div
        className={`flex gap-4 overflow-x-auto pb-4 ${pending ? "opacity-70 pointer-events-none" : ""}`}
      >
        {COLUMNS.map(({ status }) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={byStatus[status] ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  tasks,
}: {
  status: TaskStatus;
  tasks: FixtureTask[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 w-72 flex flex-col gap-2 rounded-lg transition-colors ${
        isOver ? "ring-1 ring-[#5B8DEF]/40" : ""
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-[#111317] border border-[#1F232B] rounded-lg">
        <StatusBadge status={status} size="sm" />
        <span className="text-[10px] font-mono text-[#9AA0A6] bg-[#0A0B0D] border border-[#1F232B] rounded px-1.5 py-0.5">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 min-h-[80px]">
          {tasks.length === 0 ? (
            <div className="py-6 text-center text-[10px] font-mono text-[#9AA0A6]/40">
              Déposer ici
            </div>
          ) : (
            tasks.map((task) => (
              <SortableKanbanCard key={task.id} task={task} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableKanbanCard({ task }: { task: FixtureTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard task={task} isDragging={isDragging} />
    </div>
  );
}

function KanbanCard({
  task,
  isDragging,
}: {
  task: FixtureTask;
  isDragging?: boolean;
}) {
  const todayIso = new Date().toISOString().split("T")[0] ?? "";
  const isOverdue =
    task.status === "PLANNED" && todayIso !== "" && task.plannedDate < todayIso;

  return (
    <div
      className={`group bg-[#111317] border rounded-xl p-4 space-y-3 transition-all ${
        isDragging
          ? "opacity-90 shadow-lg border-[#5B8DEF]/40 scale-[1.02]"
          : "hover:border-[#2A2F3A] hover:-translate-y-0.5"
      } ${isOverdue ? "border-[#F87171]/30" : "border-[#1F232B]"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#E8EAED] truncate">
            {task.company}
          </p>
          {task.contactName && (
            <p className="text-[10px] text-[#9AA0A6] truncate mt-0.5">
              {task.contactName}
              {task.title ? ` · ${task.title}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <TrackBadge track={task.track} size="sm" />
          <TaskActionMenu task={task} compact />
        </div>
      </div>

      <StepLabel stepCode={task.stepCode} channel={task.channel} />

      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-mono ${
            isOverdue ? "text-[#F87171]" : "text-[#9AA0A6]"
          }`}
        >
          {isOverdue ? "⚠ " : ""}
          {formatDate(task.plannedDate)}
        </span>
        {task.executionNote && (
          <span className="text-[10px] text-[#9AA0A6] italic truncate max-w-[100px]">
            {task.executionNote}
          </span>
        )}
      </div>
    </div>
  );
}
