export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchOptions {
  query: string;
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  /** Tavily topic — utiliser "news" pour le Signal Feed */
  topic?: "general" | "news";
  /** Si false et pas de clé API : erreur explicite, jamais de résultats fictifs */
  allowMock?: boolean;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function mockResults(query: string, limit: number): TavilySearchResult[] {
  const base = [
    {
      title: `Fonds mid-market — ${query}`,
      url: "https://www.eurazeo.com/fr/investissements",
      content: "Eurazeo PME — Paris, croissance mid-cap Île-de-France.",
      score: 0.91,
    },
    {
      title: "Équipe Private Equity — Paris",
      url: "https://www.ardian.com/our-firm/team",
      content: "Ardian — équipe buyout Europe.",
      score: 0.88,
    },
    {
      title: "Portfolio companies",
      url: "https://www.apax.com/partnerships",
      content: "Apax Partners — portefeuille tech services.",
      score: 0.85,
    },
    {
      title: "M&A advisory France",
      url: "https://www.rothschildandco.com/en/ma",
      content: "Rothschild & Co — conseil M&A mid-cap.",
      score: 0.84,
    },
    {
      title: "Growth capital IDF",
      url: "https://www.tikehaucapital.com",
      content: "Tikehau — crédit et private debt Paris.",
      score: 0.8,
    },
  ];
  return base.slice(0, limit).map((r, i) => ({
    ...r,
    title: `${r.title} [${query.slice(0, 24)}${i > 0 ? ` #${i + 1}` : ""}]`,
    score: r.score - i * 0.02,
  }));
}

export type TavilySearchResponse =
  | { results: TavilySearchResult[] }
  | { error: string };

export async function tavilySearch(
  options: TavilySearchOptions,
): Promise<TavilySearchResponse> {
  const limit = options.maxResults ?? 5;
  const apiKey = process.env.TAVILY_API_KEY?.trim();

  if (!apiKey) {
    if (options.allowMock === false) {
      return { error: "TAVILY_API_KEY manquant" };
    }
    return { results: mockResults(options.query, limit) };
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: options.query,
        max_results: limit,
        search_depth: options.searchDepth ?? "basic",
        ...(options.topic ? { topic: options.topic } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        error: `Tavily HTTP ${res.status}${body ? ` — ${body.slice(0, 120)}` : ""}`,
      };
    }

    const data = (await res.json()) as {
      results?: {
        title: string;
        url: string;
        content: string;
        score?: number;
      }[];
      error?: string;
    };

    if (data.error) {
      return { error: data.error };
    }

    return {
      results: (data.results ?? []).map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score ?? 0.5,
      })),
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Connexion Tavily impossible",
    };
  }
}

export { extractDomain };
