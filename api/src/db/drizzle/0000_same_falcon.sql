CREATE TABLE "banned_ips" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expries_in" timestamp NOT NULL,
	"encoded_ip" text PRIMARY KEY NOT NULL,
	"permanent" boolean DEFAULT false NOT NULL,
	"reason" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"region" text NOT NULL,
	"game_id" text NOT NULL,
	"map_id" integer NOT NULL,
	"username" text NOT NULL,
	"user_id" text DEFAULT '',
	"encoded_ip" text NOT NULL,
	"ip" text NOT NULL,
	"find_game_ip" text NOT NULL,
	"find_game_encoded_ip" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"time_acquired" bigint NOT NULL,
	"source" text DEFAULT 'unlock_new_account' NOT NULL,
	"status" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_data" (
	"user_id" text DEFAULT '',
	"user_banned" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"region" text NOT NULL,
	"map_id" integer NOT NULL,
	"game_id" uuid NOT NULL,
	"map_seed" bigint NOT NULL,
	"username" text NOT NULL,
	"player_id" integer NOT NULL,
	"team_mode" integer NOT NULL,
	"team_count" integer NOT NULL,
	"team_total" integer NOT NULL,
	"team_id" integer NOT NULL,
	"time_alive" integer NOT NULL,
	"rank" integer NOT NULL,
	"died" boolean NOT NULL,
	"kills" integer NOT NULL,
	"damage_dealt" integer NOT NULL,
	"damage_taken" integer NOT NULL,
	"killer_id" integer NOT NULL,
	"killed_ids" integer[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"auth_id" text NOT NULL,
	"slug" text NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text DEFAULT '' NOT NULL,
	"username" text DEFAULT '' NOT NULL,
	"username_set" boolean DEFAULT false NOT NULL,
	"user_created" timestamp with time zone DEFAULT now() NOT NULL,
	"last_username_change_time" timestamp,
	"linked" boolean DEFAULT false NOT NULL,
	"linked_google" boolean DEFAULT false NOT NULL,
	"linked_discord" boolean DEFAULT false NOT NULL,
	"loadout" json DEFAULT '{"outfit":"outfitBase","melee":"fists","heal":"heal_basic","boost":"boost_basic","player_icon":"","crosshair":{"type":"crosshair_default","color":16777215,"size":"1.00","stroke":"0.00"},"emotes":["emote_happyface","emote_thumbsup","emote_surviv","emote_sadface","",""]}'::json NOT NULL,
	CONSTRAINT "users_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "name_created_at_idx" ON "ip_logs" USING btree ("username","created_at");--> statement-breakpoint
CREATE INDEX "idx_match_data_user_stats" ON "match_data" USING btree ("user_id","team_mode","rank","kills","damage_dealt","time_alive");--> statement-breakpoint
CREATE INDEX "idx_game_id" ON "match_data" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_user_id" ON "match_data" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_match_data_team_query" ON "match_data" USING btree ("team_mode","map_id","created_at","game_id","team_id","region","kills");