"use client";

import { Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useOptimistic, useState, useTransition } from "react";
import { markTaskDone } from "@/app/(app)/pipeline/_actions/mark-task-done";
import { postponeTask } from "@/app/(app)/pipeline/_actions/postpone-task";
import { TodaySwipeList } from "@/components/pipeline/today-swipe-list";
import { EmptyState } from "@/components/shared/empty-state";
import { ToastBanner, type ToastState } from "@/components/shared/toast-banner";
import { TodayTaskDrawer } from "@/components/today/today-task-drawer";
import type { FixtureTask } from "@/lib/db/queries/tasks";
import { addDaysIso, todayParisIso } from "@/lib/pipeline/dates";

const EXIT_MS = 280;

type HideAction = { type: "hide"; taskId: string };

interface TodayOptimisticState {
  tasks: FixtureTask[];
  hiddenIds: Set<string>;
}

interface TodayFileClientProps {
  initialTasks: FixtureTask[];
  todayLabel: string;
}

export function TodayFileClient({
  initialTasks,
  todayLabel,
}: TodayFileClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [drawerTask, setDrawerTask] = useState<FixtureTask | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [optimisticState, updateOptimistic] = useOptimistic<
    TodayOptimisticState,
    HideAction
  >({ tasks: initialTasks, hiddenIds: new Set() }, (current, action) => {
    if (action.type !== "hide") return current;
    const hiddenIds = new Set(current.hiddenIds);
    hiddenIds.add(action.taskId);
    return { ...current, hiddenIds };
  });

  const activeTasks = optimisticState.tasks.filter(
    (t) => !optimisticState.hiddenIds.has(t.id),
  );
  const displayTasks = optimisticState.tasks.filter(
    (t) => !optimisticState.hiddenIds.has(t.id) || exitingIds.has(t.id),
  );

  const emailTasks = activeTasks.filter((t) => t.channel === "EMAIL");
  const linkedinTasks = activeTasks.filter((t) => t.channel === "LINKEDIN");
  const displayEmail = displayTasks.filter((t) => t.channel === "EMAIL");
  const displayLinkedin = displayTasks.filter((t) => t.channel === "LINKEDIN");
  const total = activeTasks.length;

  const summary =
    total === 0
      ? "Aucune tâche à exécuter aujourd'hui. Bonne journée !"
      : `${total} tâche${total > 1 ? "s" : ""} · ${emailTasks.length} email${emailTasks.length > 1 ? "s" : ""} · ${linkedinTasks.length} LinkedIn`;

  const removeFromView = useCallback(
    (
      task: FixtureTask,
      toastMessage: string,
      action?: () => Promise<{ ok: boolean; error?: string }>,
    ) => {
      if (optimisticState.hiddenIds.has(task.id) || exitingIds.has(task.id)) {
        return;
      }

      startTransition(() => {
        updateOptimistic({ type: "hide", taskId: task.id });
      });
      setExitingIds((prev) => new Set(prev).add(task.id));

      window.setTimeout(async () => {
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });

        if (action) {
          const result = await action();
          if (result.ok) {
            setToast({ variant: "success", message: toastMessage });
            router.refresh();
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate(8);
            }
          } else {
            setToast({
              variant: "error",
              message: result.error ?? "Action impossible",
            });
            router.refresh();
          }
        } else {
          setToast({ variant: "success", message: toastMessage });
          router.refresh();
        }
      }, EXIT_MS);
    },
    [exitingIds, optimisticState.hiddenIds, router, updateOptimistic],
  );

  const handleDone = (task: FixtureTask) => {
    removeFromView(task, `${task.company} — marqué comme fait`, () =>
      markTaskDone({ taskId: task.id }),
    );
  };

  const handlePostpone = (task: FixtureTask) => {
    removeFromView(task, "Reporté à demain", () =>
      postponeTask({
        taskId: task.id,
        newPlannedDate: addDaysIso(todayParisIso(), 1),
        note: "Reporté depuis la file du jour",
      }),
    );
  };

  const handleDrawerUpdate = (
    taskId: string,
    kind: "done" | "postpone" | "cancel",
  ) => {
    const task =
      optimisticState.tasks.find((t) => t.id === taskId) ??
      drawerTask ??
      initialTasks.find((t) => t.id === taskId);
    if (!task) return;

    const messages = {
      done: `${task.company} — marqué comme fait`,
      postpone: "Reporté à demain",
      cancel: `${task.company} — tâche annulée`,
    };

    removeFromView(task, messages[kind]);
  };

  return (
    <>
      <div className="max-w-lg mx-auto space-y-6 animate-fadeIn pb-12">
        <div className="border-b border-[#1F232B] pb-5">
          <span className="text-[10px] font-mono text-[#4ADE80] uppercase tracking-widest font-bold">
            MODE EXÉCUTION MOBILE
          </span>
          <h1
            id="today-title"
            className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-1 capitalize"
          >
            {todayLabel}
          </h1>
          <p className="text-xs text-[#9AA0A6] mt-1">{summary}</p>
        </div>

        {total === 0 && exitingIds.size === 0 ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#4ADE80]/30 bg-[#4ADE80]/5 px-5 py-6 text-center">
              <Target className="w-8 h-8 text-[#4ADE80] mx-auto mb-3" />
              <p className="text-sm font-extrabold text-[#E8EAED]">
                Journée complète 🎯
              </p>
              <p className="text-xs text-[#9AA0A6] mt-1">
                Aucune tâche restante aujourd&apos;hui.
              </p>
            </div>
            <EmptyState
              title="File vide"
              description="Toutes vos tâches sont exécutées pour aujourd'hui. Excellent travail !"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {displayEmail.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5B8DEF]" />
                  <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#5B8DEF] font-bold">
                    EMAIL · {emailTasks.length}
                  </h2>
                </div>
                <TodaySwipeList
                  tasks={displayEmail}
                  exitingIds={exitingIds}
                  onDone={handleDone}
                  onPostpone={handlePostpone}
                  onOpenDetail={setDrawerTask}
                />
              </section>
            )}

            {displayLinkedin.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A66C2]" />
                  <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#0A66C2] font-bold">
                    LINKEDIN · {linkedinTasks.length}
                  </h2>
                </div>
                <TodaySwipeList
                  tasks={displayLinkedin}
                  exitingIds={exitingIds}
                  onDone={handleDone}
                  onPostpone={handlePostpone}
                  onOpenDetail={setDrawerTask}
                />
              </section>
            )}
          </div>
        )}
      </div>

      <TodayTaskDrawer
        task={drawerTask}
        onClose={() => setDrawerTask(null)}
        onTaskUpdated={handleDrawerUpdate}
      />

      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
