"use client";

import Link from "next/link";
import { Building2, FileText, Loader2, Newspaper, Play, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ToastBanner, type ToastState } from "@/components/shared/toast-banner";
import { launchSourcingRun } from "@/lib/actions/sourcing/launch-run";
import { DEFAULT_SOURCING_QUERIES } from "@/lib/sourcing/constants";

interface LaunchRunDialogProps {
  hasTavilyKey: boolean;
  hasPappersKey: boolean;
}

interface SourceToggles {
  tavily: boolean;
  bodacc: boolean;
  rss: boolean;
  pappers: boolean;
}

function formatResultMessage(counts: {
  tavily: number;
  bodacc: number;
  rss: number;
  pappers: number;
}): string {
  const parts: string[] = [];
  if (counts.tavily > 0) parts.push(`${counts.tavily} découvertes Tavily`);
  if (counts.bodacc > 0) parts.push(`${counts.bodacc} signaux BODACC`);
  if (counts.rss > 0) parts.push(`${counts.rss} articles RSS`);
  if (counts.pappers > 0) parts.push(`${counts.pappers} leads enrichis Pappers`);
  return parts.length > 0 ? parts.join(" · ") : "Run terminé — aucun nouveau résultat";
}

export function LaunchRunDialog({
  hasTavilyKey,
  hasPappersKey,
}: LaunchRunDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [sources, setSources] = useState<SourceToggles>({
    tavily: true,
    bodacc: true,
    rss: true,
    pappers: false,
  });

  const [queriesText, setQueriesText] = useState(
    DEFAULT_SOURCING_QUERIES.join("\n"),
  );
  const [depth, setDepth] = useState<"basic" | "advanced">("basic");
  const [limit, setLimit] = useState(5);

  const activeCount = useMemo(
    () => Object.values(sources).filter(Boolean).length,
    [sources],
  );

  const isBusy = pending || loading;

  const onClose = () => {
    if (!isBusy) setOpen(false);
  };

  const toggleSource = (key: keyof SourceToggles, value: boolean) => {
    setSources((prev) => ({ ...prev, [key]: value }));
  };

  const handleLaunch = () => {
    setToast({ variant: "info", message: "Lancement en cours..." });
    setLoading(true);

    if (activeCount === 0) {
      setLoading(false);
      setToast({
        variant: "error",
        message: "Activez au moins une source.",
      });
      return;
    }

    const queries = sources.tavily
      ? queriesText
          .split("\n")
          .map((q) => q.trim())
          .filter(Boolean)
      : undefined;

    if (sources.tavily && (!queries || queries.length === 0)) {
      setLoading(false);
      setToast({
        variant: "error",
        message: "Ajoutez au moins une requête Tavily.",
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const result = await launchSourcingRun({
            sources,
            queries,
            depth: sources.tavily ? depth : undefined,
            limit: sources.tavily ? limit : undefined,
          });
          if (result.success) {
            const base = formatResultMessage(result.counts);
            const warn =
              result.warnings.length > 0
                ? ` · ${result.warnings.join(" · ")}`
                : "";
            setToast({
              variant: "success",
              message: `${base}${warn}`,
            });
            router.refresh();
            onClose();
          } else {
            const partial =
              result.counts && Object.values(result.counts).some((n) => n > 0)
                ? ` — ${formatResultMessage(result.counts)}`
                : "";
            setToast({
              variant: "error",
              message: `${result.error}${partial}`,
            });
            router.refresh();
          }
        } catch (err) {
          setToast({
            variant: "error",
            message:
              err instanceof Error
                ? err.message
                : "Erreur lors de l'appel serveur",
          });
        } finally {
          setLoading(false);
        }
      })();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5C518] text-[#0A0B0D] rounded-lg text-xs font-bold hover:bg-[#F5C518]/90 transition-all cursor-pointer"
      >
        <Play className="w-3.5 h-3.5" />
        Lancer un run
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-black/60 cursor-default"
            aria-label="Fermer la modale"
            onClick={onClose}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="launch-run-title"
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#111317] border border-[#1F232B] rounded-xl shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div>
              <h2
                id="launch-run-title"
                className="text-sm font-extrabold text-[#E8EAED]"
              >
                Lancer un run de sourcing
              </h2>
              <p className="text-[10px] font-mono text-[#9AA0A6] mt-1 uppercase tracking-wider">
                Sourcing Web · Île-de-France
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-[10px] font-mono text-[#9AA0A6] uppercase tracking-widest">
                Sources à interroger
              </h3>

              <SourceRow
                icon={<Search className="w-4 h-4 text-[#F5C518]" />}
                title="Tavily Web Search"
                description="Recherche sémantique sur le web"
                checked={sources.tavily}
                onChange={(v) => toggleSource("tavily", v)}
                disabled={isBusy}
                badge={
                  !hasTavilyKey ? (
                    <span className="text-[9px] font-mono text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      Non configuré
                    </span>
                  ) : undefined
                }
              />

              <SourceRow
                icon={<FileText className="w-4 h-4 text-[#A78BFA]" />}
                title="BODACC"
                description="Annonces légales officielles IDF · Gratuit"
                checked={sources.bodacc}
                onChange={(v) => toggleSource("bodacc", v)}
                disabled={isBusy}
              />

              <SourceRow
                icon={<Newspaper className="w-4 h-4 text-[#EF4444]" />}
                title="RSS Médias FR"
                description="BFM Business · Le Monde Économie"
                checked={sources.rss}
                onChange={(v) => toggleSource("rss", v)}
                disabled={isBusy}
              />

              <SourceRow
                icon={<Building2 className="w-4 h-4 text-[#5B8DEF]" />}
                title="Pappers"
                description="Données légales enrichies · Crédits requis"
                checked={sources.pappers}
                onChange={(v) => toggleSource("pappers", v)}
                disabled={isBusy || !hasPappersKey}
                badge={
                  !hasPappersKey ? (
                    <Link
                      href="/settings"
                      className="text-[9px] font-mono text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded hover:bg-amber-500/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Non configuré → /settings
                    </Link>
                  ) : undefined
                }
              />
            </section>

            {sources.tavily && (
              <section className="space-y-4 pt-1 border-t border-[#1F232B]">
                <h3 className="text-[10px] font-mono text-[#9AA0A6] uppercase tracking-widest">
                  Requêtes Tavily
                </h3>

                {!hasTavilyKey && (
                  <div className="px-3 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs leading-relaxed">
                    Clé Tavily manquante — cette source sera ignorée. Ajoutez{" "}
                    <code className="font-mono text-[10px]">TAVILY_API_KEY</code>{" "}
                    dans votre configuration.
                  </div>
                )}

                <textarea
                  id="sourcing-queries"
                  value={queriesText}
                  onChange={(e) => setQueriesText(e.target.value)}
                  rows={6}
                  disabled={isBusy}
                  className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs text-[#E8EAED] font-mono leading-relaxed focus:outline-none focus:border-[#5B8DEF] resize-y disabled:opacity-60"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="sourcing-depth"
                      className="block text-[10px] font-mono text-[#9AA0A6] uppercase tracking-widest"
                    >
                      Profondeur
                    </label>
                    <select
                      id="sourcing-depth"
                      value={depth}
                      onChange={(e) =>
                        setDepth(e.target.value as "basic" | "advanced")
                      }
                      disabled={isBusy}
                      className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF] cursor-pointer disabled:opacity-60"
                    >
                      <option value="basic">basic</option>
                      <option value="advanced">advanced</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="sourcing-limit"
                      className="block text-[10px] font-mono text-[#9AA0A6] uppercase tracking-widest"
                    >
                      Limite par requête
                    </label>
                    <input
                      id="sourcing-limit"
                      type="number"
                      min={1}
                      max={20}
                      value={limit}
                      onChange={(e) =>
                        setLimit(
                          Math.min(
                            20,
                            Math.max(1, Number(e.target.value) || 1),
                          ),
                        )
                      }
                      disabled={isBusy}
                      className="w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs font-mono text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF] disabled:opacity-60"
                    />
                  </div>
                </div>
              </section>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="px-4 py-2 text-xs font-semibold text-[#9AA0A6] hover:text-[#E8EAED] cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isBusy || activeCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#F5C518] text-[#0A0B0D] rounded-lg hover:bg-[#F5C518]/90 disabled:opacity-60 cursor-pointer"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Lancement…
                  </>
                ) : (
                  `Lancer ${activeCount} source${activeCount > 1 ? "s" : ""}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function SourceRow({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-[#1F232B] bg-[#0A0B0D]/50">
      <div className="flex gap-3 min-w-0">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-[#E8EAED]">{title}</p>
            {badge}
          </div>
          <p className="text-[10px] text-[#9AA0A6] mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <span className="w-9 h-5 bg-[#1F232B] peer-focus:outline-none rounded-full peer peer-checked:bg-[#4ADE80]/30 peer-disabled:opacity-40 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#9AA0A6] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-[#4ADE80]" />
      </label>
    </div>
  );
}
