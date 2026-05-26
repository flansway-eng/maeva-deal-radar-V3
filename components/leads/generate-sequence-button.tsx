"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ToastBanner, type ToastState } from "@/components/shared/toast-banner";
import { generateSequence } from "@/lib/actions/leads/generate-sequence";

interface GenerateSequenceButtonProps {
  leadId: string;
  companyName: string;
  variant?: "inline" | "primary";
  className?: string;
}

export function GenerateSequenceButton({
  leadId,
  companyName,
  variant = "inline",
  className = "",
}: GenerateSequenceButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleClick = () => {
    startTransition(async () => {
      const result = await generateSequence(leadId);
      if (!result.ok) {
        setToast({ variant: "error", message: result.error });
        return;
      }
      setToast({
        variant: "success",
        message: `${result.created} tâches créées pour ${result.companyName}`,
      });
      router.refresh();
      router.push("/pipeline");
    });
  };

  const baseClass =
    variant === "primary"
      ? "inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#F5C518] text-[#0A0B0D] rounded-lg cursor-pointer disabled:opacity-50 hover:bg-[#e6b716]"
      : "inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-[#F5C518]/40 text-[#F5C518] rounded-md cursor-pointer disabled:opacity-50 hover:bg-[#F5C518]/10";

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className={`${baseClass} ${className}`}
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            Générer séquence
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
