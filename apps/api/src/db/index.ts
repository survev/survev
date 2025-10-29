import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { server } from "../apiServer";
import { Config } from "../config";
import * as schema from "./schema";

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
