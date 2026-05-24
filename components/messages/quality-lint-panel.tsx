import { AlertCircle, AlertTriangle } from "lucide-react";
import type { QualityLintIssue } from "@/lib/messages/types";

interface QualityLintPanelProps {
  issues: QualityLintIssue[];
}

export function QualityLintPanel({ issues }: QualityLintPanelProps) {
  if (issues.length === 0) {
    return (
      <div className="px-3 py-2 rounded-lg border border-[#4ADE80]/20 bg-[#4ADE80]/5 text-[10px] font-mono text-[#4ADE80]">
        Linter OK — aucun problème détecté
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {issues.map((issue) => (
        <li
          key={issue.id}
          className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-[11px] ${
            issue.severity === "error"
              ? "border-[#F87171]/30 bg-[#F87171]/10 text-[#F87171]"
              : "border-[#FBBF24]/30 bg-[#FBBF24]/10 text-[#FBBF24]"
          }`}
        >
          {issue.severity === "error" ? (
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          )}
          {issue.message}
        </li>
      ))}
    </ul>
  );
}
