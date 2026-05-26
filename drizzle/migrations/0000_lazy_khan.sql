CREATE TABLE `company_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`domain` text NOT NULL,
	`canonical_name` text NOT NULL,
	`track` text,
	`notes` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `company_aliases_domain_unique` ON `company_aliases` (`domain`);--> statement-breakpoint
CREATE TABLE `copilot_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`title` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `copilot_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `copilot_conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `copilot_messages_conv_idx` ON `copilot_messages` (`conversation_id`);--> statement-breakpoint
CREATE TABLE `daily_briefs` (
	`id` text PRIMARY KEY NOT NULL,
	`brief_date` text NOT NULL,
	`content_markdown` text NOT NULL,
	`generated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_briefs_date_unique` ON `daily_briefs` (`brief_date`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`discovery_id` text,
	`company_name` text NOT NULL,
	`company_name_original` text,
	`website` text,
	`page_url` text,
	`geography` text DEFAULT 'Île-de-France',
	`sector` text,
	`track` text NOT NULL,
	`target_role` text,
	`persona_name` text,
	`personalization_fact` text,
	`primary_signal` text,
	`confidence_score` real,
	`review_status` text DEFAULT 'PENDING',
	`siren` text,
	`capital_social` integer,
	`forme_juridique` text,
	`pappers_data` text,
	`qualification_data` text,
	`qualified_at` integer,
	`embedding` text,
	FOREIGN KEY (`discovery_id`) REFERENCES `web_discoveries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`endpoint` text NOT NULL,
	`keys` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`source` text NOT NULL,
	`raw_company` text,
	`decision` text NOT NULL,
	`corrected_company` text,
	`reason` text,
	`applied_at` integer
);
--> statement-breakpoint
CREATE TABLE `sequence_events` (
	`id` text PRIMARY KEY NOT NULL,
	`occurred_at` integer NOT NULL,
	`event_type` text NOT NULL,
	`task_id` text,
	`payload` text,
	`note` text,
	FOREIGN KEY (`task_id`) REFERENCES `sequence_tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sequence_events_type_idx` ON `sequence_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `sequence_events_occurred_idx` ON `sequence_events` (`occurred_at`);--> statement-breakpoint
CREATE TABLE `sequence_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`sequence_uid` text NOT NULL,
	`created_at` integer NOT NULL,
	`lead_id` text,
	`company` text NOT NULL,
	`track` text NOT NULL,
	`contact_name` text,
	`title` text,
	`location` text,
	`source` text,
	`step_code` text NOT NULL,
	`planned_date` text NOT NULL,
	`channel` text NOT NULL,
	`message_subject` text,
	`message_body` text,
	`status` text DEFAULT 'PLANNED' NOT NULL,
	`execution_note` text,
	`executed_at` integer,
	`stop_reason` text,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sequence_tasks_uid_unique` ON `sequence_tasks` (`sequence_uid`);--> statement-breakpoint
CREATE INDEX `sequence_tasks_status_idx` ON `sequence_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `sequence_tasks_planned_idx` ON `sequence_tasks` (`planned_date`);--> statement-breakpoint
CREATE INDEX `sequence_tasks_company_idx` ON `sequence_tasks` (`company`);--> statement-breakpoint
CREATE TABLE `signal_feed` (
	`id` text PRIMARY KEY NOT NULL,
	`fetched_at` integer NOT NULL,
	`published_at` integer,
	`source` text NOT NULL,
	`source_url` text,
	`title` text NOT NULL,
	`snippet` text,
	`company_name` text,
	`signal_type` text,
	`relevance_score` real,
	`tags` text,
	`raw_json` text,
	`embedding` text,
	`lead_id` text,
	`external_id` text,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `signal_feed_published_idx` ON `signal_feed` (`published_at`);--> statement-breakpoint
CREATE INDEX `signal_feed_source_idx` ON `signal_feed` (`source`);--> statement-breakpoint
CREATE INDEX `signal_feed_company_idx` ON `signal_feed` (`company_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `signal_feed_source_url_unique` ON `signal_feed` (`source_url`);--> statement-breakpoint
CREATE UNIQUE INDEX `signal_feed_external_id_unique` ON `signal_feed` (`external_id`);--> statement-breakpoint
CREATE TABLE `signal_feed_items` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`title` text NOT NULL,
	`source_url` text,
	`snippet` text,
	`category` text,
	`score` real,
	`published_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sfi_published_idx` ON `signal_feed_items` (`published_at`);--> statement-breakpoint
CREATE TABLE `sourcing_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`triggered_at` integer NOT NULL,
	`queries` text NOT NULL,
	`status` text NOT NULL,
	`results_count` integer DEFAULT 0,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `voice_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text,
	`transcript` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `sequence_tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `web_discoveries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`source_title` text NOT NULL,
	`source_url` text NOT NULL,
	`domain` text NOT NULL,
	`company_name_raw` text,
	`page_type` text,
	`snippet` text,
	`extracted_text` text,
	`score` real,
	`signals` text DEFAULT '[]',
	`run_id` text,
	FOREIGN KEY (`run_id`) REFERENCES `sourcing_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `web_discoveries_domain_idx` ON `web_discoveries` (`domain`);--> statement-breakpoint
CREATE UNIQUE INDEX `web_discoveries_url_unique` ON `web_discoveries` (`source_url`);