import {
  FIXTURE_LEADS,
  FIXTURE_REVIEW_DECISIONS,
} from "@/lib/db/queries/governance-fixture";
import {
  FIXTURE_COPILOT_CONVERSATIONS,
  FIXTURE_DAILY_BRIEFS,
  FIXTURE_PUSH_SUBSCRIPTIONS,
  FIXTURE_SIGNAL_FEED,
} from "@/lib/db/queries/innovation-fixture";
import { FIXTURE_EVENTS, FIXTURE_TASKS } from "@/lib/db/queries/seed-fixture";
import {
  FIXTURE_SOURCING_RUNS,
  FIXTURE_WEB_DISCOVERIES,
} from "@/lib/db/queries/sourcing-fixture";

/** Vide les fixtures mémoire alignées sur les tables TRUNCATE du reset. */
export function clearFixtureOperationalData(): void {
  FIXTURE_TASKS.length = 0;
  FIXTURE_EVENTS.length = 0;
  FIXTURE_REVIEW_DECISIONS.length = 0;
  FIXTURE_LEADS.length = 0;
  FIXTURE_SOURCING_RUNS.length = 0;
  FIXTURE_WEB_DISCOVERIES.length = 0;
  FIXTURE_DAILY_BRIEFS.length = 0;
  FIXTURE_SIGNAL_FEED.length = 0;
  FIXTURE_COPILOT_CONVERSATIONS.length = 0;
  FIXTURE_PUSH_SUBSCRIPTIONS.length = 0;
}
