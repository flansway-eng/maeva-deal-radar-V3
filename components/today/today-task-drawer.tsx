"use client";

import { X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { cancelTask } from "@/app/(app)/pipeline/_actions/cancel-task";
import { markTaskDone } from "@/app/(app)/pipeline/_actions/mark-task-done";
import { postponeTask } from "@/app/(app)/pipeline/_actions/postpone-task";
import { StepLabel } from "@/components/shared/step-label";
import { TrackBadge } from "@/components/shared/track-badge";
import type { FixtureTask } from "@/lib/db/queries/tasks";
import { addDaysIso, todayParisIso } from "@/lib/pipeline/dates";
import { buildGmailComposeUrl } from "@/lib/today/mailto";

interface TodayTaskDrawerProps {
  task: FixtureTask | null;
  onClose: () => void;
  onTaskUpdated: (taskId: string, kind: "done" | "postpone" | "cancel") => void;
}

export function TodayTaskDrawer({
  task,
  onClose,
  onTaskUpdated,
}: TodayTaskDrawerProps) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [postponeDate, setPostponeDate] = useState(
    addDaysIso(todayParisIso(), 1),
  );
  const [cancelReason, setCancelReason] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!task) return;
    setNote("");
    setPostponeDate(addDaysIso(todayParisIso(), 1));
    setCancelReason("");
    setCopied(null);
  }, [task?.id, task]);

  if (!task) return null;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("Erreur copie");
    }
  };

  const run = (
    fn: () => Promise<{ ok: boolean; error?: string }>,
    kind: "done" | "postpone" | "cancel",
  ) => {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        onTaskUpdated(task.id, kind);
        onClose();
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[80] bg-black/50 cursor-default"
        aria-label="Fermer"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed top-0 right-0 bottom-0 z-[90] w-full max-w-md bg-[#111317] border-l border-[#1F232B] shadow-2xl flex flex-col animate-fadeIn"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F232B]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-extrabold text-[#E8EAED]">
                {task.company}
              </h2>
              <TrackBadge track={task.track} size="sm" />
            </div>
            <StepLabel stepCode={task.stepCode} channel={task.channel} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9AA0A6] hover:text-[#E8EAED] cursor-pointer"
            aria-label="Fermer le détail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {task.messageSubject && (
            <section>
              <span className="text-[10px] font-mono text-[#9AA0A6] uppercase">
                Objet
              </span>
              <p className="mt-1 text-sm text-[#E8EAED] font-mono leading-relaxed">
                {task.messageSubject}
              </p>
            </section>
          )}

          <section>
            <span className="text-[10px] font-mono text-[#9AA0A6] uppercase">
              Message
            </span>
            <pre className="mt-1 text-xs text-[#E8EAED] whitespace-pre-wrap font-sans leading-relaxed bg-[#0A0B0D] border border-[#1F232B] rounded-lg p-3">
              {task.messageBody ?? "Aucun contenu"}
            </pre>
          </section>

          <div className="flex flex-wrap gap-2">
            {task.messageBody && (
              <DrawerBtn
                label={copied === "body" ? "Copié ✓" : "Copier le message"}
                onClick={() => copy(task.messageBody ?? "", "body")}
              />
            )}
            {task.messageSubject && (
              <DrawerBtn
                label={copied === "subject" ? "Copié ✓" : "Copier l'objet"}
                onClick={() => copy(task.messageSubject ?? "", "subject")}
              />
            )}
            <a
              href={buildGmailComposeUrl(task)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-[10px] font-mono font-bold border border-[#1F232B] rounded-md text-[#5B8DEF] hover:border-[#5B8DEF]/40"
            >
              Ouvrir dans Gmail
            </a>
          </div>

          <section className="space-y-2 pt-2 border-t border-[#1F232B]">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note d'exécution (optionnel)"
              rows={2}
              className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs text-[#E8EAED] resize-none focus:outline-none focus:border-[#5B8DEF]"
            />
            <DrawerBtn
              label="Marquer DONE"
              variant="success"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    markTaskDone({
                      taskId: task.id,
                      note: note.trim() || undefined,
                    }),
                  "done",
                )
              }
            />
          </section>

          <section className="space-y-2">
            <input
              type="date"
              value={postponeDate}
              onChange={(e) => setPostponeDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs font-mono text-[#E8EAED]"
            />
            <DrawerBtn
              label="Reporter"
              variant="warn"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    postponeTask({
                      taskId: task.id,
                      newPlannedDate: postponeDate,
                      note: note.trim() || undefined,
                    }),
                  "postpone",
                )
              }
            />
          </section>

          <section className="space-y-2 pt-2 border-t border-[#1F232B]">
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Raison d'annulation (obligatoire)"
              rows={2}
              className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs text-[#E8EAED] resize-none"
            />
            <DrawerBtn
              label="Annuler cette tâche"
              variant="danger"
              disabled={pending || !cancelReason.trim()}
              onClick={() =>
                run(
                  () =>
                    cancelTask({
                      taskId: task.id,
                      reason: cancelReason.trim(),
                    }),
                  "cancel",
                )
              }
            />
          </section>
        </div>
      </aside>
    </>
  );
}

function DrawerBtn({
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "success" | "warn" | "danger";
}) {
  const styles = {
    default: "border-[#1F232B] text-[#E8EAED]",
    success: "border-[#4ADE80]/40 text-[#4ADE80] bg-[#4ADE80]/10",
    warn: "border-[#FBBF24]/40 text-[#FBBF24] bg-[#FBBF24]/10",
    danger: "border-[#F87171]/40 text-[#F87171] bg-[#F87171]/10",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 text-[10px] font-mono font-bold border rounded-md cursor-pointer disabled:opacity-50 ${styles[variant]}`}
    >
      {label}
    </button>
  );
}
