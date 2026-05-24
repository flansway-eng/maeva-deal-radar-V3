import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CopilotChat } from "@/components/copilot/copilot-chat";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Maeva Copilot — Deal Radar Room",
  description: "Chat AI sur vos données pipeline avec tool use.",
};

export default async function CopilotPage() {
  const { user } = await auth();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      <div className="border-b border-[#1F232B] pb-5">
        <span className="text-[10px] font-mono text-[#F5C518] uppercase tracking-widest font-bold">
          INNOVATION 2026
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#E8EAED] mt-1">
          Maeva Copilot
        </h1>
        <p className="text-xs text-[#9AA0A6] mt-1">
          Tool use · Streaming markdown · Actions proposées avec confirmation
        </p>
      </div>

      <CopilotChat />
    </div>
  );
}
