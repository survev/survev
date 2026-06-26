import fs from "node:fs";
import { defineConfig, type RolldownOptions } from "rolldown";

if (fs.existsSync("./dist")) {
    fs.rmSync("./dist", { recursive: true });
}

const config: RolldownOptions = {
    output: {
        dir: "./dist",
        format: "es",
        polyfillRequire: false,
        sourcemap: true,
        minify: {
            compress: {
                unused: true,
            },
            codegen: {
                removeWhitespace: false,
            },
        },
    },
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
