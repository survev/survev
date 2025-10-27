ALTER TABLE "banned_ips" ADD COLUMN "banned_by" text DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned_by" text DEFAULT '' NOT NULL;