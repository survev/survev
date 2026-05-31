import {
    bigint,
    boolean,
    index,
    integer,
    json,
    numeric,
    pgTable,
    primaryKey,
    serial,
    text,
    timestamp,
    unique,
    uuid,
} from "drizzle-orm/pg-core";
import { TeamMode } from "../../../../shared/gameConfig";
import { ItemStatus, type Loadout, loadout } from "../../../../shared/utils/loadout";
import { table } from "node:console";

export const sessionTable = pgTable("session", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => usersTable.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
    expiresAt: timestamp("expires_at").notNull(),
});

export type SessionTableSelect = typeof sessionTable.$inferSelect;

export const usersTable = pgTable("users", {
    id: text("id").notNull().primaryKey(),
    authId: text("auth_id").notNull(),
    slug: text("slug").notNull().unique(),
    admin: boolean("admin").notNull().default(false),
    banned: boolean("banned").notNull().default(false),
    banReason: text("ban_reason").notNull().default(""),
    bannedBy: text("banned_by").notNull().default(""),
    username: text("username").notNull().default(""),
    usernameSet: boolean("username_set").notNull().default(false),
    userCreated: timestamp("user_created", { withTimezone: true }).notNull().defaultNow(),
    lastUsernameChangeTime: timestamp("last_username_change_time"),
    linked: boolean("linked").notNull().default(false),
    linkedGoogle: boolean("linked_google").notNull().default(false),
    linkedDiscord: boolean("linked_discord").notNull().default(false),
    loadout: json("loadout")
        .notNull()
        .default(loadout.validate({} as Loadout))
        .$type<Loadout>(),
});

export type UsersTableInsert = typeof usersTable.$inferInsert;
export type UsersTableSelect = typeof usersTable.$inferSelect;

export const itemsTable = pgTable("items", {
    userId: text("user_id")
        .notNull()
        .references(() => usersTable.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
    type: text("type").notNull(),
    timeAcquired: bigint("time_acquired", { mode: "number" }).notNull(),
    source: text("source").notNull().default("unlock_new_account"),
    status: integer("status").notNull().default(ItemStatus.New),
},
    (table) => ({
        pk: primaryKey({ columns: [table.userId, table.type] }),
    }),
);

export const matchDataTable = pgTable(
    "match_data",
    {
        userId: text("user_id").default(""),
        userBanned: boolean("user_banned").default(false),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        region: text("region").notNull(),
        mapId: integer("map_id").notNull(),
        gameId: uuid("game_id").notNull(),
        mapSeed: bigint("map_seed", { mode: "number" }).notNull(),
        username: text("username").notNull(),
        playerId: integer("player_id").notNull(),
        teamMode: integer("team_mode").$type<TeamMode>().notNull(),
        teamCount: integer("team_count").notNull(),
        teamTotal: integer("team_total").notNull(),
        teamId: integer("team_id").notNull(),
        timeAlive: integer("time_alive").notNull(),
        rank: integer("rank").notNull(),
        died: boolean("died").notNull(),
        kills: integer("kills").notNull(),
        assists: integer("assists").notNull().default(0),
        teamKills: integer("team_kills").notNull().default(0),
        damageDealt: integer("damage_dealt").notNull(),
        damageTaken: integer("damage_taken").notNull(),
        killerId: integer("killer_id").notNull(),
        killedIds: integer("killed_ids").array().notNull(),
        assistedIds: integer("assisted_ids").array().notNull().default([]),
        encodedIp: text("encoded_ip").notNull().default(""),
    },
    (table) => [
        index("idx_match_data_user_stats").on(
            table.userId,
            table.teamMode,
            table.rank,
            table.kills,
            table.assists,
            table.damageDealt,
            table.timeAlive,
        ),
        index("idx_game_id").on(table.gameId),
        index("idx_user_id").on(table.userId),
        index("idx_match_data_team_query").on(
            table.teamMode,
            table.mapId,
            table.createdAt,
            table.gameId,
            table.teamId,
            table.region,
            table.kills,
            table.assists,
        ),
    ],
);

export type MatchDataTable = typeof matchDataTable.$inferInsert;

//
// LOGS
//
export const ipLogsTable = pgTable(
    "ip_logs",
    {
        id: serial().primaryKey(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        region: text("region").notNull(),
        gameId: text("game_id").notNull(),
        mapId: integer("map_id").notNull(),
        username: text("username").notNull(),
        userId: text("user_id").default(""),
        encodedIp: text("encoded_ip").notNull(),
        teamMode: integer("team_mode").$type<TeamMode>().notNull().default(TeamMode.Solo),
        ip: text("ip").notNull(),
        // also store the IP that was used in api/find_game...
        // since one could exploit that to never get banned
        // by requesting it with a different IP than the in-game one
        findGameIp: text("find_game_ip").notNull(),
        findGameEncodedIp: text("find_game_encoded_ip").notNull(),
        isp: text("isp").notNull().default(""),
    },
    (table) => [index("name_created_at_idx").on(table.username, table.createdAt)],
);

export type IpLogsTable = typeof ipLogsTable.$inferSelect;

export const chatLogsTable = pgTable(
    "chat_logs",
    {
        id: serial().primaryKey(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        gameId: text("game_id").notNull(),
        username: text("username").notNull(),
        userId: text("user_id").notNull().default(""),
        encodedIp: text("encoded_ip").notNull(),
        channel: integer("channel").notNull().default(0), // 0 = all, 1 = team
        message: text("message").notNull(),
    },
    (table) => [
        index("chat_logs_username_idx").on(table.username, table.createdAt),
        index("chat_logs_ip_idx").on(table.encodedIp, table.createdAt),
        index("chat_logs_user_id_idx").on(table.userId, table.createdAt),
    ],
);

export type ChatLogsTable = typeof chatLogsTable.$inferSelect;

export const bannedIpsTable = pgTable("banned_ips", {
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresIn: timestamp("expires_in").notNull(),
    encodedIp: text("encoded_ip").notNull().primaryKey(),
    permanent: boolean("permanent").notNull().default(false),
    reason: text("reason").notNull().default(""),
    bannedBy: text("banned_by").notNull().default("admin"),
});

export const chatBannedIpsTable = pgTable("chat_banned_ips", {
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresIn: timestamp("expires_in").notNull(),
    encodedIp: text("encoded_ip").notNull().primaryKey(),
    permanent: boolean("permanent").notNull().default(false),
    reason: text("reason").notNull().default(""),
    bannedBy: text("banned_by").notNull().default("admin"),
});

export const userXpTable = pgTable("user_xp", {
    userId: text("user_id").notNull()
    .references(() => usersTable.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
    passType: text("pass_type").notNull(),
    level: integer("level").notNull(),
    xp: numeric("xp").notNull(),
    lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
},
    (table) => ({
        pk: primaryKey({ columns: [table.userId, table.passType] }),
    }),
);
