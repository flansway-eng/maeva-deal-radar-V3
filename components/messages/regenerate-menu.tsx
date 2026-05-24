"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import type {
  MessageAngle,
  MessageLength,
  MessageTone,
} from "@/lib/messages/types";

export interface RegenerateOptions {
  tone: MessageTone;
  length: MessageLength;
  angle: MessageAngle;
}

interface RegenerateMenuProps {
  disabled?: boolean;
  loading?: boolean;
  onGenerate: (opts: RegenerateOptions) => void;
}

export function RegenerateMenu({
  disabled,
  loading,
  onGenerate,
}: RegenerateMenuProps) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<MessageTone>("sobre");
  const [length, setLength] = useState<MessageLength>("standard");
  const [angle, setAngle] = useState<MessageAngle>("transaction");

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#F5C518]/90 to-[#5B8DEF]/90 text-[#0A0B0D] rounded-lg hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        Régénérer avec IA
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 p-4 bg-[#16191F] border border-[#1F232B] rounded-xl shadow-xl space-y-3">
            <SelectField
              label="Ton"
              value={tone}
              options={[
                { value: "sobre", label: "Sobre" },
                { value: "direct", label: "Direct" },
                { value: "personnalise", label: "Personnalisé" },
              ]}
              onChange={(v) => setTone(v as MessageTone)}
            />
            <SelectField
              label="Longueur"
              value={length}
              options={[
                { value: "court", label: "Court" },
                { value: "standard", label: "Standard" },
              ]}
              onChange={(v) => setLength(v as MessageLength)}
            />
            <SelectField
              label="Angle"
              value={angle}
              options={[
                { value: "transaction", label: "Transaction" },
                { value: "portefeuille", label: "Portefeuille" },
                { value: "equipe", label: "Équipe" },
              ]}
              onChange={(v) => setAngle(v as MessageAngle)}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setOpen(false);
                onGenerate({ tone, length, angle });
              }}
              className="w-full py-2 text-xs font-bold bg-[#5B8DEF] text-[#0A0B0D] rounded-lg cursor-pointer disabled:opacity-50"
            >
              Lancer la génération
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-mono uppercase text-[#9AA0A6]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs bg-[#0A0B0D] border border-[#1F232B] rounded text-[#E8EAED] cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
