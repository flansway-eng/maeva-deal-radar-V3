import { expect, test } from "vitest";
import * as schema from "../../lib/db/schema";

test("Database schema tables are defined", () => {
  expect(schema.webDiscoveries).toBeDefined();
  expect(schema.sourcingRuns).toBeDefined();
  expect(schema.leads).toBeDefined();
  expect(schema.sequenceTasks).toBeDefined();
  expect(schema.sequenceEvents).toBeDefined();
  expect(schema.reviewDecisions).toBeDefined();
  expect(schema.companyAliases).toBeDefined();
  expect(schema.dailyBriefs).toBeDefined();
  expect(schema.signalFeed).toBeDefined();
  expect(schema.signalFeedItems).toBeDefined();
  expect(schema.copilotConversations).toBeDefined();
  expect(schema.copilotMessages).toBeDefined();
  expect(schema.voiceNotes).toBeDefined();
  expect(schema.pushSubscriptions).toBeDefined();
});
