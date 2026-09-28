import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";

// only optimize dirs that have SVGs that actually get loaded as SVGs on the client
// all in-game sprites are loaded from the bitmap spritesheets, so don't need to optimize those svgs
const dirsToOptimize = [
    "gui",
    "loot",
    "ui",
    "pass",
    "crosshairs",
    "emotes",
];

export function svgoPlugin(): Plugin {
    let imgDir: string;
    return {
        name: "svgo-plugin",
        apply: "build",
        configResolved(config) {
            imgDir = path.resolve(config.build.outDir, "img");
        },
        async closeBundle() {
            const { optimize } = await import("svgo");

            const start = performance.now();
            const files: string[] = [];
            for (const dir of dirsToOptimize) {
                const svgs = fs.readdirSync(path.join(imgDir, dir));
                for (const svg of svgs) {
                    if (svg.endsWith(".svg")) {
                        files.push(path.join(imgDir, dir, svg));
                    }
                }
            }

            const promises: Promise<void>[] = [];
            console.log(`Optimizing ${files.length} SVGs`);
            for (const file of files) {
                promises.push((async () => {
                    try {
                        const data = await fsp.readFile(file, { encoding: "utf-8" });
                        const optimized = optimize(data, {
                            multipass: true,
                            floatPrecision: 4,
                        });
                        await fsp.writeFile(file, optimized.data, { encoding: "utf-8" });
                    } catch (err) {
                        console.error(`Failed to optimize svg ${file}`, err);
                    }
                })());
            }
            await Promise.all(promises);
            console.log(`Optimized all SVGs after ${(performance.now() - start).toFixed(1)}ms`);
        },
    };
}
