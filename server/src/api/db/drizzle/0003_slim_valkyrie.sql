CREATE TABLE "reports" (
	"reported_by" text NOT NULL,
	"recording" text NOT NULL,
	"game_id" uuid NOT NULL,
	"status" text DEFAULT 'unreviewed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;