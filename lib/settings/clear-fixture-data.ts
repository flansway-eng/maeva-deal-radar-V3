import {
  FIXTURE_LEADS,
  FIXTURE_REVIEW_DECISIONS,
} from "@/lib/db/queries/governance-fixture";
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
}
