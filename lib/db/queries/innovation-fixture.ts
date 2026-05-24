export interface FixtureDailyBrief {
  id: string;
  briefDate: string;
  contentMarkdown: string;
  generatedAt: string;
}

export type { SignalFeedItem as FixtureSignalItem } from "@/lib/signals/types";

export interface FixtureCopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface FixtureCopilotConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: FixtureCopilotMessage[];
}

const today = new Date().toISOString().split("T")[0] as string;

export const FIXTURE_DAILY_BRIEFS: FixtureDailyBrief[] = [
  {
    id: "b1000000-0000-0000-0000-000000000001",
    briefDate: today,
    contentMarkdown: `Bonjour Maeva. Aujourd'hui, **5 emails J+0**, **3 relances LinkedIn** et **4 follow-ups** sont planifiés.

**Alerte qualité** : 2 décisions en review queue depuis plus de 5 jours.`,
    generatedAt: new Date().toISOString(),
  },
];

export let FIXTURE_SIGNAL_FEED: import("@/lib/signals/types").SignalFeedItem[] =
  [];

export const FIXTURE_COPILOT_CONVERSATIONS: FixtureCopilotConversation[] = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    title: "Pipeline du jour",
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  },
];

export const FIXTURE_PUSH_SUBSCRIPTIONS: {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}[] = [];

export function upsertFixtureBrief(brief: FixtureDailyBrief): void {
  const idx = FIXTURE_DAILY_BRIEFS.findIndex(
    (b) => b.briefDate === brief.briefDate,
  );
  if (idx >= 0) FIXTURE_DAILY_BRIEFS[idx] = brief;
  else FIXTURE_DAILY_BRIEFS.unshift(brief);
}
