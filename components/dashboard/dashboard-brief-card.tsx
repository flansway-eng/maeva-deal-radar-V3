import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { FixtureDailyBrief } from "@/lib/db/queries/innovation-fixture";

interface DashboardBriefCardProps {
  brief: FixtureDailyBrief | null;
  userName: string;
}

export function DashboardBriefCard({
  brief,
  userName,
}: DashboardBriefCardProps) {
  const content =
    brief?.contentMarkdown ??
    `Bonjour **${userName}**. Le brief du jour n'a pas encore été généré — lancez le cron \`/api/cron/daily-brief\` ou attendez 07:00 Paris.`;

  return (
    <div className="bg-[#0C1A2E] border border-[#1A3050] rounded-lg p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C4974C]/04 rounded-full blur-xl" />

      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1A3050] pb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#C4974C]" />
          <h2 className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#EDE8DC] uppercase">
            DAILY BRIEF AI
          </h2>
          {brief?.generatedAt && (
            <span className="ml-auto text-[8px] font-mono text-[#8899AE]">
              {new Date(brief.generatedAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        <div className="text-[11px] text-[#8899AE] space-y-3 leading-relaxed prose prose-invert prose-sm max-w-none [&_strong]:text-[#EDE8DC] [&_p]:my-2">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>

      <Link
        id="view-today-file-btn"
        href="/today"
        className="w-full inline-flex items-center justify-center gap-2 mt-6 px-4 py-2 bg-[#07101E] border border-[#1A3050] rounded text-[11px] font-semibold text-[#EDE8DC] hover:border-[#C4974C]/40 hover:text-[#C4974C] transition-all tracking-wide"
      >
        <span>Ouvrir la file du jour</span>
        <ChevronRight className="w-3 h-3 text-[#C4974C]" />
      </Link>
    </div>
  );
}
