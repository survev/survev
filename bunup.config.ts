// bunup.config.ts
import { defineWorkspace } from "bunup";

export default defineWorkspace(
    [
        {
            name: "shared",
            root: "packages/shared",
            config: {
                entry: ["src/index.ts"],
            },
        },
        {
            name: "lib",
            root: "packages/lib",
            config: {
                entry: ["src/index.ts"],
            },
        },
        {
            name: "game",
            root: "apps/server",
            config: {
                entry: ["./src/gameServer.ts", "./src/game/gameProcess.ts"],
                sourceBase: "./src",
            },
        },
        {
            name: "api",
            root: "apps/api",
            config: {
                entry: ["./src/index.ts"],
                sourceBase: "./src",
            },
        },
    ],
    {
        outDir: "./dist",
        noExternal: [/^@survev\//],
        format: ["esm"],
        sourcemap: "linked",
        dts: false,
        conditions: ["@survev/source"],
    },
);
