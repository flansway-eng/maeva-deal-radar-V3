"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DashboardRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      id="refresh-dashboard-btn"
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111317] border border-[#1F232B] rounded-lg text-xs font-semibold text-[#E8EAED] hover:bg-[#16191F] transition-all cursor-pointer active:scale-95 disabled:opacity-60"
    >
      <RefreshCw
        className={`w-3.5 h-3.5 text-[#5B8DEF] ${pending ? "animate-spin" : ""}`}
      />
      <span>Actualiser le desk</span>
    </button>
  );
}
