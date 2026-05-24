"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enrichLeadAction } from "@/lib/actions/leads/enrich-lead-pappers";
import type { PappersCompanyData } from "@/lib/db/schema";

interface LeadPappersPanelProps {
  leadId: string;
  hasPappersKey: boolean;
  siren?: string | null;
  capitalSocial?: number | null;
  formeJuridique?: string | null;
  pappersData?: PappersCompanyData | null;
}

export function LeadPappersPanel({
  leadId,
  hasPappersKey,
  siren,
  capitalSocial,
  formeJuridique,
  pappersData,
}: LeadPappersPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState(pappersData);
  const [localSiren, setLocalSiren] = useState(siren);
  const [localCapital, setLocalCapital] = useState(capitalSocial);
  const [localForme, setLocalForme] = useState(formeJuridique);

  if (!hasPappersKey) {
    return (
      <div className="rounded-xl border border-[#FBBF24]/30 bg-[#FBBF24]/5 p-4">
        <p className="text-xs text-[#FBBF24]">
          Enrichissement Pappers non disponible — vérifiez votre clé API
          (PAPPERS_API_KEY).
        </p>
      </div>
    );
  }

  const enrich = () => {
    startTransition(async () => {
      const result = await enrichLeadAction(leadId);
      if (result.ok) {
        setData(result.data);
        setLocalSiren(result.data.siren);
        setLocalCapital(result.data.capital ?? null);
        setLocalForme(result.data.forme_juridique ?? null);
        router.refresh();
      }
    });
  };

  return (
    <section className="bg-[#111317] border border-[#1F232B] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-[#E8EAED]">
          Données légales (Pappers)
        </h2>
        <button
          type="button"
          onClick={enrich}
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold border border-[#5B8DEF]/40 text-[#5B8DEF] rounded-md cursor-pointer disabled:opacity-50"
        >
          {pending && <Loader2 className="w-3 h-3 animate-spin" />}
          Enrichir avec Pappers
        </button>
      </div>

      {data || localSiren ? (
        <>
          <span className="inline-block text-[9px] font-mono text-[#4ADE80] border border-[#4ADE80]/30 px-2 py-0.5 rounded">
            Enrichi via Pappers
          </span>
          {localSiren && (
            <p className="text-sm">
              SIREN{" "}
              <a
                href={`https://www.pappers.fr/entreprise/${localSiren}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5B8DEF] hover:underline inline-flex items-center gap-1"
              >
                {localSiren}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          )}
          {localCapital != null && (
            <p className="text-sm text-[#E8EAED]">
              Capital social : {localCapital.toLocaleString("fr-FR")} €
            </p>
          )}
          {localForme && (
            <p className="text-sm text-[#9AA0A6]">Forme : {localForme}</p>
          )}
          {data?.dirigeants && data.dirigeants.length > 0 && (
            <ul className="space-y-1 text-xs text-[#E8EAED]">
              {data.dirigeants.slice(0, 5).map((d) => (
                <li key={`${d.prenom}-${d.nom}-${d.qualite}`}>
                  {d.prenom} {d.nom} — {d.qualite}
                  {d.date_prise_de_poste
                    ? ` (depuis ${d.date_prise_de_poste})`
                    : ""}
                </li>
              ))}
            </ul>
          )}
          {data?.derniere_mise_a_jour && (
            <p className="text-[10px] font-mono text-[#9AA0A6]">
              Dernière MAJ Pappers : {data.derniere_mise_a_jour}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-[#9AA0A6]">
          Aucune donnée Pappers — cliquez sur Enrichir pour récupérer la fiche
          légale.
        </p>
      )}
    </section>
  );
}
