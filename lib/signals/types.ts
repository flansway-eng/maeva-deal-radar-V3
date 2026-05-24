import type { SignalSource, SignalType } from "@/lib/db/schema";

export interface SignalFeedItem {
  id: string;
  title: string;
  sourceUrl: string;
  snippet: string | null;
  source: SignalSource;
  signalType: SignalType | null;
  tags: string[];
  companyName: string | null;
  relevanceScore: string | null;
  publishedAt: string;
}

/** @deprecated Utiliser SignalFeedItem */
export type FixtureSignalItem = SignalFeedItem;
