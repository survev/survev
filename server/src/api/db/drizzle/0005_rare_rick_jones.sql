CREATE TABLE "user_pass" (
	"user_id" text NOT NULL,
	"pass_type" text DEFAULT 'pass_survivr1' NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"unlocks" json DEFAULT '{}'::json NOT NULL,
	"new_items" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_quest" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"idx" integer NOT NULL,
	"quest_type" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"target" integer NOT NULL,
	"complete" boolean DEFAULT false NOT NULL,
	"rerolled" boolean DEFAULT false NOT NULL,
	"time_acquired" bigint NOT NULL,
	"next_refresh_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_pass" ADD CONSTRAINT "user_pass_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_quest" ADD CONSTRAINT "user_quest_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "user_pass_user_type" ON "user_pass" USING btree ("user_id","pass_type");--> statement-breakpoint
CREATE UNIQUE INDEX "user_quest_user_idx" ON "user_quest" USING btree ("user_id","idx");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_items_user_type" ON "items" USING btree ("user_id","type");