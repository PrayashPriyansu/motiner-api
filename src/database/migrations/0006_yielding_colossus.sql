CREATE TABLE "site_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"uptime_1h" real DEFAULT 0 NOT NULL,
	"uptime_24h" real DEFAULT 0 NOT NULL,
	"uptime_7d" real DEFAULT 0 NOT NULL,
	"avg_response_time_1h" integer DEFAULT 0 NOT NULL,
	"avg_response_time_24h" integer DEFAULT 0 NOT NULL,
	"avg_response_time_7d" integer DEFAULT 0 NOT NULL,
	"uptime_all_time" real DEFAULT 0 NOT NULL,
	"avg_response_time_all_time" integer DEFAULT 0 NOT NULL,
	"current_status" text DEFAULT 'down' NOT NULL,
	"last_checked" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_stats" ADD CONSTRAINT "site_stats_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pings_site_id_checked_at_idx" ON "pings" USING btree ("site_id","checked_at");