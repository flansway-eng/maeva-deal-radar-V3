"use client";

import { Loader2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { qualifyLeadAction } from "@/lib/actions/leads/qualify-lead";
import type { LeadQualificationData } from "@/lib/db/schema";

interface LeadQualifyPanelProps {
  leadId: string;
  initial?: LeadQualificationData | null;
}

const timingStyles = {
  URGENT: "bg-[#F87171]/15 text-[#F87171] border-[#F87171]/40",
  NORMAL: "bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/40",
  ATTENDRE: "bg-[#9AA0A6]/15 text-[#9AA0A6] border-[#9AA0A6]/40",
};

export function LeadQualifyPanel({ leadId, initial }: LeadQualifyPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState(initial ?? null);
  const [error, setError] = useState<string | null>(null);

  const qualify = () => {
    setError(null);
    startTransition(async () => {
      const result = await qualifyLeadAction(leadId);
      if (result.ok) {
        setData(result.data);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const scorePct = data ? Math.round(data.qualification_score * 100) : 0;

  return (
    <section className="bg-[#111317] border border-[#1F232B] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-[#E8EAED] flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#F5C518]" />
          Qualification IA
        </h2>
        <button
          type="button"
          onClick={qualify}
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold border border-[#F5C518]/40 text-[#F5C518] rounded-md cursor-pointer disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            "⚡ Qualifier ce lead"
          )}
        </button>
      </div>

      {error && <p className="text-xs text-[#F87171]">{error}</p>}

      {data && (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[10px] font-mono text-[#9AA0A6] mb-1">
              <span>Score de qualification</span>
              <span>{scorePct}%</span>
            </div>
            <div className="h-2 bg-[#0A0B0D] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5B8DEF] to-[#4ADE80] transition-all"
                style={{ width: `${scorePct}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-[#E8EAED] leading-relaxed">
            {data.synthese}
          </p>

          {data.signaux_positifs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.signaux_positifs.map((s) => (
                <span
                  key={s}
                  className="text-[9px] font-mono px-2 py-0.5 rounded border border-[#4ADE80]/30 text-[#4ADE80]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {data.signaux_negatifs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.signaux_negatifs.map((s) => (
                <span
                  key={s}
                  className="text-[9px] font-mono px-2 py-0.5 rounded border border-[#FBBF24]/30 text-[#FBBF24]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="p-3 rounded-lg border border-[#5B8DEF]/30 bg-[#5B8DEF]/5 text-xs text-[#E8EAED]">
            {data.angle_recommande}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${timingStyles[data.timing]}`}
            >
              {data.timing}
            </span>
            <span className="text-[10px] text-[#9AA0A6]">
              {data.timing_raison}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
