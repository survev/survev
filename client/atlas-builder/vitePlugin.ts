import crypto from "node:crypto";
import fs from "node:fs";
import Path from "node:path";
import type { ISpritesheetData } from "pixi.js-legacy";
import type { Plugin } from "vite";
import type { Atlas } from "../../shared/defs/mapDefs";
import { assert } from "../../shared/utils/util";
import { AtlasManager, atlasLogger, imageFolder } from "./atlasBuilder";
import { type AtlasRes, AtlasResolutions } from "./atlasDefs";

export function atlasBuilderPlugin(): Plugin[] {
    const atlasManager = new AtlasManager();
    atlasManager.loadFromDisk();

    const atlasesJson: Record<AtlasRes, Record<string, ISpritesheetData[]>> = {
        low: {},
        high: {},
    };

    let buildPromise: Promise<void> | undefined = undefined;

    const resolveId = async (source: string) => {
        if (!source.startsWith("virtual-atlases")) return;
        if (buildPromise) await buildPromise;

        const res = source.split("-").at(-1)! as AtlasRes;
        assert(res in AtlasResolutions, `invalid atlas res ${res}`);

        return `atlases-${res}`;
    };

    const load = async (id: string) => {
        if (!id.startsWith("atlases-")) return;
        if (buildPromise) await buildPromise;

        const res = id.split("-").at(-1)! as AtlasRes;
        assert(res in AtlasResolutions, `invalid atlas res ${res}`);

        const json = atlasesJson[res];
        return `export default JSON.parse('${JSON.stringify(json)}');`;
    };

    const buildAtlases = async () => {
        const changedAtlases = atlasManager.getChangedAtlases();

        if (changedAtlases.length) {
            atlasLogger.info(
                `Building atlases ${changedAtlases.map((a) => a.name).join(", ")}`,
            );
            await atlasManager.buildAtlases(changedAtlases);

            // meh
            // cache building up your storage is only an issue if you rebuild atlases frequently
            // and if you rebuild them frequently this is surely going to run at some point... right?
            if (Math.random() < 0.1) {
                atlasManager.cleanOldFiles();
            }
        } else {
            atlasLogger.info("No atlases to build :)");
        }
    };

    return [
        {
            name: "atlas-builder:build",
            apply: "build",

            async buildStart() {
                await buildAtlases();

                // reset cached json
                for (const key of Object.keys(atlasesJson) as AtlasRes[]) {
                    atlasesJson[key] = {};
                }

                for (const atlas of Object.keys(atlasManager.atlasCache) as Atlas[]) {
                    const data = await atlasManager.getAtlas(atlas);
                    const hash = atlasManager.atlasCache[atlas];

                    for (const res of Object.keys(data) as AtlasRes[]) {
                        for (const sheet of data[res]) {
                            const imagePath = Path.join(
                                atlasManager.getAtlasFolderPath(atlas, hash),
                                sheet.meta.image!,
                            );
                            const data = fs.readFileSync(imagePath);

                            const pngHash = crypto
                                .createHash("sha256")
                                .update(data)
                                .digest("hex")
                                .substring(0, 8);
                            const fileName = `assets/${sheet.meta.image!.replace(".png", `-${pngHash}.png`)}`;

                            this.emitFile({
                                type: "asset",
                                fileName,
                                source: data,
                            });

                            sheet.meta.image = fileName;
                        }

                        (atlasesJson[res][atlas] ??= []).push(...data[res]);
                    }
                }
            },
            resolveId,
            load,
        },
        {
            name: "atlas-builder:serve",
            apply: "serve",
            async configureServer(server) {
                const build = async () => {
                    await buildAtlases();

                    // reset cached json
                    for (const key of Object.keys(atlasesJson) as AtlasRes[]) {
                        atlasesJson[key] = {};
                    }

                    for (const atlas of Object.keys(atlasManager.atlasCache) as Atlas[]) {
                        const data = await atlasManager.getAtlas(atlas);
                        const hash = atlasManager.atlasCache[atlas];

                        for (const res of Object.keys(data) as AtlasRes[]) {
                            for (const sheet of data[res]) {
                                sheet.meta.image = Path.relative(
                                    import.meta.dirname,
                                    Path.join(
                                        atlasManager.getAtlasFolderPath(atlas, hash),
                                        sheet.meta.image!,
                                    ),
                                ).replace(/\\/g, "/"); // I HATE WINDOWS
                            }

                            (atlasesJson[res][atlas] ??= []).push(...data[res]);
                        }
                    }

                    for (const res in AtlasResolutions) {
                        const moduleId = `atlases-${res}`;
                        const module = server.moduleGraph.getModuleById(moduleId);
                        if (module !== undefined) void server.reloadModule(module);
                    }
                };

                buildPromise = build();
                await buildPromise;

                let rebuildTimeout: ReturnType<typeof setTimeout>;

                // when e.g switching branches that change a bunch of sprites, the filesystem watcher can trigger a bunch of changes
                // and we dont want to rebuild the atlases for each file that changes
                // so when theres a filesystem change we throttle to wait for more

                const scheduleRebuild = () => {
                    clearTimeout(rebuildTimeout);

                    rebuildTimeout = setTimeout(async () => {
                        buildPromise = build();
                        await buildPromise;
                    }, 250);
                };
                const watchCb = (path: string) => {
                    if (path.endsWith(".svg") || path.endsWith(".png")) {
                        const relative = Path.relative(imageFolder, path);
                        atlasLogger.info(
                            `Image ${relative} changed, scheduling atlas rebuild`,
                        );
                        scheduleRebuild();
                    }
                };
                server.watcher.on("add", watchCb);
                server.watcher.on("change", watchCb);
            },
            resolveId,
            load,
        },
    ];
}
