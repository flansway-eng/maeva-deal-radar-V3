"use client";

import { Loader2, RefreshCw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { autoNormalize } from "@/app/(app)/governance/_actions/auto-normalize";
import { upsertAlias } from "@/app/(app)/governance/_actions/upsert-alias";
import type { FixtureCompanyAlias } from "@/lib/db/queries/governance";

interface NormalizeClientProps {
  aliases: FixtureCompanyAlias[];
}

export function NormalizeClient({ aliases: initial }: NormalizeClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, FixtureCompanyAlias>>(
    () => Object.fromEntries(initial.map((a) => [a.id, { ...a }])),
  );
  const [newRow, setNewRow] = useState({
    domain: "",
    canonicalName: "",
    track: "" as "" | "PE" | "MA",
    notes: "",
  });

  const rows = Object.values(editing);

  const runAutoNormalize = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await autoNormalize();
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      setMessage(
        `${result.normalized ?? 0} tâche(s) normalisée(s). Vérifiez le journal.`,
      );
      router.refresh();
    });
  };

  const saveRow = (row: FixtureCompanyAlias) => {
    setError(null);
    startTransition(async () => {
      const result = await upsertAlias({
        id: row.id.startsWith("a100") ? undefined : row.id,
        domain: row.domain,
        canonicalName: row.canonicalName,
        track: row.track,
        notes: row.notes,
      });
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      setMessage(`Alias ${row.domain} enregistré`);
      router.refresh();
    });
  };

  const addAlias = () => {
    if (!newRow.domain.trim() || !newRow.canonicalName.trim()) {
      setError("Domaine et nom requis");
      return;
    }
    startTransition(async () => {
      const result = await upsertAlias({
        domain: newRow.domain,
        canonicalName: newRow.canonicalName,
        track: newRow.track || null,
        notes: newRow.notes || null,
      });
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      setNewRow({ domain: "", canonicalName: "", track: "", notes: "" });
      setMessage("Nouvel alias créé");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={runAutoNormalize}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#5B8DEF] text-[#0A0B0D] rounded-lg hover:bg-[#5B8DEF]/90 disabled:opacity-50 cursor-pointer"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Auto-normalize
        </button>
        <p className="text-[10px] font-mono text-[#9AA0A6]">
          Parcourt les tâches PLANNED/POSTPONED et applique les alias domaine →
          nom canonique.
        </p>
      </div>

      {message && (
        <p className="text-xs text-[#4ADE80] font-mono px-3 py-2 bg-[#4ADE80]/10 rounded-lg border border-[#4ADE80]/20">
          {message}
        </p>
      )}
      {error && (
        <p className="text-xs text-[#F87171] font-mono px-3 py-2 bg-[#F87171]/10 rounded-lg border border-[#F87171]/20">
          {error}
        </p>
      )}

      <div className="bg-[#111317] border border-[#1F232B] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_80px_1fr_40px] gap-3 px-4 py-2.5 bg-[#0A0B0D] border-b border-[#1F232B] text-[10px] font-mono uppercase tracking-wider text-[#9AA0A6]">
          <span>Domaine</span>
          <span>Nom canonique</span>
          <span>Track</span>
          <span>Notes</span>
          <span />
        </div>
        <div className="divide-y divide-[#1F232B] max-h-[400px] overflow-y-auto">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_1fr_80px_1fr_40px] gap-3 px-4 py-2 items-center"
            >
              <input
                value={row.domain}
                onChange={(e) =>
                  setEditing((ed) => ({
                    ...ed,
                    [row.id]: { ...row, domain: e.target.value },
                  }))
                }
                className="px-2 py-1 text-xs font-mono bg-[#0A0B0D] border border-[#1F232B] rounded text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF]"
              />
              <input
                value={row.canonicalName}
                onChange={(e) =>
                  setEditing((ed) => ({
                    ...ed,
                    [row.id]: { ...row, canonicalName: e.target.value },
                  }))
                }
                className="px-2 py-1 text-xs bg-[#0A0B0D] border border-[#1F232B] rounded text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF]"
              />
              <select
                value={row.track ?? ""}
                onChange={(e) =>
                  setEditing((ed) => ({
                    ...ed,
                    [row.id]: {
                      ...row,
                      track: (e.target.value || null) as "PE" | "MA" | null,
                    },
                  }))
                }
                className="px-2 py-1 text-[10px] bg-[#0A0B0D] border border-[#1F232B] rounded text-[#E8EAED] cursor-pointer"
              >
                <option value="">—</option>
                <option value="PE">PE</option>
                <option value="MA">MA</option>
              </select>
              <input
                value={row.notes ?? ""}
                onChange={(e) =>
                  setEditing((ed) => ({
                    ...ed,
                    [row.id]: { ...row, notes: e.target.value || null },
                  }))
                }
                className="w-24 px-2 py-1 text-[10px] bg-[#0A0B0D] border border-[#1F232B] rounded text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF]"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => saveRow(row)}
                className="p-1.5 text-[#9AA0A6] hover:text-[#5B8DEF] cursor-pointer disabled:opacity-50"
                aria-label="Enregistrer"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#111317] border border-[#1F232B] rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-[#E8EAED]">Ajouter un alias</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            placeholder="domaine.com"
            value={newRow.domain}
            onChange={(e) =>
              setNewRow((r) => ({ ...r, domain: e.target.value }))
            }
            className="px-3 py-2 text-xs font-mono bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF]"
          />
          <input
            placeholder="Nom canonique"
            value={newRow.canonicalName}
            onChange={(e) =>
              setNewRow((r) => ({ ...r, canonicalName: e.target.value }))
            }
            className="px-3 py-2 text-xs bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-[#E8EAED] focus:outline-none focus:border-[#5B8DEF]"
          />
          <select
            value={newRow.track}
            onChange={(e) =>
              setNewRow((r) => ({
                ...r,
                track: e.target.value as "" | "PE" | "MA",
              }))
            }
            className="px-3 py-2 text-xs bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-[#E8EAED] cursor-pointer"
          >
            <option value="">Track</option>
            <option value="PE">PE</option>
            <option value="MA">MA</option>
          </select>
          <button
            type="button"
            disabled={pending}
            onClick={addAlias}
            className="px-4 py-2 text-xs font-bold bg-[#F5C518] text-[#0A0B0D] rounded-lg cursor-pointer disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
