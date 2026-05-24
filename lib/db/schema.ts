import {
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// 5.0 — Reference to Supabase Auth Users table (auth.users)
export const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey().notNull(),
});

// pgvector — optional (migration 0002)
const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string) {
    return value
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map(Number);
  },
});

export type SignalSource =
  | "BODACC"
  | "RSS_BFM"
  | "RSS_LEMONDE"
  | "PAPPERS"
  | "TAVILY";

export type SignalType =
  | "NOMINATION"
  | "FUSION"
  | "CESSION"
  | "DEAL"
  | "NEWS";

export interface PappersCompanyData {
  siren: string;
  nom_entreprise: string;
  forme_juridique?: string;
  capital?: number;
  chiffre_affaires?: number | null;
  effectif?: string | null;
  siege?: {
    adresse_ligne_1?: string;
    code_postal?: string;
    ville?: string;
  };
  dirigeants?: Array<{
    nom: string;
    prenom: string;
    qualite: string;
    date_prise_de_poste?: string;
  }>;
  derniere_mise_a_jour?: string;
}

export interface LeadQualificationData {
  qualification_score: number;
  synthese: string;
  signaux_positifs: string[];
  signaux_negatifs: string[];
  angle_recommande: string;
  timing: "URGENT" | "NORMAL" | "ATTENDRE";
  timing_raison: string;
}
export interface Signal {
  type: string;
  value: string;
  description?: string;
}

// 5.1 — web_discoveries (sources brutes du sourcing Tavily)
export const webDiscoveries = pgTable(
  "web_discoveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sourceTitle: text("source_title").notNull(),
    sourceUrl: text("source_url").notNull(),
    domain: text("domain").notNull(),
    companyNameRaw: text("company_name_raw"),
    pageType: text("page_type"), // fund_page | team_page | news | portfolio | other
    snippet: text("snippet"),
    extractedText: text("extracted_text"),
    score: numeric("score", { precision: 5, scale: 2 }),
    signals: jsonb("signals").$type<Signal[]>().default([]),
    runId: uuid("run_id").references(() => sourcingRuns.id),
  },
  (t) => [
    index("web_discoveries_domain_idx").on(t.domain),
    uniqueIndex("web_discoveries_url_unique").on(t.sourceUrl),
  ],
);

// 5.2 — sourcing_runs (un run = un déclenchement Tavily)
export const sourcingRuns = pgTable("sourcing_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  triggeredAt: timestamp("triggered_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  triggeredBy: uuid("triggered_by").references(() => authUsers.id),
  queries: jsonb("queries").$type<string[]>().notNull(),
  status: text("status").$type<"RUNNING" | "DONE" | "FAILED">().notNull(),
  resultsCount: integer("results_count").default(0),
  errorMessage: text("error_message"),
});

// 5.3 — leads (issus du lead_builder)
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  discoveryId: uuid("discovery_id").references(() => webDiscoveries.id),
  companyName: text("company_name").notNull(), // normalisé
  companyNameOriginal: text("company_name_original"), // brut avant normalisation
  website: text("website"),
  pageUrl: text("page_url"),
  geography: text("geography").default("Île-de-France"),
  sector: text("sector"), // PE | MA | IB | TS
  track: text("track").$type<"PE" | "MA">().notNull(),
  targetRole: text("target_role"),
  personaName: text("persona_name"),
  personalizationFact: text("personalization_fact"),
  primarySignal: text("primary_signal"),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }),
  reviewStatus: text("review_status")
    .$type<"PENDING" | "KEEP" | "STOP" | "CORRECT">()
    .default("PENDING"),
  siren: text("siren"),
  capitalSocial: integer("capital_social"),
  formeJuridique: text("forme_juridique"),
  pappersData: jsonb("pappers_data").$type<PappersCompanyData>(),
  qualificationData: jsonb("qualification_data").$type<LeadQualificationData>(),
  qualifiedAt: timestamp("qualified_at", { withTimezone: true }),
  embedding: vector1536("embedding"),
});

// 5.4 — sequence_tasks (table centrale du pilotage — équivalent maeva_sequence_tasks)
export const sequenceTasks = pgTable(
  "sequence_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sequenceUid: text("sequence_uid").notNull(), // clé technique unique (anti-collision)
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    leadId: uuid("lead_id").references(() => leads.id),
    company: text("company").notNull(),
    track: text("track").$type<"PE" | "MA">().notNull(),
    contactName: text("contact_name"),
    title: text("title"),
    location: text("location"),
    source: text("source"),
    stepCode: text("step_code")
      .$type<
        | "STEP_0_EMAIL"
        | "STEP_1_LINKEDIN"
        | "STEP_2_FOLLOWUP_1_EMAIL"
        | "STEP_3_FOLLOWUP_2_EMAIL"
      >()
      .notNull(),
    plannedDate: date("planned_date").notNull(),
    channel: text("channel").$type<"EMAIL" | "LINKEDIN">().notNull(),
    messageSubject: text("message_subject"),
    messageBody: text("message_body"),
    status: text("status")
      .$type<"PLANNED" | "DONE" | "POSTPONED" | "CANCELLED" | "STOPPED">()
      .default("PLANNED")
      .notNull(),
    executionNote: text("execution_note"),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    stopReason: text("stop_reason"),
  },
  (t) => [
    uniqueIndex("sequence_tasks_uid_unique").on(t.sequenceUid),
    index("sequence_tasks_status_idx").on(t.status),
    index("sequence_tasks_planned_idx").on(t.plannedDate),
    index("sequence_tasks_company_idx").on(t.company),
  ],
);

// EventType union
export type EventType =
  | "CALENDAR_IMPORTED"
  | "SEQUENCE_STOPPED"
  | "COMPANY_CORRECTED"
  | "COMPANY_NORMALIZED"
  | "MESSAGES_REGENERATED"
  | "TASK_DONE"
  | "TASK_POSTPONED"
  | "TASK_CANCELLED"
  | "REVIEW_DECISION_APPLIED"
  | "AI_DAILY_BRIEF_GENERATED"
  | "SOURCING_RUN_COMPLETED";

// 5.5 — sequence_events (journal — équivalent maeva_sequence_events)
export const sequenceEvents = pgTable(
  "sequence_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    eventType: text("event_type").$type<EventType>().notNull(),
    taskId: uuid("task_id").references(() => sequenceTasks.id),
    actorId: uuid("actor_id").references(() => authUsers.id),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    note: text("note"),
  },
  (t) => [
    index("sequence_events_type_idx").on(t.eventType),
    index("sequence_events_occurred_idx").on(t.occurredAt),
  ],
);

// 5.6 — review_decisions (file de revue humaine)
export const reviewDecisions = pgTable("review_decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  source: text("source").notNull(),
  rawCompany: text("raw_company"),
  decision: text("decision").$type<"KEEP" | "STOP" | "CORRECT">().notNull(),
  correctedCompany: text("corrected_company"),
  reason: text("reason"),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  appliedBy: uuid("applied_by").references(() => authUsers.id),
});

// 5.7 — company_aliases (mapping URL/domain → nom normalisé canonique)
export const companyAliases = pgTable(
  "company_aliases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domain: text("domain").notNull(),
    canonicalName: text("canonical_name").notNull(),
    track: text("track").$type<"PE" | "MA">(),
    notes: text("notes"),
  },
  (t) => [uniqueIndex("company_aliases_domain_unique").on(t.domain)],
);

// Phase 5 — daily_briefs
export const dailyBriefs = pgTable(
  "daily_briefs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    briefDate: date("brief_date").notNull(),
    contentMarkdown: text("content_markdown").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("daily_briefs_date_unique").on(t.briefDate)],
);

// signal_feed — intelligence marché multi-sources (BODACC, RSS, Tavily)
export const signalFeed = pgTable(
  "signal_feed",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    source: text("source").$type<SignalSource>().notNull(),
    sourceUrl: text("source_url"),
    title: text("title").notNull(),
    snippet: text("snippet"),
    companyName: text("company_name"),
    signalType: text("signal_type").$type<SignalType>(),
    relevanceScore: numeric("relevance_score", { precision: 5, scale: 2 }),
    tags: text("tags").array(),
    rawJson: jsonb("raw_json").$type<Record<string, unknown>>(),
    embedding: vector1536("embedding"),
    leadId: uuid("lead_id").references(() => leads.id),
    externalId: text("external_id"),
  },
  (t) => [
    index("signal_feed_published_idx").on(t.publishedAt),
    index("signal_feed_source_idx").on(t.source),
    index("signal_feed_company_idx").on(t.companyName),
    uniqueIndex("signal_feed_source_url_unique").on(t.sourceUrl),
    uniqueIndex("signal_feed_external_id_unique").on(t.externalId),
  ],
);

// Legacy — conservé pour compat migration ; ne plus alimenter
export const signalFeedItems = pgTable(
  "signal_feed_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    title: text("title").notNull(),
    sourceUrl: text("source_url"),
    snippet: text("snippet"),
    category: text("category").$type<"PE" | "MA" | "MARKET">(),
    score: numeric("score", { precision: 5, scale: 2 }),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("signal_feed_published_idx").on(t.publishedAt)],
);

// Phase 5 — copilot
export const copilotConversations = pgTable("copilot_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  title: text("title").notNull(),
});

export const copilotMessages = pgTable(
  "copilot_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .references(() => copilotConversations.id)
      .notNull(),
    role: text("role").$type<"user" | "assistant" | "system">().notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("copilot_messages_conv_idx").on(t.conversationId)],
);

// Phase 5 — voice_notes
export const voiceNotes = pgTable("voice_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => sequenceTasks.id),
  transcript: text("transcript").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Phase 5 — push_subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  endpoint: text("endpoint").notNull(),
  keys: jsonb("keys").$type<{ p256dh: string; auth: string }>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
