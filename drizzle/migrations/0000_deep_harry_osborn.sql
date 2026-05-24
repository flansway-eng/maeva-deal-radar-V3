CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"canonical_name" text NOT NULL,
	"track" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"discovery_id" uuid,
	"company_name" text NOT NULL,
	"company_name_original" text,
	"website" text,
	"page_url" text,
	"geography" text DEFAULT 'Île-de-France',
	"sector" text,
	"track" text NOT NULL,
	"target_role" text,
	"persona_name" text,
	"personalization_fact" text,
	"primary_signal" text,
	"confidence_score" numeric(5, 2),
	"review_status" text DEFAULT 'PENDING'
);
--> statement-breakpoint
CREATE TABLE "review_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"raw_company" text,
	"decision" text NOT NULL,
	"corrected_company" text,
	"reason" text,
	"applied_at" timestamp with time zone,
	"applied_by" uuid
);
--> statement-breakpoint
CREATE TABLE "sequence_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"task_id" uuid,
	"actor_id" uuid,
	"payload" jsonb,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "sequence_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_uid" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lead_id" uuid,
	"company" text NOT NULL,
	"track" text NOT NULL,
	"contact_name" text,
	"title" text,
	"location" text,
	"source" text,
	"step_code" text NOT NULL,
	"planned_date" date NOT NULL,
	"channel" text NOT NULL,
	"message_subject" text,
	"message_body" text,
	"status" text DEFAULT 'PLANNED' NOT NULL,
	"execution_note" text,
	"executed_at" timestamp with time zone,
	"stop_reason" text
);
--> statement-breakpoint
CREATE TABLE "sourcing_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"triggered_by" uuid,
	"queries" jsonb NOT NULL,
	"status" text NOT NULL,
	"results_count" integer DEFAULT 0,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "web_discoveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_title" text NOT NULL,
	"source_url" text NOT NULL,
	"domain" text NOT NULL,
	"company_name_raw" text,
	"page_type" text,
	"snippet" text,
	"extracted_text" text,
	"score" numeric(5, 2),
	"signals" jsonb DEFAULT '[]'::jsonb,
	"run_id" uuid
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_discovery_id_web_discoveries_id_fk" FOREIGN KEY ("discovery_id") REFERENCES "public"."web_discoveries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_applied_by_users_id_fk" FOREIGN KEY ("applied_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_events" ADD CONSTRAINT "sequence_events_task_id_sequence_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."sequence_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_events" ADD CONSTRAINT "sequence_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sequence_tasks" ADD CONSTRAINT "sequence_tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_runs" ADD CONSTRAINT "sourcing_runs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "web_discoveries" ADD CONSTRAINT "web_discoveries_run_id_sourcing_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."sourcing_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "company_aliases_domain_unique" ON "company_aliases" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "sequence_events_type_idx" ON "sequence_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "sequence_events_occurred_idx" ON "sequence_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sequence_tasks_uid_unique" ON "sequence_tasks" USING btree ("sequence_uid");--> statement-breakpoint
CREATE INDEX "sequence_tasks_status_idx" ON "sequence_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sequence_tasks_planned_idx" ON "sequence_tasks" USING btree ("planned_date");--> statement-breakpoint
CREATE INDEX "sequence_tasks_company_idx" ON "sequence_tasks" USING btree ("company");--> statement-breakpoint
CREATE INDEX "web_discoveries_domain_idx" ON "web_discoveries" USING btree ("domain");--> statement-breakpoint
CREATE UNIQUE INDEX "web_discoveries_url_unique" ON "web_discoveries" USING btree ("source_url");

--> statement-breakpoint
ALTER TABLE "web_discoveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sourcing_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sequence_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sequence_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "review_decisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company_aliases" ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
CREATE POLICY "authenticated_user_access" ON "web_discoveries" AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_user_access" ON "sourcing_runs" AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_user_access" ON "leads" AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_user_access" ON "sequence_tasks" AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_user_access" ON "sequence_events" AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_user_access" ON "review_decisions" AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_user_access" ON "company_aliases" AS PERMISSIVE FOR ALL TO authenticated USING (true);