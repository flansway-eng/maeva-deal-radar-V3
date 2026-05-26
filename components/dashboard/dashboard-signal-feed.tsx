"use client";

import { ExternalLink, Plus, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ToastBanner, type ToastState } from "@/components/shared/toast-banner";
import { createLeadFromSignal } from "@/lib/actions/signals/create-lead-from-signal";
import type { SignalSource, SignalType } from "@/lib/db/schema";
import type { SignalFeedItem } from "@/lib/signals/types";

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days}j`;
}

function sourceBadge(source: SignalSource): {
  label: string;
  className: string;
} {
  const map: Record<SignalSource, { label: string; className: string }> = {
    BODACC: {
      label: "BODACC",
      className: "bg-[#7B68C8]/12 text-[#9A8AE0] border-[#7B68C8]/25",
    },
    RSS_BFM: {
      label: "BFM",
      className: "bg-[#E07070]/12 text-[#E07070] border-[#E07070]/25",
    },
    RSS_LEMONDE: {
      label: "LE MONDE",
      className: "bg-[#4472AA]/12 text-[#4472AA] border-[#4472AA]/25",
    },
    PAPPERS: {
      label: "PAPPERS",
      className: "bg-[#8899AE]/12 text-[#8899AE] border-[#8899AE]/25",
    },
    TAVILY: {
      label: "TAVILY",
      className: "bg-[#C4974C]/12 text-[#C4974C] border-[#C4974C]/25",
    },
  };
  return map[source];
}

function signalTypeLabel(type: SignalType | null): string {
  return type ?? "NEWS";
}

function sourceHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface DashboardSignalFeedProps {
  signals: SignalFeedItem[];
}

export function DashboardSignalFeed({ signals }: DashboardSignalFeedProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const verified = signals.filter(
    (item): item is SignalFeedItem & { sourceUrl: string } =>
      Boolean(
        item.sourceUrl?.startsWith("http") &&
          !item.sourceUrl.includes("example.com"),
      ),
  );

  const handleAddLead = (signalId: string) => {
    setCreatingId(signalId);
    startTransition(async () => {
      const result = await createLeadFromSignal(signalId);
      setCreatingId(null);
      if (result.ok) {
        setToast({ variant: "success", message: "Lead créé depuis le signal" });
        router.refresh();
      } else {
        setToast({ variant: "error", message: result.error });
      }
    });
  };

  return (
    <>
      <div className="bg-[#0C1A2E] border border-[#1A3050] rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#1A3050] pb-4 mb-4">
          <p className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#4ADE80]" />
            <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#EDE8DC] uppercase">
              SIGNAL FEED — ACTUALITÉ MARCHÉ
            </span>
          </p>
          <span className="text-[8px] font-mono text-[#8899AE] uppercase bg-[#07101E] border border-[#1A3050] px-2 py-0.5 rounded tracking-wider">
            SOURCES VÉRIFIÉES
          </span>
        </div>

        {verified.length === 0 ? (
          <p className="text-[11px] text-[#8899AE] leading-relaxed font-mono">
            Aucun signal de marché pour l&apos;instant.
            <br />
            Le Signal Feed se mettra à jour lors du prochain run Tavily.
          </p>
        ) : (
          <div className="space-y-4">
            {verified.map((item, i) => {
              const badge = sourceBadge(item.source);
              return (
                <article
                  key={item.id}
                  className={
                    i < verified.length - 1
                      ? "border-b border-[#1A3050]/60 pb-3"
                      : ""
                  }
                >
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border tracking-wider ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[8px] font-mono text-[#8899AE] uppercase border border-[#1A3050] px-1.5 py-0.5 rounded tracking-wider">
                        {signalTypeLabel(item.signalType)}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-[#8899AE]">
                      {formatRelative(item.publishedAt)}
                    </span>
                  </div>

                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-semibold text-[#EDE8DC] hover:text-[#C4974C] transition-colors inline-flex items-start gap-1"
                  >
                    <span>{item.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-50" />
                  </a>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-[9px] font-mono text-[#4472AA] hover:underline truncate"
                  >
                    {sourceHostname(item.sourceUrl)}
                  </a>
                  {item.snippet && (
                    <p className="text-[10px] text-[#8899AE] mt-1 line-clamp-2 leading-relaxed">
                      {item.snippet}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={pending && creatingId === item.id}
                    onClick={() => handleAddLead(item.id)}
                    className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-[9px] font-mono font-bold border border-[#4ADE80]/25 text-[#4ADE80] rounded hover:bg-[#4ADE80]/08 cursor-pointer disabled:opacity-50 tracking-wider"
                  >
                    <Plus className="w-3 h-3" />
                    Ajouter comme lead
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
