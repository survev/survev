import fs from "node:fs";
import esbuild, { type BuildOptions } from "esbuild";
import { pluginDir, readDirectory } from "./game/pluginManager";

if (fs.existsSync("./dist")) {
    fs.rmSync("./dist", { recursive: true });
}

const esbuildConfig: BuildOptions = {
    bundle: true,
    minify: false,
    minifySyntax: true,
    outdir: "./dist",
    platform: "node",
    packages: "external",
    entryNames: "[name]",
    sourcemap: "linked",
    logLevel: "info",
    format: "esm",
    define: {
        "process.env.NODE_ENV": "'production'",
    },
};

esbuild.buildSync({
    ...esbuildConfig,
    entryPoints: [
        "./src/gameServer.ts",
        "./src/game/gameProcess.ts",
        "./src/api/index.ts",
    ],
});

if (fs.existsSync(pluginDir)) {
    const pluginPaths = readDirectory(pluginDir);

    esbuild.buildSync({
        ...esbuildConfig,
        outdir: "./dist/plugins",
        entryPoints: pluginPaths,
    });
}
