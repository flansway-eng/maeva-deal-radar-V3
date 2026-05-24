"use client";

import { useEffect } from "react";
import { InstallBanner } from "./install-banner";

export function PwaProvider() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration may fail on localhost without HTTPS in some browsers
    });
  }, []);

  return <InstallBanner />;
}
