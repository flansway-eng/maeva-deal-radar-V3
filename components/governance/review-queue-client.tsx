"use client";

import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { applyReviewDecisions } from "@/app/(app)/governance/_actions/apply-review-decisions";
import { TrackBadge } from "@/components/shared/track-badge";
import type {
  FixtureCompanyAlias,
  PendingReviewRow,
  ReviewDecisionType,
} from "@/lib/db/queries/governance";

interface ReviewQueueClientProps {
  rows: PendingReviewRow[];
  aliases: FixtureCompanyAlias[];
}

type RowDraft = {
  decision: ReviewDecisionType;
  correctedCompany: string;
  reason: string;
  selected: boolean;
};

export function ReviewQueueClient({ rows, aliases }: ReviewQueueClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<Record<string, RowDraft>>(() => {
    const init: Record<string, RowDraft> = {};
    for (const row of rows) {
      init[row.id] = {
        decision: "KEEP",
        correctedCompany: row.correctedCompany ?? row.leadCompany ?? "",
        reason: "",
        selected: true,
      };
    }
    return init;
  });

  const aliasNames = useMemo(
    () => [...new Set(aliases.map((a) => a.canonicalName))].sort(),
    [aliases],
  );

  const previewRow = rows.find((r) => r.id === previewId);

  const applyBatch = () => {
    setError(null);
    const items = rows
      .filter((r) => drafts[r.id]?.selected)
      .map((r) => {
        const d = drafts[r.id];
        return {
          reviewId: r.id,
          decision: d?.decision ?? "KEEP",
          correctedCompany:
            d?.decision === "CORRECT" ? d.correctedCompany : undefined,
          reason: d?.reason?.trim() || undefined,
        };
      });

    if (items.length === 0) {
      setError("Sélectionnez au moins une ligne");
      return;
    }

    startTransition(async () => {
      const result = await applyReviewDecisions({ items });
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      router.refresh();
    });
  };

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[#9AA0A6] py-8 text-center">
        File de revue vide — toutes les décisions sont appliquées.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-mono text-[#9AA0A6]">
          {rows.length} décision{rows.length > 1 ? "s" : ""} en attente
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={applyBatch}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#F5C518] text-[#0A0B0D] rounded-lg hover:bg-[#F5C518]/90 disabled:opacity-50 cursor-pointer"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Appliquer décisions
        </button>
      </div>

      {error && (
        <p className="text-xs text-[#F87171] font-mono px-3 py-2 bg-[#F87171]/10 rounded-lg border border-[#F87171]/20">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="bg-[#111317] border border-[#1F232B] rounded-xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-2.5 bg-[#0A0B0D] border-b border-[#1F232B] text-[10px] font-mono uppercase tracking-wider text-[#9AA0A6]">
            <span />
            <span>Société / Source</span>
            <span>Décision</span>
            <span>Correction</span>
          </div>

          <div className="divide-y divide-[#1F232B] max-h-[520px] overflow-y-auto">
            {rows.map((row) => {
              const draft = drafts[row.id];
              if (!draft) return null;
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-3 items-start hover:bg-[#16191F]/50"
                >
                  <input
                    type="checkbox"
                    checked={draft.selected}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [row.id]: { ...draft, selected: e.target.checked },
                      }))
                    }
                    className="mt-1 accent-[#F5C518]"
                  />

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-[#E8EAED] truncate">
                        {row.rawCompany}
                      </p>
                      {row.track && <TrackBadge track={row.track} size="sm" />}
                    </div>
                    <p className="text-[10px] font-mono text-[#9AA0A6] truncate">
                      → {row.correctedCompany ?? row.leadCompany ?? "—"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPreviewId(row.id)}
                      className="inline-flex items-center gap-1 text-[10px] text-[#5B8DEF] hover:underline cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Aperçu source
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    {(["KEEP", "STOP", "CORRECT"] as const).map((dec) => (
                      <button
                        key={dec}
                        type="button"
                        onClick={() =>
                          setDrafts((d) => ({
                            ...d,
                            [row.id]: { ...draft, decision: dec },
                          }))
                        }
                        className={`px-2 py-1 text-[10px] font-mono font-bold rounded border cursor-pointer transition-colors ${
                          draft.decision === dec
                            ? dec === "KEEP"
                              ? "bg-[#4ADE80]/20 border-[#4ADE80]/40 text-[#4ADE80]"
                              : dec === "STOP"
                                ? "bg-[#71717A]/20 border-[#71717A]/40 text-[#9AA0A6]"
                                : "bg-[#5B8DEF]/20 border-[#5B8DEF]/40 text-[#5B8DEF]"
                            : "border-[#1F232B] text-[#9AA0A6] hover:border-[#2A2F3A]"
                        }`}
                      >
                        {dec}
                      </button>
                    ))}
                  </div>

                  <div className="w-40 space-y-1">
                    {draft.decision === "CORRECT" ? (
                      <input
                        list={`aliases-${row.id}`}
                        value={draft.correctedCompany}
                        onChange={(e) =>
                          setDrafts((d) => ({
                            ...d,
                            [row.id]: {
                              ...draft,
                              correctedCompany: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-2 py-1 text-[10px] bg-[#0A0B0D] border border-[#1F232B] rounded text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF]"
                        placeholder="Nom canonique"
                      />
                    ) : (
                      <span className="text-[10px] text-[#9AA0A6]/50">—</span>
                    )}
                    <datalist id={`aliases-${row.id}`}>
                      {aliasNames.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                    <input
                      value={draft.reason}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [row.id]: { ...draft, reason: e.target.value },
                        }))
                      }
                      placeholder="Raison (opt.)"
                      className="w-full px-2 py-1 text-[10px] bg-[#0A0B0D] border border-[#1F232B] rounded text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#111317] border border-[#1F232B] rounded-xl overflow-hidden min-h-[280px]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#1F232B]">
            <span className="text-[10px] font-mono uppercase text-[#9AA0A6]">
              Preview source
            </span>
            {previewId && (
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                className="text-[#9AA0A6] hover:text-[#E8EAED] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {previewRow?.previewUrl ? (
            <iframe
              title={`Source ${previewRow.rawCompany}`}
              src={previewRow.previewUrl}
              loading="lazy"
              className="w-full h-[480px] bg-[#0A0B0D]"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <p className="p-6 text-xs text-[#9AA0A6] text-center">
              Sélectionnez une ligne pour prévisualiser la source.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
