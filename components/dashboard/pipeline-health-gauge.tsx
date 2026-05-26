"use client";

import { useEffect, useState } from "react";

interface PipelineHealthGaugeProps {
  executionRate: number; // 0-100
  overdueCount: number;
  activePlanned: number;
}

function computeHealth(
  executionRate: number,
  overdueCount: number,
  activePlanned: number,
): number {
  // 50% — taux d'exécution 7 jours
  const execScore = executionRate * 0.5;

  // 35% — ratio de retard (0% si tout est en retard, 35% si aucun)
  const overdueRatio =
    activePlanned > 0 ? overdueCount / activePlanned : 0;
  const overdueScore = Math.max(0, 1 - overdueRatio) * 35;

  // 15% — pipeline actif
  const activityScore = activePlanned > 0 ? 15 : 5;

  return Math.round(Math.min(100, execScore + overdueScore + activityScore));
}

const RADIUS = 36;
const CIRC = 2 * Math.PI * RADIUS;

export function PipelineHealthGauge({
  executionRate,
  overdueCount,
  activePlanned,
}: PipelineHealthGaugeProps) {
  const score = computeHealth(executionRate, overdueCount, activePlanned);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120);
    return () => clearTimeout(t);
  }, [score]);

  // Palette Rothschild pour le score de santé
  const color =
    score >= 70 ? "#4ADE80" : score >= 40 ? "#C4974C" : "#E07070";
  const label =
    score >= 70 ? "Excellent" : score >= 40 ? "Attention" : "Critique";

  const offset = CIRC - (animated / 100) * CIRC;

  return (
    <div className="bg-[#0C1A2E] border border-[#1A3050] rounded-lg p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
      {/* Filet de couleur en haut */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] transition-colors duration-700"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-center justify-between border-b border-[#1A3050] pb-4 mb-4">
        <span className="text-[8px] font-mono tracking-[0.2em] text-[#8899AE] uppercase">
          SANTÉ PIPELINE
        </span>
        <span
          className="text-[8px] font-mono font-bold px-2 py-0.5 rounded border tracking-wider"
          style={{
            color,
            borderColor: `${color}35`,
            backgroundColor: `${color}0A`,
          }}
        >
          {label}
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Jauge circulaire */}
        <div className="relative w-[88px] h-[88px] shrink-0">
          <svg
            viewBox="0 0 96 96"
            className="w-full h-full -rotate-90"
            aria-hidden="true"
          >
            {/* Track */}
            <circle
              cx="48"
              cy="48"
              r={RADIUS}
              fill="none"
              stroke="#1A3050"
              strokeWidth="6"
            />
            {/* Glow subtil */}
            <circle
              cx="48"
              cy="48"
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={CIRC * 0.4}
              opacity="0.08"
            />
            {/* Arc principal */}
            <circle
              cx="48"
              cy="48"
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={offset}
              style={{
                transition:
                  "stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.7s ease",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl font-bold text-[#EDE8DC] leading-none tabular-nums"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              {score}
            </span>
            <span className="text-[8px] font-mono text-[#8899AE] tracking-wider">/100</span>
          </div>
        </div>

        {/* Métriques */}
        <div className="space-y-2.5 min-w-0">
          <Metric
            dot="#4ADE80"
            label={`${executionRate}% exec. 7j`}
          />
          <Metric
            dot={overdueCount > 0 ? "#E07070" : "#4ADE80"}
            label={`${overdueCount} en retard`}
          />
          <Metric
            dot="#4472AA"
            label={`${activePlanned} actives`}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: dot }}
      />
      <span className="text-[10px] font-mono text-[#8899AE] tracking-wide">{label}</span>
    </div>
  );
}
