import { Mail } from "lucide-react";
import type { TaskChannel, TaskStep } from "@/lib/db/queries/tasks";

const STEP_LABELS: Record<TaskStep, string> = {
  STEP_0_EMAIL: "J+0 — Email",
  STEP_1_LINKEDIN: "J+3 — LinkedIn",
  STEP_2_FOLLOWUP_1_EMAIL: "J+7 — Relance 1",
  STEP_3_FOLLOWUP_2_EMAIL: "J+14 — Relance 2",
};

interface StepLabelProps {
  stepCode: TaskStep;
  channel: TaskChannel;
  showIcon?: boolean;
}

export function StepLabel({
  stepCode,
  channel,
  showIcon = true,
}: StepLabelProps) {
  const label = STEP_LABELS[stepCode];
  const isEmail = channel === "EMAIL";

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#9AA0A6]">
      {showIcon &&
        (isEmail ? (
          <Mail className="w-3 h-3 text-[#5B8DEF]" />
        ) : (
          <LinkedinIcon className="w-3 h-3 text-[#0A66C2]" />
        ))}
      {label}
    </span>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <title>LinkedIn</title>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
