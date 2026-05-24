"use client";

import { Bell, BellOff } from "lucide-react";
import { useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushEnableButton() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const subscribe = async () => {
    if (!vapidPublic) {
      alert(
        "Définissez NEXT_PUBLIC_VAPID_PUBLIC_KEY pour activer les notifications push.",
      );
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push non supporté sur ce navigateur.");
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublic,
        ) as BufferSource,
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      setEnabled(true);
    } catch {
      // noop — dev without VAPID
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading || enabled}
      onClick={subscribe}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border border-[#1F232B] text-[#9AA0A6] hover:text-[#E8EAED] cursor-pointer disabled:opacity-50"
    >
      {enabled ? (
        <>
          <Bell className="w-3 h-3 text-[#4ADE80]" /> Push actif
        </>
      ) : (
        <>
          <BellOff className="w-3 h-3" /> Activer le brief push
        </>
      )}
    </button>
  );
}
