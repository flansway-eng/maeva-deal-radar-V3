import {
  index,
  integer,
  real,
  pgTable,
  text,
  uniqueIndex,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── Types métier ─────────────────────────────────────────────────────────────

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

// ─── Helpers sérialisation ────────────────────────────────────────────────────
// SQLite ne supporte pas JSONB ni ARRAY nativement.
// Les colonnes JSON sont stockées en TEXT et sérialisées à l'écriture.

// ─── 5.1 — web_discoveries ────────────────────────────────────────────────────
export const webDiscoveries = pgTable(
  "web_discoveries",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    sourceTitle: text("source_title").notNull(),
    sourceUrl: text("source_url").notNull(),
    domain: text("domain").notNull(),
    companyNameRaw: text("company_name_raw"),
    pageType: text("page_type"), // fund_page | team_page | news | portfolio | other
    snippet: text("snippet"),
    extractedText: text("extracted_text"),
    score: real("score"),
    // JSON serialisé : Signal[]
    signals: text("signals").default("[]"),
    runId: text("run_id").references(() => sourcingRuns.id),
  },
  (t) => [
    index("web_discoveries_domain_idx").on(t.domain),
    uniqueIndex("web_discoveries_url_unique").on(t.sourceUrl),
  ],
);

// ─── 5.2 — sourcing_runs ─────────────────────────────────────────────────────
export const sourcingRuns = pgTable("sourcing_runs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  triggeredAt: timestamp("triggered_at")
    .defaultNow()
    .notNull(),
  // triggeredBy: supprimé (référence auth.users Supabase — non disponible en SQLite)
  // JSON serialisé : string[]
  queries: text("queries").notNull(),
  status: text("status").$type<"RUNNING" | "DONE" | "FAILED">().notNull(),
  resultsCount: integer("results_count").default(0),
  errorMessage: text("error_message"),
});

// ─── 5.3 — leads ─────────────────────────────────────────────────────────────
export const leads = pgTable("leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
  discoveryId: text("discovery_id").references(() => webDiscoveries.id),
  companyName: text("company_name").notNull(),
  companyNameOriginal: text("company_name_original"),
  website: text("website"),
  pageUrl: text("page_url"),
  geography: text("geography").default("Île-de-France"),
  sector: text("sector"),
  track: text("track").$type<"PE" | "MA">().notNull(),
  targetRole: text("target_role"),
  personaName: text("persona_name"),
  personalizationFact: text("personalization_fact"),
  primarySignal: text("primary_signal"),
  confidenceScore: real("confidence_score"),
  reviewStatus: text("review_status")
    .$type<"PENDING" | "KEEP" | "STOP" | "CORRECT">()
    .default("PENDING"),
  siren: text("siren"),
  capitalSocial: integer("capital_social"),
  formeJuridique: text("forme_juridique"),
  // JSON serialisé : PappersCompanyData
  pappersData: text("pappers_data"),
  // JSON serialisé : LeadQualificationData
  qualificationData: text("qualification_data"),
  qualifiedAt: timestamp("qualified_at"),
  // embedding : stocké JSON sérialisé (vector(1536) non supporté en SQLite)
  embedding: text("embedding"),
});

// ─── 5.4 — sequence_tasks ────────────────────────────────────────────────────
export const sequenceTasks = pgTable(
  "sequence_tasks",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sequenceUid: text("sequence_uid").notNull(),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    leadId: text("lead_id").references(() => leads.id),
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
    plannedDate: text("planned_date").notNull(), // ISO YYYY-MM-DD
    channel: text("channel").$type<"EMAIL" | "LINKEDIN">().notNull(),
    messageSubject: text("message_subject"),
    messageBody: text("message_body"),
    status: text("status")
      .$type<"PLANNED" | "DONE" | "POSTPONED" | "CANCELLED" | "STOPPED">()
      .default("PLANNED")
      .notNull(),
    executionNote: text("execution_note"),
    executedAt: timestamp("executed_at"),
    stopReason: text("stop_reason"),
  },
  (t) => [
    uniqueIndex("sequence_tasks_uid_unique").on(t.sequenceUid),
    index("sequence_tasks_status_idx").on(t.status),
    index("sequence_tasks_planned_idx").on(t.plannedDate),
    index("sequence_tasks_company_idx").on(t.company),
  ],
);

// ─── EventType union ──────────────────────────────────────────────────────────
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

// ─── 5.5 — sequence_events ────────────────────────────────────────────────────
export const sequenceEvents = pgTable(
  "sequence_events",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    occurredAt: timestamp("occurred_at")
      .defaultNow()
      .notNull(),
    eventType: text("event_type").$type<EventType>().notNull(),
    taskId: text("task_id").references(() => sequenceTasks.id),
    // actorId: supprimé (référence auth.users Supabase)
    // JSON serialisé : Record<string, unknown>
    payload: text("payload"),
    note: text("note"),
  },
  (t) => [
    index("sequence_events_type_idx").on(t.eventType),
    index("sequence_events_occurred_idx").on(t.occurredAt),
  ],
);

// ─── 5.6 — review_decisions ──────────────────────────────────────────────────
export const reviewDecisions = pgTable("review_decisions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
  source: text("source").notNull(),
  rawCompany: text("raw_company"),
  decision: text("decision").$type<"KEEP" | "STOP" | "CORRECT">().notNull(),
  correctedCompany: text("corrected_company"),
  reason: text("reason"),
  appliedAt: timestamp("applied_at"),
  // appliedBy: supprimé (référence auth.users Supabase)
});

// ─── 5.7 — company_aliases ───────────────────────────────────────────────────
export const companyAliases = pgTable(
  "company_aliases",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    domain: text("domain").notNull(),
    canonicalName: text("canonical_name").notNull(),
    track: text("track").$type<"PE" | "MA">(),
    notes: text("notes"),
  },
  (t) => [uniqueIndex("company_aliases_domain_unique").on(t.domain)],
);

// ─── daily_briefs ─────────────────────────────────────────────────────────────
export const dailyBriefs = pgTable(
  "daily_briefs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    briefDate: text("brief_date").notNull(), // ISO YYYY-MM-DD
    contentMarkdown: text("content_markdown").notNull(),
    generatedAt: timestamp("generated_at")
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("daily_briefs_date_unique").on(t.briefDate)],
);

// ─── signal_feed ──────────────────────────────────────────────────────────────
export const signalFeed = pgTable(
  "signal_feed",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    fetchedAt: timestamp("fetched_at")
      .defaultNow()
      .notNull(),
    publishedAt: timestamp("published_at"),
    source: text("source").$type<SignalSource>().notNull(),
    sourceUrl: text("source_url"),
    title: text("title").notNull(),
    snippet: text("snippet"),
    companyName: text("company_name"),
    signalType: text("signal_type").$type<SignalType>(),
    relevanceScore: real("relevance_score"),
    // JSON serialisé : string[]
    tags: text("tags"),
    // JSON serialisé : Record<string, unknown>
    rawJson: text("raw_json"),
    // embedding stocké JSON (sans indexation vectorielle)
    embedding: text("embedding"),
    leadId: text("lead_id").references(() => leads.id),
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

// ─── signal_feed_items (Legacy) ───────────────────────────────────────────────
export const signalFeedItems = pgTable(
  "signal_feed_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
    title: text("title").notNull(),
    sourceUrl: text("source_url"),
    snippet: text("snippet"),
    category: text("category").$type<"PE" | "MA" | "MARKET">(),
    score: real("score"),
    publishedAt: timestamp("published_at")
      .defaultNow()
      .notNull(),
  },
  (t) => [index("sfi_published_idx").on(t.publishedAt)],
);

// ─── copilot_conversations ───────────────────────────────────────────────────
export const copilotConversations = pgTable("copilot_conversations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
  title: text("title").notNull(),
});

// ─── copilot_messages ────────────────────────────────────────────────────────
export const copilotMessages = pgTable(
  "copilot_messages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
      .references(() => copilotConversations.id)
      .notNull(),
    role: text("role").$type<"user" | "assistant" | "system">().notNull(),
    content: text("content").notNull(),
    // JSON serialisé : Record<string, unknown>
    metadata: text("metadata"),
    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (t) => [index("copilot_messages_conv_idx").on(t.conversationId)],
);

// ─── voice_notes ─────────────────────────────────────────────────────────────
export const voiceNotes = pgTable("voice_notes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id").references(() => sequenceTasks.id),
  transcript: text("transcript").notNull(),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

// ─── push_subscriptions ──────────────────────────────────────────────────────
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  endpoint: text("endpoint").notNull(),
  // JSON serialisé : { p256dh: string; auth: string }
  keys: text("keys").notNull(),
  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});



