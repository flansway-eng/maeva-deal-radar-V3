import { Activity, AlertCircle, ArrowRight, Clock, Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { DashboardActivity } from "@/components/dashboard/dashboard-activity";
import { DashboardBriefCard } from "@/components/dashboard/dashboard-brief-card";
import { DashboardRefreshButton } from "@/components/dashboard/dashboard-refresh-button";
import { DashboardSignalFeed } from "@/components/dashboard/dashboard-signal-feed";
import { PipelineHealthGauge } from "@/components/dashboard/pipeline-health-gauge";
import { PushEnableButton } from "@/components/pwa/push-enable-button";
import { ResetSuccessToast } from "@/components/settings/reset-success-toast";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/db/queries/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  noStore();

  const { user } = await auth();
  const userName = user?.email?.split("@")[0] || "Maeva";
  const { kpis, brief, signals, events, funnel } = await getDashboardData();

  const kpiTiles = [
    {
      title: "TÂCHES ACTIVES",
      value: String(kpis.activePlanned),
      subtitle: "PLANNED en cours",
      icon: Clock,
      color: "#8899AE",
    },
    {
      title: "TÂCHES DU JOUR",
      value: String(kpis.todayCount),
      subtitle: "À exécuter aujourd'hui",
      icon: Activity,
      color: "#4472AA",
    },
    {
      title: "TÂCHES EN RETARD",
      value: String(kpis.overdueCount),
      subtitle: "planned_date < today",
      icon: AlertCircle,
      color: "#E07070",
    },
    {
      title: "TAUX D'EXÉCUTION",
      value: `${kpis.executionRate7d}%`,
      subtitle: "Fenêtre glissante 7j",
      icon: TrendingUp,
      color: "#4ADE80",
    },
    {
      title: "ARRÊTS DE SOURCES",
      value: String(kpis.stoppedLast30d),
      subtitle: "Derniers 30 jours",
      icon: Flame,
      color: "#C4974C",
    },
  ];

  const base = funnel.discoveries || 1;
  const funnelSteps = [
    { label: "1. Web Discoveries",          count: funnel.discoveries, pct: 100 },
    {
      label: "2. Leads & Shortlist (KEEP)",
      count: funnel.leads,
      pct: Math.round((funnel.leads / base) * 100),
    },
    {
      label: "3. Tasks Planned",
      count: funnel.planned,
      pct: Math.round((funnel.planned / base) * 100),
    },
    {
      label: "4. Tasks Executed (DONE)",
      count: funnel.executed,
      pct: Math.round((funnel.executed / base) * 100),
    },
  ];

  // Next Best Action nudge
  const nudge: { href: string; text: string; color: string } | null = (() => {
    if (kpis.overdueCount > 0)
      return {
        href: "/today",
        text: `${kpis.overdueCount} tâche${kpis.overdueCount > 1 ? "s" : ""} en retard — à traiter maintenant`,
        color: "#E07070",
      };
    if (kpis.todayCount > 0)
      return {
        href: "/today",
        text: `${kpis.todayCount} tâche${kpis.todayCount > 1 ? "s" : ""} planifiée${kpis.todayCount > 1 ? "s" : ""} aujourd'hui`,
        color: "#4ADE80",
      };
    if (kpis.activePlanned === 0)
      return {
        href: "/sourcing",
        text: "Pipeline vide — lancer un run de sourcing",
        color: "#4472AA",
      };
    return null;
  })();

  return (
    <div className="space-y-8 selection:bg-[#C4974C] selection:text-[#07101E] animate-fadeIn">
      {/* — En-tête — */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1A3050] pb-6">
        <div>
          <span className="text-[9px] font-mono text-[#C4974C] uppercase tracking-[0.25em] font-semibold">
            PLATEFORME DE PROSPECTION INSTITUTIONNELLE
          </span>
          <h1
            id="dashboard-title"
            className="font-display text-3xl font-light text-[#EDE8DC] mt-1 tracking-tight"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Bienvenue,{" "}
            <span className="font-semibold text-[#C4974C]">{userName}</span>.
          </h1>
          <p className="text-[11px] text-[#8899AE] mt-1.5 font-mono tracking-wide">
            Synchronisation locale ·{" "}
            {new Date().toLocaleTimeString("fr-FR", {
              timeZone: "Europe/Paris",
            })}{" "}
            (Paris)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PushEnableButton />
          <DashboardRefreshButton />
        </div>
      </div>

      {/* — Next Best Action nudge — */}
      {nudge && (
        <Link
          href={nudge.href}
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-all hover:opacity-90 group"
          style={{
            borderColor: `${nudge.color}25`,
            backgroundColor: `${nudge.color}06`,
          }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
              style={{ backgroundColor: nudge.color }}
            />
            <span className="text-[11px] font-semibold tracking-wide" style={{ color: nudge.color }}>
              Action prioritaire
            </span>
            <span className="text-[11px] text-[#8899AE]">—</span>
            <span className="text-[11px] text-[#EDE8DC]">{nudge.text}</span>
          </div>
          <ArrowRight
            className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
            style={{ color: nudge.color }}
          />
        </Link>
      )}

      {/* — KPI Tiles — */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiTiles.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-[#0C1A2E] border border-[#1A3050] rounded-lg p-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-[#C4974C]/30 hover:-translate-y-0.5 group"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[1px] opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: kpi.color }}
              />
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-mono tracking-[0.2em] text-[#8899AE] uppercase">
                  {kpi.title}
                </span>
                <Icon className="w-3 h-3" style={{ color: kpi.color }} />
              </div>
              <div className="mt-3">
                <span
                  className="text-2xl font-bold text-[#EDE8DC] tracking-tight"
                  style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                >
                  {kpi.value}
                </span>
                <span className="block text-[9px] text-[#8899AE] mt-1 font-mono tracking-wide">
                  {kpi.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* — Pipeline + Health Gauge + Brief — */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Funnel */}
        <div className="lg:col-span-2 bg-[#0C1A2E] border border-[#1A3050] rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1A3050] pb-4 mb-6">
            <h2 className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#EDE8DC] uppercase">
              PIPELINE FUNNEL — PARIS / IDF
            </h2>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-[#C4974C]/10 text-[#C4974C] border border-[#C4974C]/20 tracking-wider">
                PE TRACK
              </span>
              <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-[#4472AA]/10 text-[#4472AA] border border-[#4472AA]/20 tracking-wider">
                MA TRACK
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {funnelSteps.map((step) => (
              <div key={step.label} className="relative">
                <div className="flex justify-between text-[10px] font-mono text-[#8899AE] mb-1.5 px-0.5">
                  <span>{step.label}</span>
                  <span className="font-bold text-[#EDE8DC]">{step.count}</span>
                </div>
                <div className="h-3 bg-[#07101E] rounded border border-[#1A3050] overflow-hidden">
                  <div
                    className="h-full opacity-75"
                    style={{
                      width: `${step.pct}%`,
                      background: "linear-gradient(to right, #C4974C, #4472AA)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <PipelineHealthGauge
          executionRate={kpis.executionRate7d}
          overdueCount={kpis.overdueCount}
          activePlanned={kpis.activePlanned}
        />
        <DashboardBriefCard brief={brief} userName={userName} />
      </div>

      {/* — Signal Feed + Activity — */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSignalFeed signals={signals} />
        <DashboardActivity events={events} />
      </div>

      <ResetSuccessToast />
    </div>
  );
}
