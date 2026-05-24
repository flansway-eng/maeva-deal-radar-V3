import { ClipboardCheck, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";

const CARDS = [
  {
    href: "/governance/review",
    title: "Review Queue",
    description:
      "File de revue humaine — KEEP / STOP / CORRECT avec application batch.",
    icon: ClipboardCheck,
    accent: "text-[#F5C518]",
  },
  {
    href: "/governance/normalize",
    title: "Normalize",
    description:
      "Mapping domaine → nom canonique. Auto-normalize sur les tâches actives.",
    icon: Wand2,
    accent: "text-[#5B8DEF]",
  },
  {
    href: "/governance/quality-audit",
    title: "Quality Audit",
    description:
      "Rapport à la demande : répartition leads, domaines suspects, sources.",
    icon: Sparkles,
    accent: "text-[#4ADE80]",
  },
] as const;

export function GovernanceHub() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.href}
            href={card.href}
            className="group block bg-[#111317] border border-[#1F232B] rounded-xl p-6 hover:border-[#2A2F3A] hover:-translate-y-0.5 transition-all"
          >
            <Icon
              className={`w-8 h-8 mb-4 ${card.accent} group-hover:scale-105 transition-transform`}
            />
            <h2 className="text-sm font-bold text-[#E8EAED] mb-1">
              {card.title}
            </h2>
            <p className="text-xs text-[#9AA0A6] leading-relaxed">
              {card.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
