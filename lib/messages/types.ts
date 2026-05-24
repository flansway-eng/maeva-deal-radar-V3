import type { TaskChannel, TaskStep } from "@/lib/db/queries/tasks";

export type MessageTone = "sobre" | "direct" | "personnalise";
export type MessageLength = "court" | "standard";
export type MessageAngle = "transaction" | "portefeuille" | "equipe";

export interface GenerateMessageInput {
  taskId: string;
  tone: MessageTone;
  length: MessageLength;
  angle: MessageAngle;
}

export interface MessageContext {
  taskId: string;
  company: string;
  companyNameOriginal: string | null;
  track: "PE" | "MA";
  channel: TaskChannel;
  stepCode: TaskStep;
  contactName: string | null;
  title: string | null;
  source: string | null;
  personalizationFact: string | null;
  personaName: string | null;
}

export interface GeneratedMessage {
  subject: string | null;
  body: string;
}

export type LintSeverity = "warning" | "error";

export interface QualityLintIssue {
  id: string;
  severity: LintSeverity;
  message: string;
}
