"use client";

import { Check, ChevronRight, Mail } from "lucide-react";
import { useState } from "react";
import { StepLabel } from "@/components/shared/step-label";
import { TrackBadge } from "@/components/shared/track-badge";
import { VoiceNoteButton } from "@/components/today/voice-note-button";
import type { FixtureTask } from "@/lib/db/queries/tasks";
import { buildMailtoUrl } from "@/lib/today/mailto";

interface TodayTaskCardProps {
  task: FixtureTask;
  index: number;
  exiting?: boolean;
  onDone: () => void;
  onPostpone: () => void;
  onOpenDetail: () => void;
}

export function TodayTaskCard({
  task,
  index,
  exiting = false,
  onDone,
  onPostpone,
  onOpenDetail,
}: TodayTaskCardProps) {
  const [executionNote, setExecutionNote] = useState(task.executionNote ?? "");
  const isEmail = task.channel === "EMAIL";
  const preview = task.messageBody ? `${task.messageBody.slice(0, 90)}…` : null;
  const mailto = buildMailtoUrl(task);

  return (
    <div
      className={`group bg-[#111317] border border-[#1F232B] rounded-xl p-5 transition-all duration-300 hover:border-[#2A2F3A] relative overflow-hidden ${
        exiting
          ? "translate-x-full opacity-0 scale-95 pointer-events-none"
          : "hover:-translate-y-0.5"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] ${
          task.track === "PE" ? "bg-[#F5C518]" : "bg-[#5B8DEF]"
        }`}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-extrabold text-[#E8EAED] truncate">
              {task.company}
            </p>
            <TrackBadge track={task.track} size="sm" />
          </div>
          {task.contactName && (
            <p className="text-xs text-[#9AA0A6] mt-0.5 truncate">
              {task.contactName}
              {task.title ? ` · ${task.title}` : ""}
              {task.location ? ` · ${task.location}` : ""}
            </p>
          )}
        </div>

        {isEmail ? (
          <a
            href={mailto}
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors bg-[#5B8DEF]/10 border-[#5B8DEF]/20 text-[#5B8DEF] hover:bg-[#5B8DEF]/20"
            aria-label="Ouvrir dans le client mail"
          >
            <Mail className="w-4 h-4" />
          </a>
        ) : (
          <button
            type="button"
            onClick={onOpenDetail}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors bg-[#0A66C2]/10 border-[#0A66C2]/20 text-[#0A66C2] hover:bg-[#0A66C2]/20 cursor-pointer"
            aria-label="Voir le message LinkedIn"
          >
            <LinkedinIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <StepLabel stepCode={task.stepCode} channel={task.channel} />

      {preview && (
        <p className="mt-2 text-[11px] text-[#9AA0A6]/80 leading-relaxed line-clamp-2 italic">
          "{preview}"
        </p>
      )}

      {task.messageSubject && (
        <div className="mt-2 px-2 py-1 bg-[#0A0B0D] border border-[#1F232B] rounded text-[10px] font-mono text-[#9AA0A6] truncate">
          Objet : {task.messageSubject}
        </div>
      )}

      {executionNote && (
        <p className="mt-2 text-[10px] text-[#E8EAED]/90 bg-[#0A0B0D] border border-[#1F232B] rounded px-2 py-1.5">
          Note : {executionNote}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <VoiceNoteButton
          taskId={task.id}
          onTranscript={(text) => setExecutionNote(text)}
        />

        <button
          type="button"
          onClick={onPostpone}
          className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border border-[#FBBF24]/30 text-[#FBBF24] hover:bg-[#FBBF24]/10 cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        >
          +1J
        </button>

        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border border-[#4ADE80]/30 text-[#4ADE80] hover:bg-[#4ADE80]/10 cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        >
          <Check className="w-3 h-3" />
          Fait
        </button>

        <span className="hidden sm:inline text-[10px] font-mono text-[#9AA0A6] ml-auto">
          Swipe → DONE · ← +1J
        </span>

        <button
          type="button"
          onClick={onOpenDetail}
          className="ml-auto p-1.5 rounded-md text-[#9AA0A6] hover:text-[#E8EAED] hover:bg-[#16191F] cursor-pointer"
          aria-label="Voir le détail"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <title>LinkedIn</title>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
