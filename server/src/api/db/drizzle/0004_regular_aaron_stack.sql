CREATE TYPE "public"."status" AS ENUM('unreviewed', 'ignored', 'reviewed');--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sepectated_player_ids" text[] DEFAULT '{}' NOT NULL,
	"reported_by" text NOT NULL,
	"recording" text NOT NULL,
	"game_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" text DEFAULT '' NOT NULL,
	"status" "status" DEFAULT 'unreviewed' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "can_report_players" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;