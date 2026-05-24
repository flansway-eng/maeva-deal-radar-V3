CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "signal_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"source" text NOT NULL,
	"source_url" text,
	"title" text NOT NULL,
	"snippet" text,
	"company_name" text,
	"signal_type" text,
	"relevance_score" numeric(5, 2),
	"tags" text[],
	"raw_json" jsonb,
	"embedding" vector(1536),
	"lead_id" uuid,
	"external_id" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signal_feed_published_idx" ON "signal_feed" USING btree ("published_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signal_feed_source_idx" ON "signal_feed" USING btree ("source");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signal_feed_company_idx" ON "signal_feed" USING btree ("company_name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "signal_feed_source_url_unique" ON "signal_feed" USING btree ("source_url");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "signal_feed_external_id_unique" ON "signal_feed" USING btree ("external_id");
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "siren" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "capital_social" integer;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "forme_juridique" text;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "pappers_data" jsonb;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "qualification_data" jsonb;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "qualified_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_embedding_idx" ON "leads" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 50);
