import fs from "node:fs";
import { defineConfig, type RolldownOptions } from "rolldown";
import { stripBlockPlugin } from "../shared/utils/stripBlockPlugin.ts";

if (fs.existsSync("./dist")) {
    fs.rmSync("./dist", { recursive: true });
}

const config: RolldownOptions = {
    output: {
        dir: "./dist",
        format: "es",
        polyfillRequire: false,
        sourcemap: true,
        topLevelVar: true,
        exports: "none",
        minify: {
            compress: {
                unused: true,
            },
            mangle: false,
            codegen: {
                removeWhitespace: false,
            },
        },
    },
    optimization: {
        inlineConst: {
            mode: "all",
            pass: 3,
        },
    },
    treeshake: {
        manualPureFunctions: [
            "z.object",
            "z.array",
            "z.string",
            "z.boolean",
            "z.number",
            "z.enum",
        ],
        moduleSideEffects: false,
    },
    plugins: [
        stripBlockPlugin({
            start: "STRIP_FROM_PROD_SERVER:START",
            end: "STRIP_FROM_PROD_SERVER:END",
        }),
    ],
    platform: "node",
    external: (id: string) => {
        if (id.includes("uWebSockets.js")) return true;
        if (id.match(/(\.js|\.ts|\.json)/)) return false;

        return true;
    },
    transform: {
        define: {
            "process.env.NODE_ENV": "'production'",
        },
    },
};

export default defineConfig([
    {
        ...config,
        input: "src/gameServer.ts",
    },
    {
        ...config,
        input: "src/game/gameProcess.ts",
    },
    {
        ...config,
        input: "src/api/index.ts",
    },
]);
