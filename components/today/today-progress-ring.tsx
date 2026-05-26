"use client";

import { useEffect, useState } from "react";

interface TodayProgressRingProps {
  total: number;
  treated: number;
}

const RADIUS = 15;
const CIRC = 2 * Math.PI * RADIUS;

export function TodayProgressRing({ total, treated }: TodayProgressRingProps) {
  const pct = total > 0 ? treated / total : 0;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);

  const color =
    pct >= 1
      ? "#4ADE80"
      : pct >= 0.5
        ? "#F5C518"
        : pct > 0
          ? "#5B8DEF"
          : "#9AA0A6";

  const offset = CIRC - animated * CIRC;

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#111317] border border-[#1F232B] rounded-xl">
      {/* Ring */}
      <div className="relative w-9 h-9 shrink-0">
        <svg
          viewBox="0 0 38 38"
          className="w-full h-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="19"
            cy="19"
            r={RADIUS}
            fill="none"
            stroke="#1F232B"
            strokeWidth="4"
          />
          <circle
            cx="19"
            cy="19"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.7s cubic-bezier(0.34,1.56,0.64,1), stroke 0.4s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[10px] font-black tabular-nums"
            style={{ color }}
          >
            {treated}
          </span>
        </div>
      </div>

      {/* Label */}
      <div>
        <p className="text-xs font-bold text-[#E8EAED] leading-tight">
          {treated}/{total}{" "}
          <span className="font-normal text-[#9AA0A6]">traités</span>
        </p>
        <p className="text-[10px] font-mono text-[#9AA0A6] mt-0.5">
          {pct >= 1
            ? "Session complète 🎯"
            : `${Math.round(pct * 100)}% de la file`}
        </p>
      </div>
    </div>
  );
}
