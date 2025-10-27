import fs from "node:fs";
import esbuild, { type BuildOptions } from "esbuild";

// some yanking had happened;

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
    entryPoints: ["./src/index.ts"],
});
