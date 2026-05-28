import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { Config } from "../../config.ts";
import { server } from "../apiServer.ts";
import * as schema from "./schema.ts";

const poolConnection = new pg.Pool({
    ...Config.database,
    idleTimeoutMillis: 60 * 1000,
});

poolConnection.on("connect", () => {
    server.logger.info("Connected to database");
});

poolConnection.on("error", (err) => {
    server.logger.error("pg pool error:", err);
});

export const db = drizzle({
    client: poolConnection,
    schema,
});
