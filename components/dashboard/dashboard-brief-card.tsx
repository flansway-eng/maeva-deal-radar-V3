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
    <div className="bg-[#111317] border border-[#1F232B] rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F5C518]/5 rounded-full blur-xl" />

      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1F232B] pb-4">
          <Sparkles className="w-4 h-4 text-[#F5C518]" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-[#E8EAED] uppercase">
            DAILY BRIEF AI
          </h2>
          {brief?.generatedAt && (
            <span className="ml-auto text-[9px] font-mono text-[#9AA0A6]">
              {new Date(brief.generatedAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        <div className="text-xs text-[#9AA0A6] space-y-3 leading-relaxed prose prose-invert prose-sm max-w-none [&_strong]:text-[#E8EAED] [&_p]:my-2">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>

      <Link
        id="view-today-file-btn"
        href="/today"
        className="w-full inline-flex items-center justify-center gap-2 mt-6 px-4 py-2 bg-[#0A0B0D] border border-[#1F232B] rounded-lg text-xs font-bold text-[#E8EAED] hover:border-[#F5C518]/40 transition-all"
      >
        <span>Ouvrir la file du jour</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#F5C518]" />
      </Link>
    </div>
  );
}
