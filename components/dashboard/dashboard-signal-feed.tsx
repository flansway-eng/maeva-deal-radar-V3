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
      className: "bg-[#A78BFA]/15 text-[#A78BFA] border-[#A78BFA]/30",
    },
    RSS_BFM: {
      label: "BFM",
      className: "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30",
    },
    RSS_LEMONDE: {
      label: "LE MONDE",
      className: "bg-[#5B8DEF]/15 text-[#5B8DEF] border-[#5B8DEF]/30",
    },
    PAPPERS: {
      label: "PAPPERS",
      className: "bg-[#9AA0A6]/15 text-[#9AA0A6] border-[#9AA0A6]/30",
    },
    TAVILY: {
      label: "TAVILY",
      className: "bg-[#F5C518]/15 text-[#F5C518] border-[#F5C518]/30",
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
      <div className="bg-[#111317] border border-[#1F232B] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#1F232B] pb-4 mb-4">
          <p className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#4ADE80]" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#E8EAED] uppercase">
              SIGNAL FEED — L&apos;ACTUALITÉ DU MARCHÉ
            </span>
          </p>
          <span className="text-[9px] font-mono text-[#9AA0A6] uppercase bg-[#0A0B0D] border border-[#1F232B] px-2 py-0.5 rounded">
            SOURCES VÉRIFIÉES
          </span>
        </div>

        {verified.length === 0 ? (
          <p className="text-xs text-[#9AA0A6] leading-relaxed">
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
                      ? "border-b border-[#1F232B]/50 pb-3"
                      : ""
                  }
                >
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[9px] font-mono text-[#9AA0A6] uppercase border border-[#1F232B] px-1.5 py-0.5 rounded">
                        {signalTypeLabel(item.signalType)}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#9AA0A6]">
                      {formatRelative(item.publishedAt)}
                    </span>
                  </div>

                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#E8EAED] hover:text-[#5B8DEF] transition-colors inline-flex items-start gap-1"
                  >
                    <span>{item.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-60" />
                  </a>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-[10px] font-mono text-[#5B8DEF] hover:underline truncate"
                  >
                    {sourceHostname(item.sourceUrl)}
                  </a>
                  {item.snippet && (
                    <p className="text-[10px] text-[#9AA0A6] mt-1 line-clamp-2">
                      {item.snippet}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={pending && creatingId === item.id}
                    onClick={() => handleAddLead(item.id)}
                    className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold border border-[#4ADE80]/30 text-[#4ADE80] rounded-md hover:bg-[#4ADE80]/10 cursor-pointer disabled:opacity-50"
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
