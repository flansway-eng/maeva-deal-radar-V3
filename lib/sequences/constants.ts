import type { TaskChannel, TaskStep } from "@/lib/db/queries/seed-fixture";

export interface SequenceStepDefinition {
  stepCode: TaskStep;
  offsetDays: number;
  channel: TaskChannel;
  label: string;
}

export const SEQUENCE_STEPS: SequenceStepDefinition[] = [
  {
    stepCode: "STEP_0_EMAIL",
    offsetDays: 0,
    channel: "EMAIL",
    label: "premier contact",
  },
  {
    stepCode: "STEP_1_LINKEDIN",
    offsetDays: 3,
    channel: "LINKEDIN",
    label: "message LinkedIn",
  },
  {
    stepCode: "STEP_2_FOLLOWUP_1_EMAIL",
    offsetDays: 7,
    channel: "EMAIL",
    label: "relance 1",
  },
  {
    stepCode: "STEP_3_FOLLOWUP_2_EMAIL",
    offsetDays: 14,
    channel: "EMAIL",
    label: "relance 2",
  },
];

export function sequenceUidFor(leadId: string, stepCode: TaskStep): string {
  return `${leadId}_${stepCode}`;
}
