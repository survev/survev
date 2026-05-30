DROP INDEX "idx_match_data_user_stats";--> statement-breakpoint
DROP INDEX "idx_match_data_team_query";--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_user_id_type_pk" PRIMARY KEY("user_id","type");--> statement-breakpoint
ALTER TABLE "user_xp" ADD CONSTRAINT "user_xp_user_id_pass_type_pk" PRIMARY KEY("user_id","pass_type");--> statement-breakpoint
ALTER TABLE "ip_logs" ADD COLUMN "isp" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "match_data" ADD COLUMN "assists" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_data" ADD COLUMN "assisted_ids" integer[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_match_data_user_stats" ON "match_data" USING btree ("user_id","team_mode","rank","kills","assists","damage_dealt","time_alive");--> statement-breakpoint
CREATE INDEX "idx_match_data_team_query" ON "match_data" USING btree ("team_mode","map_id","created_at","game_id","team_id","region","kills","assists");