import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { DangerZone } from "@/components/settings/danger-zone";
import { getUser } from "@/lib/auth/get-user";

export const metadata: Metadata = {
  title: "Paramètres — Maeva Deal Radar Room",
  description: "Profil, intégrations et préférences.",
};

export default async function SettingsPage() {
  const user = await getUser();

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-fadeIn">
      <div className="border-b border-[#1F232B] pb-5">
        <span className="text-[10px] font-mono text-[#9AA0A6] uppercase tracking-widest font-bold">
          CONFIGURATION
        </span>
        <h1
          id="settings-title"
          className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-1 flex items-center gap-2"
        >
          <Settings className="w-6 h-6 text-[#9AA0A6]" />
          Paramètres
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1">
          Connecté en tant que {user.email ?? "Maeva"}
        </p>
      </div>

      <DangerZone />
    </div>
  );
}
