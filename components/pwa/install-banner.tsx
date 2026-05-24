"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 bg-[#111317] border border-[#F5C518]/30 rounded-xl p-4 shadow-2xl flex items-start gap-3">
      <Download className="w-5 h-5 text-[#F5C518] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#E8EAED]">Installer Deal Radar</p>
        <p className="text-[10px] text-[#9AA0A6] mt-0.5">
          Accédez à votre file du jour hors ligne en PWA.
        </p>
        <button
          type="button"
          onClick={install}
          className="mt-2 px-3 py-1.5 text-[10px] font-bold bg-[#F5C518] text-[#0A0B0D] rounded-md cursor-pointer"
        >
          Installer
        </button>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-[#9AA0A6] hover:text-[#E8EAED] cursor-pointer"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
