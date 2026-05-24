"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ToastBanner, type ToastState } from "@/components/shared/toast-banner";

function ResetSuccessToastInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (searchParams.get("reset") !== "success") return;

    setToast({
      variant: "success",
      message: "Base réinitialisée — prête pour un nouveau cycle",
    });
    router.replace("/");
  }, [searchParams, router]);

  return <ToastBanner toast={toast} onDismiss={() => setToast(null)} />;
}

export function ResetSuccessToast() {
  return (
    <Suspense fallback={null}>
      <ResetSuccessToastInner />
    </Suspense>
  );
}
