import { defineConfig } from "drizzle-kit";
import { Config } from "./src/config";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema.ts",
    out: "./src/db/drizzle",
    dbCredentials: {
        ...Config.database,
        ssl: false,
    },
});
