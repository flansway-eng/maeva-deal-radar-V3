import { Activity, AlertCircle, Clock, Flame, TrendingUp } from "lucide-react";
import { DashboardActivity } from "@/components/dashboard/dashboard-activity";
import { DashboardBriefCard } from "@/components/dashboard/dashboard-brief-card";
import { DashboardRefreshButton } from "@/components/dashboard/dashboard-refresh-button";
import { DashboardSignalFeed } from "@/components/dashboard/dashboard-signal-feed";
import { PushEnableButton } from "@/components/pwa/push-enable-button";
import { ResetSuccessToast } from "@/components/settings/reset-success-toast";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/db/queries/dashboard";

export default async function DashboardPage() {
  const { user } = await auth();
  const userName = user?.email?.split("@")[0] || "Maeva";
  const { kpis, brief, signals, events, funnel } = await getDashboardData();

  const kpiTiles = [
    {
      title: "TÂCHES ACTIVES",
      value: String(kpis.activePlanned),
      subtitle: "PLANNED en cours",
      icon: Clock,
      color: "#9AA0A6",
    },
    {
      title: "TÂCHES DU JOUR",
      value: String(kpis.todayCount),
      subtitle: "À exécuter aujourd'hui",
      icon: Activity,
      color: "#5B8DEF",
    },
    {
      title: "TÂCHES EN RETARD",
      value: String(kpis.overdueCount),
      subtitle: "planned_date < today",
      icon: AlertCircle,
      color: "#F87171",
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
      color: "#FBBF24",
    },
  ];

  const funnelSteps = [
    { label: "1. Web Discoveries", count: funnel.discoveries, pct: 100 },
    {
      label: "2. Leads & Shortlist (KEEP)",
      count: funnel.leads,
      pct: Math.round((funnel.leads / funnel.discoveries) * 100),
    },
    {
      label: "3. Tasks Planned",
      count: funnel.planned,
      pct: Math.round((funnel.planned / funnel.discoveries) * 100),
    },
    {
      label: "4. Tasks Executed (DONE)",
      count: funnel.executed,
      pct: Math.round((funnel.executed / funnel.discoveries) * 100),
    },
  ];

  return (
    <div className="space-y-8 selection:bg-[#F5C518] selection:text-black animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F232B] pb-6">
        <div>
          <span className="text-[10px] font-mono text-[#F5C518] uppercase tracking-widest font-bold">
            PLATEFORME DE PROSPECTION SÉCURISÉE
          </span>
          <h1
            id="dashboard-title"
            className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-1 font-sans"
          >
            Bienvenue dans votre Radar Room,{" "}
            <span className="text-[#F5C518]">{userName}</span>.
          </h1>
          <p className="text-xs text-[#9AA0A6] mt-1">
            Dernière synchronisation locale à{" "}
            {new Date().toLocaleTimeString("fr-FR", {
              timeZone: "Europe/Paris",
            })}{" "}
            (Europe/Paris).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PushEnableButton />
          <DashboardRefreshButton />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiTiles.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-[#111317] border border-[#1F232B] rounded-xl p-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-[#16191F] hover:-translate-y-0.5 group"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: kpi.color }}
              />
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-mono tracking-wider text-[#9AA0A6] uppercase">
                  {kpi.title}
                </span>
                <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-[#E8EAED] tracking-tight">
                  {kpi.value}
                </span>
                <span className="block text-[10px] text-[#9AA0A6] mt-1 font-mono">
                  {kpi.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111317] border border-[#1F232B] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#1F232B] pb-4 mb-6">
            <h2 className="text-xs font-mono font-bold tracking-wider text-[#E8EAED] uppercase">
              PIPELINE FUNNEL — PARIS / IDF
            </h2>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/20">
                PE TRACK
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#5B8DEF]/10 text-[#5B8DEF] border border-[#5B8DEF]/20">
                MA TRACK
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {funnelSteps.map((step) => (
              <div key={step.label} className="relative">
                <div className="flex justify-between text-xs font-mono text-[#9AA0A6] mb-1 px-1">
                  <span>{step.label}</span>
                  <span className="font-bold text-[#E8EAED]">{step.count}</span>
                </div>
                <div className="h-4 bg-[#0A0B0D] rounded border border-[#1F232B] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#F5C518] to-[#5B8DEF] opacity-80"
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <DashboardBriefCard brief={brief} userName={userName} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSignalFeed signals={signals} />
        <DashboardActivity events={events} />
      </div>

      <ResetSuccessToast />
    </div>
  );
}
