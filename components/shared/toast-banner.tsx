"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect } from "react";

export interface ToastState {
  variant: "success" | "error" | "info";
  message: string;
}

interface ToastBannerProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.variant === "error";
  const isInfo = toast.variant === "info";

  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-[100] max-w-sm flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl animate-fadeIn ${
        isError
          ? "bg-[#1a1010] border-[#F87171]/40 text-[#F87171]"
          : isInfo
            ? "bg-[#111317] border-[#5B8DEF]/40 text-[#E8EAED]"
            : "bg-[#111317] border-[#4ADE80]/40 text-[#E8EAED]"
      }`}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      ) : isInfo ? (
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#5B8DEF]" />
      ) : (
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#4ADE80]" />
      )}
      <p className="text-xs leading-relaxed flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-[#9AA0A6] hover:text-[#E8EAED] cursor-pointer"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
