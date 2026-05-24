"use client";

import { readStreamableValue } from "@ai-sdk/rsc";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { generateMessageStream } from "@/app/(app)/messages/_actions/generate-message";
import { saveMessage } from "@/app/(app)/messages/_actions/save-message";
import { MessagePreview } from "@/components/messages/message-preview";
import { QualityLintPanel } from "@/components/messages/quality-lint-panel";
import { RegenerateMenu } from "@/components/messages/regenerate-menu";
import { TiptapEditor } from "@/components/messages/tiptap-editor";
import { StepLabel } from "@/components/shared/step-label";
import { TrackBadge } from "@/components/shared/track-badge";
import type { FixtureTask } from "@/lib/db/queries/tasks";
import { lintMessageQuality } from "@/lib/messages/quality-linter";
import type { MessageContext } from "@/lib/messages/types";

interface MessageEditorWorkspaceProps {
  task: FixtureTask;
  sequenceSteps: FixtureTask[];
  context: MessageContext;
}

export function MessageEditorWorkspace({
  task,
  sequenceSteps,
  context,
}: MessageEditorWorkspaceProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);
  const [subject, setSubject] = useState(task.messageSubject ?? "");
  const [body, setBody] = useState(task.messageBody ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lintIssues = useMemo(
    () =>
      lintMessageQuality({
        body,
        subject: task.channel === "EMAIL" ? subject : null,
        companyNameOriginal: context.companyNameOriginal,
        source: context.source,
      }),
    [body, subject, context, task.channel],
  );

  const hasErrors = lintIssues.some((i) => i.severity === "error");

  const handleGenerate = (opts: {
    tone: "sobre" | "direct" | "personnalise";
    length: "court" | "standard";
    angle: "transaction" | "portefeuille" | "equipe";
  }) => {
    setError(null);
    setMessage(null);
    setGenerating(true);
    startTransition(async () => {
      try {
        const { stream } = await generateMessageStream({
          taskId: task.id,
          ...opts,
        });
        for await (const state of readStreamableValue(stream)) {
          if (!state) continue;
          if (state.body) setBody(state.body);
          if (state.subject != null && task.channel === "EMAIL") {
            setSubject(state.subject);
          }
          if (state.done) {
            setMessage("Génération terminée");
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur de génération");
      } finally {
        setGenerating(false);
      }
    });
  };

  const handleSave = () => {
    if (hasErrors) {
      setError("Corrigez les erreurs du linter avant d'enregistrer");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveMessage({
        taskId: task.id,
        messageSubject: task.channel === "EMAIL" ? subject : null,
        messageBody: body,
      });
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      setMessage("Message enregistré");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/messages"
          className="text-[10px] font-mono text-[#5B8DEF] hover:underline"
        >
          ← Bibliothèque
        </Link>
        <div className="flex items-center gap-2">
          <RegenerateMenu
            loading={generating}
            disabled={pending}
            onGenerate={handleGenerate}
          />
          <button
            type="button"
            disabled={pending || hasErrors}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold border border-[#4ADE80]/40 text-[#4ADE80] rounded-lg hover:bg-[#4ADE80]/10 disabled:opacity-50 cursor-pointer"
          >
            {pending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Enregistrer
          </button>
        </div>
      </div>

      {message && <p className="text-xs text-[#4ADE80] font-mono">{message}</p>}
      {error && <p className="text-xs text-[#F87171] font-mono">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[200px_1fr_340px] min-h-[560px]">
        {/* Steps */}
        <aside className="bg-[#111317] border border-[#1F232B] rounded-xl p-3 space-y-1">
          <p className="text-[10px] font-mono uppercase text-[#9AA0A6] px-2 pb-2">
            Séquence · {task.company}
          </p>
          {sequenceSteps.map((step) => {
            const active = step.id === task.id;
            return (
              <Link
                key={step.id}
                href={`/messages/${step.id}`}
                className={`block px-3 py-2 rounded-lg border transition-colors ${
                  active
                    ? "border-[#5B8DEF]/40 bg-[#5B8DEF]/10"
                    : "border-transparent hover:border-[#1F232B] hover:bg-[#16191F]"
                }`}
              >
                <StepLabel stepCode={step.stepCode} channel={step.channel} />
                <p className="text-[10px] font-mono text-[#9AA0A6] mt-1">
                  {step.plannedDate}
                </p>
              </Link>
            );
          })}
        </aside>

        {/* Editor */}
        <section className="space-y-3 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-extrabold text-[#E8EAED]">
              {task.company}
            </h2>
            <TrackBadge track={task.track} />
          </div>
          <p className="text-[10px] font-mono text-[#9AA0A6]">
            Variables : {"{{company}}"}, {"{{persona_name}}"},{" "}
            {"{{personalization_fact}}"}
          </p>
          {task.channel === "EMAIL" && (
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'email"
              className="w-full px-3 py-2 text-sm bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF]"
            />
          )}
          <TiptapEditor content={body} onChange={setBody} />
          <QualityLintPanel issues={lintIssues} />
        </section>

        {/* Preview */}
        <aside className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#9AA0A6]">
            Preview live
          </p>
          <MessagePreview
            channel={task.channel}
            company={task.company}
            contactName={task.contactName}
            subject={subject}
            body={body}
          />
        </aside>
      </div>
    </div>
  );
}
