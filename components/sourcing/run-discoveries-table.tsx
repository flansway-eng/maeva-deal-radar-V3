"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ToastBanner, type ToastState } from "@/components/shared/toast-banner";
import { convertToLeads } from "@/lib/actions/sourcing/convert-to-leads";
import type { FixtureWebDiscovery } from "@/lib/db/queries/sourcing-fixture";
import {
  type DiscoveryPageTypeFilter,
  isBlockedMediaDomain,
  normalizeDiscoveryDomain,
  normalizePageTypeForFilter,
} from "@/lib/sourcing/discovery-to-lead";

type PageTypeFilter = "all" | DiscoveryPageTypeFilter;

interface RunDiscoveriesTableProps {
  discoveries: FixtureWebDiscovery[];
}

export function RunDiscoveriesTable({ discoveries }: RunDiscoveriesTableProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState | null>(null);

  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<PageTypeFilter>("all");
  const [hideMedia, setHideMedia] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const uniqueDomains = useMemo(() => {
    const domains = new Set(
      discoveries.map((d) => normalizeDiscoveryDomain(d.domain)),
    );
    return [...domains].sort((a, b) => a.localeCompare(b));
  }, [discoveries]);

  const filtered = useMemo(() => {
    return discoveries.filter((d) => {
      const domain = normalizeDiscoveryDomain(d.domain);
      if (domainFilter !== "all" && domain !== domainFilter) return false;
      if (typeFilter !== "all") {
        const normalized = normalizePageTypeForFilter(d.pageType);
        if (normalized !== typeFilter) return false;
      }
      if (hideMedia && isBlockedMediaDomain(d.domain)) return false;
      return true;
    });
  }, [discoveries, domainFilter, typeFilter, hideMedia]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((d) => selected.has(d.id));

  const selectedIds = useMemo(
    () => [...selected].filter((id) => discoveries.some((d) => d.id === id)),
    [selected, discoveries],
  );

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const d of filtered) next.delete(d.id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const d of filtered) next.add(d.id);
        return next;
      });
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

  const handleConvert = () => {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      const result = await convertToLeads(selectedIds);
      if (!result.ok) {
        setToast({ variant: "error", message: result.error });
        return;
      }
      const parts: string[] = [];
      if (result.created > 0) {
        parts.push(
          `${result.created} lead${result.created > 1 ? "s" : ""} créé${result.created > 1 ? "s" : ""}`,
        );
      }
      if (result.skipped > 0) {
        parts.push(
          `${result.skipped} ignoré${result.skipped > 1 ? "s" : ""} (doublon ou erreur)`,
        );
      }
      setToast({
        variant: result.created > 0 ? "success" : "info",
        message: parts.join(" · ") || "Aucun lead créé",
      });
      setSelected(new Set());
      router.refresh();
      if (result.created > 0) {
        router.push("/leads");
      }
    });
  };

  if (discoveries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-3 p-4 bg-[#111317] border border-[#1F232B] rounded-xl">
        <label className="flex flex-col gap-1 min-w-[160px]">
          <span className="text-[10px] font-mono uppercase text-[#9AA0A6]">
            Domaine
          </span>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-[#E8EAED]"
          >
            <option value="all">Tous les domaines</option>
            {uniqueDomains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-[140px]">
          <span className="text-[10px] font-mono uppercase text-[#9AA0A6]">
            Type de page
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PageTypeFilter)}
            className="px-2.5 py-1.5 text-xs bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-[#E8EAED]"
          >
            <option value="all">Tous les types</option>
            <option value="fund_page">fund_page</option>
            <option value="portfolio">portfolio</option>
            <option value="news">news</option>
            <option value="other">other</option>
          </select>
        </label>

        <label className="flex items-center gap-2 cursor-pointer pb-1.5">
          <input
            type="checkbox"
            checked={hideMedia}
            onChange={(e) => setHideMedia(e.target.checked)}
            className="rounded border-[#1F232B]"
          />
          <span className="text-xs text-[#9AA0A6]">
            Masquer Wikipedia / médias
          </span>
        </label>

        <span className="ml-auto text-[10px] font-mono text-[#9AA0A6] pb-1.5">
          {filtered.length} / {discoveries.length} lignes
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun résultat"
          description="Aucune découverte ne correspond à ces filtres."
        />
      ) : (
        <div className="bg-[#111317] border border-[#1F232B] rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1F232B] text-[#9AA0A6] font-mono uppercase text-[10px]">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Tout sélectionner"
                    className="rounded border-[#1F232B]"
                  />
                </th>
                <th className="text-left px-4 py-3">Titre</th>
                <th className="text-left px-4 py-3">Domaine</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className={`border-b border-[#1F232B]/50 hover:bg-[#0A0B0D] ${
                    selected.has(d.id) ? "bg-[#F5C518]/5" : ""
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(d.id)}
                      onChange={() => toggleRow(d.id)}
                      aria-label={`Sélectionner ${d.sourceTitle}`}
                      className="rounded border-[#1F232B]"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <a
                      href={d.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#E8EAED] hover:text-[#5B8DEF]"
                    >
                      {d.sourceTitle}
                    </a>
                    {d.snippet && (
                      <p className="text-[10px] text-[#9AA0A6] mt-0.5 line-clamp-2">
                        {d.snippet}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#9AA0A6]">
                    {d.domain}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[10px]">
                    {normalizePageTypeForFilter(d.pageType)}
                  </td>
                  <td className="px-4 py-2.5 font-mono">{d.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 bg-[#111317] border border-[#F5C518]/30 rounded-xl shadow-2xl">
          <span className="text-xs font-mono text-[#E8EAED]">
            {selectedIds.length} sélectionné
            {selectedIds.length > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={handleConvert}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold bg-[#F5C518] text-[#0A0B0D] rounded-md cursor-pointer disabled:opacity-50"
          >
            Convertir en leads
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
