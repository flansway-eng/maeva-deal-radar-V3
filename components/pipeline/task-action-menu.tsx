"use client";

import {
  Ban,
  CalendarClock,
  CheckCircle2,
  MoreHorizontal,
  Octagon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelTask } from "@/app/(app)/pipeline/_actions/cancel-task";
import { markTaskDone } from "@/app/(app)/pipeline/_actions/mark-task-done";
import { postponeTask } from "@/app/(app)/pipeline/_actions/postpone-task";
import { stopCompany } from "@/app/(app)/pipeline/_actions/stop-company";
import type { FixtureTask } from "@/lib/db/queries/tasks";
import { addDaysIso, todayParisIso } from "@/lib/pipeline/dates";

type DialogKind = "done" | "postpone" | "cancel" | "stop" | null;

interface TaskActionMenuProps {
  task: FixtureTask;
  compact?: boolean;
}

export function TaskActionMenu({ task, compact }: TaskActionMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [postponeDate, setPostponeDate] = useState(
    addDaysIso(todayParisIso(), 1),
  );
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      setDialog(null);
      setOpen(false);
      setNote("");
      setReason("");
      router.refresh();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(8);
      }
    });
  };

  const closeDialog = () => {
    setDialog(null);
    setError(null);
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          id={`task-menu-${task.id}`}
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className={`inline-flex items-center justify-center rounded-md border border-[#1F232B] bg-[#0A0B0D] text-[#9AA0A6] hover:text-[#E8EAED] hover:border-[#2A2F3A] transition-colors cursor-pointer disabled:opacity-50 ${
            compact ? "w-7 h-7" : "w-8 h-8"
          }`}
          aria-label="Actions sur la tâche"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] py-1 bg-[#16191F] border border-[#1F232B] rounded-lg shadow-xl">
              <MenuBtn
                icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />}
                label="Marquer fait"
                onClick={() => {
                  setOpen(false);
                  setDialog("done");
                }}
              />
              <MenuBtn
                icon={<CalendarClock className="w-3.5 h-3.5 text-[#FBBF24]" />}
                label="Reporter"
                onClick={() => {
                  setOpen(false);
                  setPostponeDate(addDaysIso(task.plannedDate, 1));
                  setDialog("postpone");
                }}
              />
              <MenuBtn
                icon={<Ban className="w-3.5 h-3.5 text-[#F87171]" />}
                label="Annuler"
                onClick={() => {
                  setOpen(false);
                  setDialog("cancel");
                }}
              />
              <MenuBtn
                icon={<Octagon className="w-3.5 h-3.5 text-[#71717A]" />}
                label="Stopper la séquence"
                onClick={() => {
                  setOpen(false);
                  setDialog("stop");
                }}
              />
            </div>
          </>
        )}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-[#111317] border border-[#1F232B] rounded-xl p-5 space-y-4 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-[#E8EAED]">
              {dialog === "done" && `Marquer fait — ${task.company}`}
              {dialog === "postpone" && `Reporter — ${task.company}`}
              {dialog === "cancel" && `Annuler — ${task.company}`}
              {dialog === "stop" && `Stopper la séquence — ${task.company}`}
            </h3>

            {dialog === "done" && (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note d'exécution (optionnel)"
                rows={3}
                className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs text-[#E8EAED] placeholder-[#9AA0A6]/50 focus:outline-none focus:border-[#5B8DEF] resize-none"
              />
            )}

            {dialog === "postpone" && (
              <>
                <label
                  htmlFor="postpone-date-input"
                  className="block text-[10px] font-mono text-[#9AA0A6] uppercase tracking-widest"
                >
                  Nouvelle date
                </label>
                <input
                  id="postpone-date-input"
                  type="date"
                  value={postponeDate}
                  onChange={(e) => setPostponeDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs font-mono text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF]"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Motif du report (optionnel)"
                  rows={2}
                  className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs text-[#E8EAED] placeholder-[#9AA0A6]/50 focus:outline-none focus:border-[#5B8DEF] resize-none"
                />
              </>
            )}

            {(dialog === "cancel" || dialog === "stop") && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Raison (obligatoire)"
                rows={3}
                className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs text-[#E8EAED] placeholder-[#9AA0A6]/50 focus:outline-none focus:border-[#5B8DEF] resize-none"
              />
            )}

            {error && (
              <p className="text-xs text-[#F87171] font-mono">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDialog}
                className="px-3 py-1.5 text-xs font-semibold text-[#9AA0A6] hover:text-[#E8EAED] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={
                  pending ||
                  (dialog !== "done" && dialog !== "postpone" && !reason.trim())
                }
                onClick={() => {
                  if (dialog === "done") {
                    run(() =>
                      markTaskDone({
                        taskId: task.id,
                        note: note.trim() || undefined,
                      }),
                    );
                  } else if (dialog === "postpone") {
                    run(() =>
                      postponeTask({
                        taskId: task.id,
                        newPlannedDate: postponeDate,
                        note: note.trim() || undefined,
                      }),
                    );
                  } else if (dialog === "cancel") {
                    run(() =>
                      cancelTask({ taskId: task.id, reason: reason.trim() }),
                    );
                  } else if (dialog === "stop") {
                    run(() =>
                      stopCompany({
                        company: task.company,
                        reason: reason.trim(),
                      }),
                    );
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold bg-[#5B8DEF] text-[#0A0B0D] rounded-lg hover:bg-[#5B8DEF]/90 disabled:opacity-50 cursor-pointer"
              >
                {pending ? "En cours…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E8EAED] hover:bg-[#1F232B] transition-colors cursor-pointer text-left"
    >
      {icon}
      {label}
    </button>
  );
}
