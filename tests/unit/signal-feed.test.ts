import { afterEach, describe, expect, it, vi } from "vitest";
import { tavilySearch } from "@/lib/tavily/search";

describe("Signal Feed — Tavily", () => {
  const originalKey = process.env.TAVILY_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.TAVILY_API_KEY;
    } else {
      process.env.TAVILY_API_KEY = originalKey;
    }
    vi.unstubAllGlobals();
  });

  it("refuse les mocks quand allowMock est false sans clé API", async () => {
    delete process.env.TAVILY_API_KEY;
    const result = await tavilySearch({
      query: "private equity France",
      topic: "news",
      allowMock: false,
    });
    expect(result).toEqual({ error: "TAVILY_API_KEY manquant" });
  });
});
