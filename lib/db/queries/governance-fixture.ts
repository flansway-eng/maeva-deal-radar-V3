export type ReviewDecisionType = "KEEP" | "STOP" | "CORRECT";
export type LeadReviewStatus = "PENDING" | "KEEP" | "STOP" | "CORRECT";

export interface FixtureLead {
  id: string;
  companyName: string;
  companyNameOriginal: string | null;
  website: string | null;
  pageUrl: string | null;
  track: "PE" | "MA";
  targetRole: string | null;
  primarySignal: string | null;
  reviewStatus: LeadReviewStatus;
  confidenceScore: string | null;
  siren?: string | null;
  capitalSocial?: number | null;
  formeJuridique?: string | null;
  pappersData?: import("@/lib/db/schema").PappersCompanyData | null;
  qualificationData?: import("@/lib/db/schema").LeadQualificationData | null;
  qualifiedAt?: string | null;
}

export interface FixtureReviewDecision {
  id: string;
  createdAt: string;
  source: string;
  rawCompany: string | null;
  decision: ReviewDecisionType;
  correctedCompany: string | null;
  reason: string | null;
  appliedAt: string | null;
  leadId: string | null;
}

export interface FixtureCompanyAlias {
  id: string;
  domain: string;
  canonicalName: string;
  track: "PE" | "MA" | null;
  notes: string | null;
}

const PE_DOMAINS: { domain: string; canonical: string }[] = [
  { domain: "ardian.com", canonical: "Ardian" },
  { domain: "eurazeo.com", canonical: "Eurazeo" },
  { domain: "bridgepoint.com", canonical: "Bridgepoint" },
  { domain: "apax.com", canonical: "Apax Partners" },
  { domain: "astorg.com", canonical: "Astorg" },
  { domain: "paipartners.com", canonical: "PAI Partners" },
  { domain: "cvc.com", canonical: "CVC Capital" },
  { domain: "montagu.com", canonical: "Montagu" },
  { domain: "tikehaucapital.com", canonical: "Tikehau" },
  { domain: "antin-ip.com", canonical: "Antin" },
  { domain: "lbofrance.com", canonical: "LBO France" },
  { domain: "ikpartners.com", canonical: "IK Partners" },
  { domain: "capza.co", canonical: "Capza" },
  { domain: "audacia.fr", canonical: "Audacia" },
];

const MA_DOMAINS: { domain: string; canonical: string }[] = [
  { domain: "rothschildandco.com", canonical: "Rothschild & Co" },
  { domain: "lazard.com", canonical: "Lazard" },
  { domain: "bnpparibas.com", canonical: "BNP Paribas CIB" },
  { domain: "jpmorgan.com", canonical: "JP Morgan M&A" },
  { domain: "goldmansachs.com", canonical: "Goldman Sachs" },
  { domain: "morganstanley.com", canonical: "Morgan Stanley" },
  { domain: "evercore.com", canonical: "Evercore" },
  { domain: "jefferies.com", canonical: "Jefferies" },
  { domain: "hl.com", canonical: "Houlihan Lokey" },
  { domain: "alantra.com", canonical: "Alantra" },
];

export const FIXTURE_COMPANY_ALIASES: FixtureCompanyAlias[] = [
  ...PE_DOMAINS.map((d, i) => ({
    id: `a1000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
    domain: d.domain,
    canonicalName: d.canonical,
    track: "PE" as const,
    notes: null,
  })),
  ...MA_DOMAINS.map((d, i) => ({
    id: `a1000000-0000-0000-0001-${String(i + 1).padStart(12, "0")}`,
    domain: d.domain,
    canonicalName: d.canonical,
    track: "MA" as const,
    notes: null,
  })),
];

const PE_SIGNALS = [
  "team expansion",
  "new fund closing",
  "portfolio hire",
  "mid-market push IDF",
];
const PE_ROLES = ["Partner / MD", "Principal", "Director", "Managing Partner"];
const MA_SIGNALS = [
  "M&A advisory hire",
  "sector coverage expansion",
  "Paris team growth",
];
const MA_ROLES = ["Partner / MD", "Executive Director", "VP M&A"];

export const FIXTURE_LEADS: FixtureLead[] = [
  ...PE_DOMAINS.map((d, i) => ({
    id: `l1000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
    companyName: d.canonical,
    companyNameOriginal: `${d.canonical.toUpperCase()} PRIVATE EQUITY`,
    website: `https://${d.domain}`,
    pageUrl: `https://${d.domain}/team`,
    track: "PE" as const,
    targetRole: PE_ROLES[i % PE_ROLES.length] ?? "Partner / MD",
    primarySignal: PE_SIGNALS[i % PE_SIGNALS.length] ?? "team expansion",
    reviewStatus: (i % 4 === 0
      ? "PENDING"
      : i % 4 === 1
        ? "KEEP"
        : "PENDING") as LeadReviewStatus,
    confidenceScore: (0.55 + (i % 5) * 0.08).toFixed(2),
  })),
  ...MA_DOMAINS.map((d, i) => ({
    id: `l1000000-0000-0000-0001-${String(i + 1).padStart(12, "0")}`,
    companyName: d.canonical,
    companyNameOriginal: `${d.canonical.toUpperCase()} M&A`,
    website: `https://${d.domain}`,
    pageUrl: `https://${d.domain}/investment-banking`,
    track: "MA" as const,
    targetRole: MA_ROLES[i % MA_ROLES.length] ?? "Partner / MD",
    primarySignal: MA_SIGNALS[i % MA_SIGNALS.length] ?? "M&A advisory hire",
    reviewStatus: "PENDING" as LeadReviewStatus,
    confidenceScore: (0.5 + (i % 4) * 0.1).toFixed(2),
  })),
];

export function findFixtureLead(id: string): FixtureLead | undefined {
  return FIXTURE_LEADS.find((l) => l.id === id);
}

export function patchFixtureLead(
  id: string,
  patch: Partial<FixtureLead>,
): FixtureLead | null {
  const idx = FIXTURE_LEADS.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  const current = FIXTURE_LEADS[idx];
  if (!current) return null;
  FIXTURE_LEADS[idx] = { ...current, ...patch };
  return FIXTURE_LEADS[idx];
}

const RAW_MISMATCHES = [
  {
    raw: "ARDIAN PRIVATE EQUITY",
    canonical: "Ardian",
    source: "https://ardian.com/investment-team",
  },
  {
    raw: "BRIDGEPOINT EUROPE",
    canonical: "Bridgepoint",
    source: "https://bridgepoint.com/people",
  },
  {
    raw: "APAX PARTNERS FRANCE",
    canonical: "Apax Partners",
    source: "https://apax.com/teams",
  },
  {
    raw: "ROTHSCHILD & CO MA",
    canonical: "Rothschild & Co",
    source: "https://rothschildandco.com/en/financial-advisors",
  },
  {
    raw: "LAZARD FRANCE",
    canonical: "Lazard",
    source: "https://lazard.com/our-firm",
  },
  {
    raw: "BNP PARIBAS CIB M&A",
    canonical: "BNP Paribas CIB",
    source: "https://bnpparibas.com/corporate-finance",
  },
  {
    raw: "ASTORG PARTNERS",
    canonical: "Astorg",
    source: "https://astorg.com/about",
  },
  {
    raw: "PAI PARTNERS SAS",
    canonical: "PAI Partners",
    source: "https://paipartners.com/team",
  },
  {
    raw: "EURAZEO CAPITAL",
    canonical: "Eurazeo",
    source: "https://eurazeo.com/en/about",
  },
  {
    raw: "GOLDMAN SACHS PARIS",
    canonical: "Goldman Sachs",
    source: "https://goldmansachs.com/what-we-do",
  },
  {
    raw: "MORGAN STANLEY IB",
    canonical: "Morgan Stanley",
    source: "https://morganstanley.com/about-us",
  },
  {
    raw: "EVERCORE PARTNERS",
    canonical: "Evercore",
    source: "https://evercore.com/our-firm",
  },
  {
    raw: "TIKEHAU CAPITAL",
    canonical: "Tikehau",
    source: "https://tikehaucapital.com",
  },
  {
    raw: "ANTIN INFRASTRUCTURE",
    canonical: "Antin",
    source: "https://antin-ip.com/team",
  },
  {
    raw: "CVC CAPITAL PARTNERS",
    canonical: "CVC Capital",
    source: "https://cvc.com/portfolio",
  },
];

export const FIXTURE_REVIEW_DECISIONS: FixtureReviewDecision[] =
  RAW_MISMATCHES.map((row, i) => {
    const lead = FIXTURE_LEADS.find(
      (l) =>
        l.companyNameOriginal?.includes(row.raw.split(" ")[0] ?? "") ||
        l.companyName === row.canonical,
    );
    return {
      id: `r1000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
      createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
      source: row.source,
      rawCompany: row.raw,
      decision: "KEEP" as ReviewDecisionType,
      correctedCompany: row.canonical,
      reason: null,
      appliedAt: null,
      leadId: lead?.id ?? null,
    };
  });

export function patchReviewDecision(
  id: string,
  patch: Partial<FixtureReviewDecision>,
): void {
  const idx = FIXTURE_REVIEW_DECISIONS.findIndex((r) => r.id === id);
  if (idx === -1) return;
  const current = FIXTURE_REVIEW_DECISIONS[idx];
  if (!current) return;
  FIXTURE_REVIEW_DECISIONS[idx] = { ...current, ...patch };
}

export function upsertFixtureAlias(
  alias: Omit<FixtureCompanyAlias, "id"> & { id?: string },
): FixtureCompanyAlias {
  const existing = FIXTURE_COMPANY_ALIASES.findIndex(
    (a) => a.domain === alias.domain,
  );
  const row: FixtureCompanyAlias = {
    id:
      alias.id ??
      `a1000000-0000-0000-0002-${String(FIXTURE_COMPANY_ALIASES.length + 1).padStart(12, "0")}`,
    domain: alias.domain,
    canonicalName: alias.canonicalName,
    track: alias.track ?? null,
    notes: alias.notes ?? null,
  };
  if (existing >= 0) {
    FIXTURE_COMPANY_ALIASES[existing] = row;
  } else {
    FIXTURE_COMPANY_ALIASES.push(row);
  }
  return row;
}
