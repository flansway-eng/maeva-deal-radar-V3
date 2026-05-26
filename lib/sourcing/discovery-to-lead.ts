import { extractDomain } from "@/lib/governance/domain";

export const BLOCKED_MEDIA_DOMAINS = [
  "wikipedia.org",
  "linkedin.com",
  "glassdoor.com",
  "trainy.co",
  "alumneye.fr",
  "efinancialcareers.com",
  "mergersandinquisitions.com",
] as const;

export type DiscoveryPageTypeFilter =
  | "fund_page"
  | "portfolio"
  | "news"
  | "other";

const KNOWN_NAME_SUFFIXES = [
  "partners",
  "capital",
  "private",
  "equity",
  "group",
  "advisors",
  "advisory",
  "investments",
  "management",
  "banking",
  "securities",
  "france",
] as const;

export function normalizeDiscoveryDomain(domain: string): string {
  return domain.replace(/^www\./i, "").toLowerCase();
}

export function isBlockedMediaDomain(domain: string): boolean {
  const d = normalizeDiscoveryDomain(domain);
  return BLOCKED_MEDIA_DOMAINS.some(
    (blocked) => d === blocked || d.endsWith(`.${blocked}`),
  );
}

export function normalizePageTypeForFilter(
  pageType: string | null | undefined,
): DiscoveryPageTypeFilter {
  if (
    pageType === "fund_page" ||
    pageType === "portfolio" ||
    pageType === "news"
  ) {
    return pageType;
  }
  return "other";
}

function formatWord(word: string): string {
  const w = word.toLowerCase();
  if (w.length <= 3) return w.toUpperCase();
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/** ikpartners.com → IK Partners (heuristique + alias optionnel). */
export function companyNameFromDomain(
  domain: string,
  aliasByDomain?: Map<string, string>,
): string {
  const normalized = normalizeDiscoveryDomain(domain);
  const alias = aliasByDomain?.get(normalized);
  if (alias) return alias;

  const label = normalized.split(".")[0] ?? normalized;
  if (!label) return domain;

  for (const suffix of KNOWN_NAME_SUFFIXES) {
    if (label.endsWith(suffix) && label.length > suffix.length) {
      const prefix = label.slice(0, -suffix.length);
      return [prefix, suffix].filter(Boolean).map(formatWord).join(" ");
    }
  }

  return label
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)
    .map(formatWord)
    .join(" ");
}

export function detectTrackFromText(
  snippet: string | null | undefined,
  title?: string | null,
  pageType?: string | null,
): "PE" | "MA" {
  const text = `${snippet ?? ""} ${title ?? ""}`.toLowerCase();

  const maScore =
    (/\b(m&a|m\s*&\s*a)\b/.test(text) ? 2 : 0) +
    (/\b(merger|acquisition|investment banking|banque d'affaires|advisory)\b/.test(
      text,
    )
      ? 1
      : 0) +
    (pageType === "news" && /\badvisory\b/.test(text) ? 1 : 0);

  const peScore =
    (/\b(private equity|buyout|lbo|capital investissement)\b/.test(text)
      ? 2
      : 0) +
    (/\b(fund|portfolio|portefeuille|mid-market)\b/.test(text) ? 1 : 0) +
    (pageType === "fund_page" || pageType === "portfolio" ? 1 : 0);

  if (maScore > peScore) return "MA";
  return "PE";
}

export function leadWebsiteFromDomain(domain: string): string {
  const d = normalizeDiscoveryDomain(domain);
  return `https://${d}`;
}

export function domainFromLeadWebsite(website: string | null): string | null {
  return extractDomain(website);
}
