import type { FixtureTask, TaskChannel, TaskStep } from "./seed-fixture";

const PE_COMPANIES = [
  "Ardian",
  "Eurazeo",
  "Bridgepoint",
  "Apax Partners",
  "Astorg",
  "PAI Partners",
  "CVC Capital",
  "Montagu",
  "Tikehau",
  "Antin",
  "Siparex",
  "UI Investissement",
  "Entrepreneurs & Finance",
  "MBO Partners",
  "LBO France",
];

const MA_COMPANIES = [
  "Rothschild & Co",
  "Lazard",
  "BNP Paribas CIB",
  "JP Morgan M&A",
  "Goldman Sachs",
  "Morgan Stanley",
  "Evercore",
  "Jefferies",
  "Houlihan Lokey",
  "Alantra",
  "DC Advisory",
  "Accuracy",
  "Eight Advisory",
  "Cambon Partners",
  "Clipperton",
];

const STEPS: TaskStep[] = [
  "STEP_0_EMAIL",
  "STEP_1_LINKEDIN",
  "STEP_2_FOLLOWUP_1_EMAIL",
  "STEP_3_FOLLOWUP_2_EMAIL",
];

const fmt = (d: Date) => d.toISOString().split("T")[0] as string;

function daysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return fmt(d);
}

function stepChannel(step: TaskStep): TaskChannel {
  return step === "STEP_1_LINKEDIN" ? "LINKEDIN" : "EMAIL";
}

/** Génère 100 tâches actives (spec Phase 3 acceptance). */
export function build100FixtureTasks(): FixtureTask[] {
  const tasks: FixtureTask[] = [];
  const companies: { name: string; track: "PE" | "MA" }[] = [];

  for (const name of PE_COMPANIES) companies.push({ name, track: "PE" });
  for (const name of MA_COMPANIES) companies.push({ name, track: "MA" });

  for (let i = 0; i < 100; i++) {
    const n = i + 1;
    const id = `f1000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
    const base = companies[i % companies.length];
    if (!base) continue;

    const step = STEPS[i % STEPS.length] ?? "STEP_0_EMAIL";
    const channel = stepChannel(step);
    const status =
      i % 17 === 0
        ? "DONE"
        : i % 23 === 0
          ? "POSTPONED"
          : i % 29 === 0
            ? "STOPPED"
            : "PLANNED";

    const plannedOffset = (i % 14) - 3;
    const company = base.name;

    tasks.push({
      id,
      sequenceUid: `${company.toLowerCase().replace(/\s+/g, "-")}-${step.toLowerCase()}-${n}`,
      createdAt: daysFromToday(-(10 + (i % 20))),
      leadId: `l1000000-0000-0000-0000-${String((i % 30) + 1).padStart(12, "0")}`,
      company,
      track: base.track,
      contactName: `Contact ${n}`,
      title: base.track === "PE" ? "Investment Director" : "Managing Director",
      location: "Paris",
      source:
        i % 2 === 0
          ? "https://linkedin.com"
          : `https://${company.toLowerCase().replace(/[^a-z]/g, "")}.com`,
      stepCode: step,
      plannedDate: daysFromToday(plannedOffset),
      channel,
      messageSubject:
        channel === "EMAIL"
          ? `Prise de contact — ${company} / Île-de-France`
          : null,
      messageBody: `Bonjour, je me permets de vous contacter au sujet de ${company} et des opportunités mid-market en Île-de-France.`,
      status,
      executionNote: status === "DONE" ? "Exécuté (seed)" : null,
      executedAt: status === "DONE" ? new Date().toISOString() : null,
      stopReason: status === "STOPPED" ? "Seed — séquence arrêtée" : null,
    });
  }

  return tasks;
}
