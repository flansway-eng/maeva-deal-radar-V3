export function extractDomain(source: string | null): string | null {
  if (!source) return null;
  try {
    const url = source.startsWith("http") ? source : `https://${source}`;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
