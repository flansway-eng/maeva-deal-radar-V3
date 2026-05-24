"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Download,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Octagon,
  Pencil,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ConfidenceBar } from "@/components/leads/confidence-bar";
import { ReviewStatusBadge } from "@/components/leads/review-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ToastBanner, type ToastState } from "@/components/shared/toast-banner";
import { TrackBadge } from "@/components/shared/track-badge";
import {
  bulkMarkLeadsKeep,
  bulkMarkLeadsStop,
} from "@/lib/actions/leads/bulk-lead-actions";
import { correctLeadCompany } from "@/lib/actions/leads/correct-lead-company";
import { generateMessagesForLead } from "@/lib/actions/leads/generate-messages";
import { enrichLeadAction } from "@/lib/actions/leads/enrich-lead-pappers";
import { markLeadKeep } from "@/lib/actions/leads/mark-lead-keep";
import { markLeadStop } from "@/lib/actions/leads/mark-lead-stop";
import type {
  FixtureCompanyAlias,
  FixtureLead,
  LeadReviewStatus,
} from "@/lib/db/queries/governance-fixture";
import { exportLeadsToCsv } from "@/lib/leads/export-csv";

type TrackFilter = "ALL" | "PE" | "MA";
type ReviewFilter = "ALL" | LeadReviewStatus;
type SortKey =
  | "companyName"
  | "track"
  | "reviewStatus"
  | "confidence"
  | "website"
  | "targetRole"
  | "primarySignal";

interface LeadsShortlistProps {
  leads: FixtureLead[];
  aliases: FixtureCompanyAlias[];
  hasPappersKey?: boolean;
}

function parseConfidence(raw: string | null): number {
  if (!raw) return 0;
  const n = Number.parseFloat(raw);
  return Number.isNaN(n) ? 0 : n;
}

function emptyMessage(
  track: TrackFilter,
  review: ReviewFilter,
): { title: string; description: string } {
  if (review === "KEEP") {
    return {
      title: "Aucun lead conservé",
      description: "Aucun lead conservé pour l'instant.",
    };
  }
  if (track === "MA") {
    return {
      title: "Aucun lead M&A",
      description: "Aucun lead M&A encore sourcé.",
    };
  }
  if (track === "PE") {
    return {
      title: "Aucun lead PE",
      description: "Aucun lead PE ne correspond à ces filtres.",
    };
  }
  if (review === "STOP") {
    return {
      title: "Aucun lead arrêté",
      description: "Aucun lead en statut STOP.",
    };
  }
  return {
    title: "No leads yet",
    description: "Aucun lead ne correspond à vos filtres.",
  };
}

export function LeadsShortlist({
  leads,
  aliases,
  hasPappersKey = false,
}: LeadsShortlistProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState | null>(null);

  const [track, setTrack] = useState<TrackFilter>("ALL");
  const [review, setReview] = useState<ReviewFilter>("ALL");
  const [confMin, setConfMin] = useState(0);
  const [confMax, setConfMax] = useState(1);
  const [search, setSearch] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("confidence");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [menuLeadId, setMenuLeadId] = useState<string | null>(null);
  const [stopLeadId, setStopLeadId] = useState<string | null>(null);
  const [correctLead, setCorrectLead] = useState<FixtureLead | null>(null);
  const [correctName, setCorrectName] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (track !== "ALL" && l.track !== track) return false;
      if (review !== "ALL" && l.reviewStatus !== review) return false;
      const c = parseConfidence(l.confidenceScore);
      if (c < confMin || c > confMax) return false;
      if (q) {
        const hay = `${l.companyName} ${l.website ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, track, review, confMin, confMax, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "confidence":
          cmp =
            parseConfidence(a.confidenceScore) -
            parseConfidence(b.confidenceScore);
          break;
        case "companyName":
          cmp = a.companyName.localeCompare(b.companyName);
          break;
        case "track":
          cmp = a.track.localeCompare(b.track);
          break;
        case "reviewStatus":
          cmp = a.reviewStatus.localeCompare(b.reviewStatus);
          break;
        case "website":
          cmp = (a.website ?? "").localeCompare(b.website ?? "");
          break;
        case "targetRole":
          cmp = (a.targetRole ?? "").localeCompare(b.targetRole ?? "");
          break;
        case "primarySignal":
          cmp = (a.primarySignal ?? "").localeCompare(b.primarySignal ?? "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const allVisibleSelected =
    sorted.length > 0 && sorted.every((l) => selected.has(l.id));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "confidence" ? "desc" : "asc");
    }
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((l) => l.id)));
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const refresh = () => router.refresh();

  const runAction = (
    fn: () => Promise<{ ok: boolean; error?: string; message?: string }>,
  ) => {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        setToast({
          variant: "success",
          message:
            "message" in result && result.message
              ? result.message
              : "Action enregistrée",
        });
        setMenuLeadId(null);
        setStopLeadId(null);
        setCorrectLead(null);
        refresh();
      } else {
        setToast({
          variant: "error",
          message: result.error ?? "Erreur",
        });
      }
    });
  };

  const selectedIds = Array.from(selected);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#F5C518]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#F5C518]" />
    );
  };

  const Th = ({
    col,
    label,
    className = "",
  }: {
    col: SortKey;
    label: string;
    className?: string;
  }) => (
    <th className={`text-left px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => toggleSort(col)}
        className="inline-flex items-center gap-1 font-mono uppercase text-[10px] text-[#9AA0A6] hover:text-[#E8EAED] cursor-pointer"
      >
        {label}
        <SortIcon col={col} />
      </button>
    </th>
  );

  if (leads.length === 0) {
    return (
      <EmptyState
        title="No leads yet"
        description="Importez votre shortlist ou convertissez des découvertes sourcing en leads."
      />
    );
  }

  const empty = emptyMessage(track, review);

  return (
    <>
      {!hasPappersKey && (
        <div className="rounded-lg border border-[#FBBF24]/30 bg-[#FBBF24]/5 px-4 py-3 text-xs text-[#FBBF24] mb-4">
          Enrichissement Pappers non disponible — vérifiez PAPPERS_API_KEY dans
          votre configuration.
        </div>
      )}

      <div className="sticky top-0 z-20 -mx-1 px-1 py-3 bg-[#0A0B0D]/95 backdrop-blur border-b border-[#1F232B] mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-[#9AA0A6] uppercase mr-1">
              Track
            </span>
            {(["ALL", "PE", "MA"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrack(t)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border cursor-pointer ${
                  track === t
                    ? "bg-[#16191F] border-[#F5C518]/40 text-[#F5C518]"
                    : "border-[#1F232B] text-[#9AA0A6] hover:text-[#E8EAED]"
                }`}
              >
                {t === "ALL" ? "Tous" : t}
              </button>
            ))}
          </div>

          <select
            value={review}
            onChange={(e) => setReview(e.target.value as ReviewFilter)}
            className="px-2 py-1.5 bg-[#111317] border border-[#1F232B] rounded-md text-[10px] font-mono text-[#E8EAED] cursor-pointer"
            aria-label="Filtre review"
          >
            <option value="ALL">Review · Tous</option>
            <option value="PENDING">PENDING</option>
            <option value="KEEP">KEEP</option>
            <option value="STOP">STOP</option>
            <option value="CORRECT">CORRECT</option>
          </select>

          <div className="flex items-center gap-2 min-w-[180px]">
            <span className="text-[10px] font-mono text-[#9AA0A6] whitespace-nowrap">
              Conf. {confMin.toFixed(1)}–{confMax.toFixed(1)}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={confMin}
              onChange={(e) =>
                setConfMin(Math.min(Number(e.target.value), confMax))
              }
              className="w-16 accent-[#F5C518]"
              aria-label="Confidence minimum"
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={confMax}
              onChange={(e) =>
                setConfMax(Math.max(Number(e.target.value), confMin))
              }
              className="w-16 accent-[#5B8DEF]"
              aria-label="Confidence maximum"
            />
          </div>

          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9AA0A6]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Company, website…"
              className="w-full pl-8 pr-3 py-1.5 bg-[#111317] border border-[#1F232B] rounded-md text-xs text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF]"
            />
          </div>

          <button
            type="button"
            onClick={() => exportLeadsToCsv(sorted)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 ml-auto border border-[#1F232B] rounded-md text-[10px] font-mono font-bold text-[#E8EAED] hover:border-[#5B8DEF] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title={empty.title} description={empty.description} />
      ) : (
        <div className="bg-[#111317] border border-[#1F232B] rounded-xl overflow-x-auto pb-20">
          <table className="w-full text-xs min-w-[1100px]">
            <thead>
              <tr className="border-b border-[#1F232B]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="accent-[#F5C518] cursor-pointer"
                    aria-label="Tout sélectionner"
                  />
                </th>
                <Th col="companyName" label="Company" />
                <Th col="track" label="Track" />
                <Th col="reviewStatus" label="Review" />
                <Th col="confidence" label="Confidence" />
                <Th col="website" label="Website" />
                <Th col="targetRole" label="Target role" />
                <Th col="primarySignal" label="Signal" />
                <th className="text-right px-4 py-3 font-mono uppercase text-[10px] text-[#9AA0A6]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-[#1F232B]/50 hover:bg-[#0A0B0D] group"
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggleRow(lead.id)}
                      className="accent-[#F5C518] cursor-pointer"
                      aria-label={`Sélectionner ${lead.companyName}`}
                    />
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-[#E8EAED]">
                    {lead.companyName}
                  </td>
                  <td className="px-4 py-2.5">
                    <TrackBadge track={lead.track} size="sm" />
                  </td>
                  <td className="px-4 py-2.5">
                    <ReviewStatusBadge status={lead.reviewStatus} />
                  </td>
                  <td className="px-4 py-2.5">
                    <ConfidenceBar
                      score={parseConfidence(lead.confidenceScore)}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    {lead.website ? (
                      <a
                        href={
                          lead.website.startsWith("http")
                            ? lead.website
                            : `https://${lead.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5B8DEF] hover:underline truncate block max-w-[140px]"
                      >
                        {lead.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[#9AA0A6]">
                    {lead.targetRole ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[#9AA0A6] max-w-[140px] truncate">
                    {lead.primarySignal ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right relative">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        setMenuLeadId((id) => (id === lead.id ? null : lead.id))
                      }
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#1F232B] text-[#9AA0A6] hover:text-[#E8EAED] cursor-pointer disabled:opacity-50"
                      aria-label="Actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuLeadId === lead.id && (
                      <>
                        <button
                          type="button"
                          className="fixed inset-0 z-40 cursor-default"
                          aria-label="Fermer"
                          onClick={() => setMenuLeadId(null)}
                        />
                        <div className="absolute right-4 top-full mt-1 z-50 min-w-[200px] py-1 bg-[#16191F] border border-[#1F232B] rounded-lg shadow-xl text-left">
                          <MenuItem
                            icon={
                              <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                            }
                            label="KEEP"
                            onClick={() =>
                              runAction(() => markLeadKeep({ leadId: lead.id }))
                            }
                          />
                          <MenuItem
                            icon={
                              <Octagon className="w-3.5 h-3.5 text-[#F87171]" />
                            }
                            label="STOP"
                            onClick={() => {
                              setMenuLeadId(null);
                              setStopLeadId(lead.id);
                            }}
                          />
                          <MenuItem
                            icon={
                              <Pencil className="w-3.5 h-3.5 text-[#5B8DEF]" />
                            }
                            label="CORRIGER"
                            onClick={() => {
                              setMenuLeadId(null);
                              setCorrectLead(lead);
                              setCorrectName(lead.companyName);
                            }}
                          />
                          <MenuItem
                            icon={
                              <MessageSquare className="w-3.5 h-3.5 text-[#F5C518]" />
                            }
                            label="Générer messages"
                            onClick={() =>
                              runAction(async () => {
                                const r = await generateMessagesForLead({
                                  leadId: lead.id,
                                });
                                return r.ok
                                  ? { ok: true, message: r.message }
                                  : { ok: false, error: r.error };
                              })
                            }
                          />
                          {lead.reviewStatus === "KEEP" && hasPappersKey && (
                            <MenuItem
                              icon={
                                <Search className="w-3.5 h-3.5 text-[#5B8DEF]" />
                              }
                              label="Enrichir (Pappers)"
                              onClick={() =>
                                runAction(async () => {
                                  const r = await enrichLeadAction(lead.id);
                                  return r.ok
                                    ? {
                                        ok: true,
                                        message: `SIREN ${r.data.siren} récupéré`,
                                      }
                                    : { ok: false, error: r.error };
                                })
                              }
                            />
                          )}
                          <Link
                            href={`/leads/${lead.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-[#E8EAED] hover:bg-[#1F232B]"
                            onClick={() => setMenuLeadId(null)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Voir détail
                          </Link>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 bg-[#111317] border border-[#F5C518]/30 rounded-xl shadow-2xl">
          <span className="text-xs font-mono text-[#E8EAED]">
            {selectedIds.length} lead{selectedIds.length > 1 ? "s" : ""}{" "}
            sélectionné
            {selectedIds.length > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              runAction(() => bulkMarkLeadsKeep({ leadIds: selectedIds }))
            }
            className="px-3 py-1.5 text-[10px] font-bold bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/40 rounded-md cursor-pointer disabled:opacity-50"
          >
            KEEP tous
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              runAction(() => bulkMarkLeadsStop({ leadIds: selectedIds }))
            }
            className="px-3 py-1.5 text-[10px] font-bold bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/40 rounded-md cursor-pointer disabled:opacity-50"
          >
            STOP tous
          </button>
          <button
            type="button"
            onClick={() => {
              const rows = sorted.filter((l) => selected.has(l.id));
              exportLeadsToCsv(rows, "shortlist-selection.csv");
            }}
            className="px-3 py-1.5 text-[10px] font-bold border border-[#1F232B] text-[#E8EAED] rounded-md cursor-pointer"
          >
            Exporter sélection
          </button>
        </div>
      )}

      {stopLeadId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-[#111317] border border-[#1F232B] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#E8EAED]">
              Confirmer STOP ?
            </h3>
            <p className="text-xs text-[#9AA0A6]">
              Les tâches PLANNED liées à ce lead seront arrêtées.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStopLeadId(null)}
                className="px-3 py-1.5 text-xs text-[#9AA0A6] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  runAction(() => markLeadStop({ leadId: stopLeadId }))
                }
                className="px-4 py-1.5 text-xs font-bold bg-[#F87171] text-white rounded-lg cursor-pointer disabled:opacity-50"
              >
                STOP
              </button>
            </div>
          </div>
        </div>
      )}

      {correctLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-[#111317] border border-[#1F232B] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#E8EAED]">
              Corriger — {correctLead.companyName}
            </h3>
            <input
              list="lead-alias-suggestions"
              value={correctName}
              onChange={(e) => setCorrectName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-sm text-[#E8EAED]"
              placeholder="Nom corrigé"
            />
            <datalist id="lead-alias-suggestions">
              {aliases.map((a) => (
                <option key={a.id} value={a.canonicalName} />
              ))}
            </datalist>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCorrectLead(null)}
                className="px-3 py-1.5 text-xs text-[#9AA0A6] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={pending || !correctName.trim()}
                onClick={() =>
                  runAction(() =>
                    correctLeadCompany({
                      leadId: correctLead.id,
                      correctedName: correctName,
                    }),
                  )
                }
                className="px-4 py-1.5 text-xs font-bold bg-[#5B8DEF] text-[#0A0B0D] rounded-lg cursor-pointer disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function MenuItem({
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
      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#E8EAED] hover:bg-[#1F232B] cursor-pointer text-left"
    >
      {icon}
      {label}
    </button>
  );
}
