"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { resetAllData } from "@/app/(app)/settings/_actions/reset-all-data";
import { ToastBanner, type ToastState } from "@/components/shared/toast-banner";

const CONFIRM_TEXT = "RESET";

export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState | null>(null);

  const canConfirm = confirmValue === CONFIRM_TEXT && !pending;

  const close = () => {
    if (!pending) {
      setOpen(false);
      setConfirmValue("");
    }
  };

  const handleReset = () => {
    if (!canConfirm) return;

    startTransition(async () => {
      const result = await resetAllData({ confirmation: CONFIRM_TEXT });
      if (result && !result.ok) {
        setToast({
          variant: "error",
          message: result.error,
        });
      }
    });
  };

  return (
    <>
      <section className="rounded-xl border border-[#F87171]/30 bg-[#F87171]/5 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#F87171] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-extrabold text-[#E8EAED]">
              Zone dangereuse
            </h2>
            <p className="text-xs text-[#9AA0A6] mt-1 leading-relaxed">
              Supprime définitivement tâches, leads, sourcing et journal
              d&apos;événements. Les alias société et la configuration ne sont
              pas touchés.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-lg text-xs font-bold font-mono border border-[#F87171]/40 text-[#F87171] bg-[#F87171]/10 hover:bg-[#F87171]/20 transition-colors cursor-pointer"
        >
          Vider toutes les données
        </button>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 cursor-default"
            aria-label="Fermer"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            className="relative z-10 w-full max-w-md rounded-xl border border-[#F87171]/30 bg-[#111317] p-6 shadow-2xl animate-fadeIn"
          >
            <h3
              id="reset-dialog-title"
              className="text-base font-extrabold text-[#E8EAED]"
            >
              Vider toutes les données ?
            </h3>
            <p className="mt-2 text-xs text-[#9AA0A6] leading-relaxed">
              Cette action est irréversible. Toutes les tâches, leads, runs de
              sourcing et événements seront supprimés.
            </p>

            <label className="block mt-4">
              <span className="text-[10px] font-mono uppercase text-[#9AA0A6]">
                Tapez {CONFIRM_TEXT} pour confirmer
              </span>
              <input
                type="text"
                value={confirmValue}
                onChange={(e) => setConfirmValue(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="mt-1.5 w-full px-3 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-sm font-mono text-[#E8EAED] focus:outline-none focus:border-[#F87171]/50"
                placeholder={CONFIRM_TEXT}
              />
            </label>

            <div className="mt-6 flex gap-2 justify-end">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="px-4 py-2 text-xs font-bold text-[#9AA0A6] hover:text-[#E8EAED] cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={!canConfirm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-mono border border-[#F87171]/40 text-[#F87171] bg-[#F87171]/10 hover:bg-[#F87171]/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
