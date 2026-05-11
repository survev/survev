import { defineConfig } from "drizzle-kit";
import { Config } from "../config.ts";

export default defineConfig({
    dialect: "postgresql",
    schema: "src/api/db/schema.ts",
    out: "./src/api/db/drizzle",
    dbCredentials: {
        ...Config.database,
        ssl: false,
    },
});
