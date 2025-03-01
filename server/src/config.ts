import { getConfig } from "../../config.ts";

// const isProd = process.env["NODE_ENV"] === "production";
// export const serverConfigPath = isProd ? "../../" : "";
// to remove "server/dist" from the path to load the config from...
export const Config = getConfig(false, "");
