import type { QualityLintIssue } from "./types";

const FORBIDDEN_WORDS = [
  "urgent",
  "dernier rappel",
  "ne manquez pas",
  "garanti",
  "exclusif",
  "immédiatement",
];

export interface LintInput {
  body: string;
  subject?: string | null;
  companyNameOriginal?: string | null;
  source?: string | null;
}

export function lintMessageQuality(input: LintInput): QualityLintIssue[] {
  const issues: QualityLintIssue[] = [];
  const text = `${input.subject ?? ""}\n${input.body}`.trim();
  const lower = text.toLowerCase();

  if (input.body.length > 800) {
    issues.push({
      id: "length",
      severity: "warning",
      message: `Message long (${input.body.length} caractères) — viser < 800`,
    });
  }

  if (input.source && !mentionsSource(text, input.source)) {
    issues.push({
      id: "source-ref",
      severity: "warning",
      message: "Aucune référence explicite à la source publique",
    });
  }

  if (!lower.includes("île-de-france") && !lower.includes("ile-de-france")) {
    issues.push({
      id: "idf",
      severity: "warning",
      message: "Contexte Île-de-France absent",
    });
  }

  if (input.companyNameOriginal) {
    const escaped = input.companyNameOriginal.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const re = new RegExp(escaped, "i");
    if (re.test(text)) {
      issues.push({
        id: "old-title",
        severity: "error",
        message: `Contient encore l'ancien titre : « ${input.companyNameOriginal} »`,
      });
    }
  }

  for (const word of FORBIDDEN_WORDS) {
    if (lower.includes(word)) {
      issues.push({
        id: `forbidden-${word}`,
        severity: "error",
        message: `Ton trop agressif — mot interdit : « ${word} »`,
      });
    }
  }

  return issues;
}

function mentionsSource(text: string, source: string): boolean {
  const lower = text.toLowerCase();
  if (source.startsWith("http")) {
    try {
      const host = new URL(source).hostname.replace(/^www\./, "");
      if (lower.includes(host)) return true;
    } catch {
      // ignore
    }
  }
  if (lower.includes(source.toLowerCase())) return true;
  if (lower.includes("linkedin")) return true;
  if (lower.includes("pitchbook") || lower.includes("mergermarket")) {
    return true;
  }
  return false;
}
