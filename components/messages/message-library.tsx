"use client";

import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { batchRegenerateMessages } from "@/app/(app)/messages/_actions/batch-regenerate";
import { StatusBadge } from "@/components/shared/status-badge";
import { StepLabel } from "@/components/shared/step-label";
import { TrackBadge } from "@/components/shared/track-badge";
import type { FixtureTask } from "@/lib/db/queries/tasks";

interface MessageLibraryProps {
  tasks: FixtureTask[];
}

export function MessageLibrary({ tasks }: MessageLibraryProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(
        tasks
          .filter((t) => t.status === "PLANNED")
          .slice(0, 5)
          .map((t) => t.id),
      ),
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBatch = () => {
    const ids = [...selected];
    if (ids.length === 0) {
      setFeedback("Sélectionnez au moins une tâche");
      return;
    }
    startTransition(async () => {
      const result = await batchRegenerateMessages({
        taskIds: ids,
        tone: "sobre",
        length: "standard",
        angle: "transaction",
      });
      if (!result.ok) {
        setFeedback(result.error ?? "Erreur");
        return;
      }
      setFeedback(`${result.count ?? 0} message(s) régénéré(s)`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#9AA0A6]">
          {selected.size} sélectionné{selected.size !== 1 ? "s" : ""} ·{" "}
          {tasks.length} tâches
        </p>
        <button
          type="button"
          disabled={pending || selected.size === 0}
          onClick={runBatch}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#5B8DEF] text-[#0A0B0D] rounded-lg disabled:opacity-50 cursor-pointer"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Régénérer la sélection (batch)
        </button>
      </div>

      {feedback && (
        <p className="text-xs font-mono text-[#4ADE80]">{feedback}</p>
      )}

      <div className="bg-[#111317] border border-[#1F232B] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-2.5 bg-[#0A0B0D] border-b border-[#1F232B] text-[10px] font-mono uppercase text-[#9AA0A6]">
          <span />
          <span>Société</span>
          <span>Étape</span>
          <span>Statut</span>
          <span />
        </div>
        <div className="divide-y divide-[#1F232B] max-h-[520px] overflow-y-auto">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-3 items-center hover:bg-[#16191F]/50"
            >
              <input
                type="checkbox"
                checked={selected.has(task.id)}
                onChange={() => toggle(task.id)}
                className="accent-[#5B8DEF]"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#E8EAED] truncate">
                    {task.company}
                  </p>
                  <TrackBadge track={task.track} size="sm" />
                </div>
                <p className="text-[10px] text-[#9AA0A6] truncate mt-0.5">
                  {task.messageBody?.slice(0, 80) ?? "— pas de message —"}
                </p>
              </div>
              <StepLabel
                stepCode={task.stepCode}
                channel={task.channel}
                showIcon={false}
              />
              <StatusBadge status={task.status} size="sm" />
              <Link
                href={`/messages/${task.id}`}
                className="text-[10px] font-mono font-bold text-[#5B8DEF] hover:underline shrink-0"
              >
                Éditer →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
