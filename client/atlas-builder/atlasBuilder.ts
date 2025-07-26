import cp from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import Path from "node:path";

import { loadImage } from "canvas";
import type { ISpritesheetData } from "pixi.js-legacy";
import type { Atlas } from "../../shared/defs/mapDefs";
import { Atlases, type AtlasRes, scaledSprites } from "./atlasDefs";
import type { MainToWorkerMsg, WorkerToMainMsg } from "./atlasWorker";
import type { Edges } from "./detectEdges";
import type { ParentMsg } from "./imageWorker";

export const cacheFolder = Path.resolve(
    import.meta.dirname,
    "../node_modules/.atlas-png-cache/",
);

export const imagesCacheFolder = Path.join(cacheFolder, "img");
export const atlasesCacheFolder = Path.join(cacheFolder, "atlases");

export const imageFolder = Path.resolve(import.meta.dirname, "../public/img");

if (!fs.existsSync(imagesCacheFolder)) {
    fs.mkdirSync(imagesCacheFolder, {
        recursive: true,
    });
}

const imgCacheFilePath = Path.join(cacheFolder, "img-cache.json");

function hashBuff(buff: Buffer) {
    return crypto.createHash("sha256").update(buff).digest("hex");
}

export type ImgCache = Record<
    string,
    {
        hash: string;
        edges: Edges;
    }
>;

export class ImageManager {
    private cache: ImgCache = {};
    private imagesToRender = new Map<string, string>();

    get(key: string): ImgCache[string] | undefined {
        return this.cache[key];
    }

    queueImage(path: string, hash: string) {
        this.imagesToRender.set(path, hash);
    }

    async getCachedImage(filePath: string) {
        const cached = this.cache[filePath];
        if (!cached) {
            throw new Error(`Couldn't find cached image ${filePath}`);
        }
        const fullPath = Path.join(imagesCacheFolder, `${cached.hash}.png`);
        return {
            edges: cached.edges,
            image: await loadImage(fullPath),
        };
    }

    loadFromDisk() {
        if (fs.existsSync(imgCacheFilePath)) {
            this.cache = JSON.parse(fs.readFileSync(imgCacheFilePath).toString("utf8"));
        } else {
            this.cache = {};
        }
    }

    writeToDisk() {
        fs.writeFileSync(imgCacheFilePath, JSON.stringify(this.cache));
    }

    async renderImages() {
        if (this.imagesToRender.size === 0) return;

        const threads = Math.max(os.availableParallelism() - 2, 1);

        const imagesToRender = [...this.imagesToRender.entries()].map((a) => {
            return {
                path: a[0],
                hash: a[1],
            };
        });

        const imagesPerThread = Math.ceil(imagesToRender.length / threads);

        console.log(
            `Rendering ${imagesToRender.length} images / ${imagesPerThread} per thread`,
        );

        const promises: Promise<void>[] = [];
        while (imagesToRender.length) {
            const images = imagesToRender.splice(0, imagesPerThread);

            const proc = cp.fork(Path.resolve(import.meta.dirname, "imageWorker.ts"), {
                execArgv: ["--import", "tsx"],
            });

            const promise = new Promise<void>((resolve) => {
                proc.send({
                    images,
                } satisfies ParentMsg);

                proc.on("message", (msg: ImgCache) => {
                    Object.assign(this.cache, msg);

                    proc.kill();
                    resolve();
                });
            });

            promises.push(promise);
        }

        await Promise.all(promises);
        this.writeToDisk();

        this.imagesToRender.clear();
    }
}

// Atlas key -> hash
type AtlasCache = Record<string, string>;
type AtlasData = Record<AtlasRes, ISpritesheetData[]>;

export class AtlasManager {
    atlasCache: AtlasCache = {};

    imageCache = new ImageManager();

    loadFromDisk() {
        this.imageCache.loadFromDisk();
    }

    writeToDisk() {
        this.imageCache.writeToDisk();
    }

    async getAtlas(atlas: Atlas): Promise<AtlasData> {
        const hash = this.atlasCache[atlas];
        const folder = this.getAtlasFolderPath(atlas, hash);

        const path = Path.join(folder, "data.json");
        if (!fs.existsSync(path)) {
            await this.buildAtlases([{ name: atlas, hash }]);
        }

        return JSON.parse(
            fs.readFileSync(Path.join(folder, "data.json")).toString("utf8"),
        );
    }

    hashAtlas(atlas: Atlas): string {
        const atlasDef = Atlases[atlas];

        let atlasHash = "";
        for (const file of atlasDef.images) {
            const imagePath = Path.join(imageFolder, file);
            const data = fs.readFileSync(imagePath);

            const scale = scaledSprites[file] ?? 1;
            const hash = `${hashBuff(data)}-${100 * scale}`;

            if (
                this.imageCache.get(file)?.hash !== hash ||
                !fs.existsSync(Path.join(imagesCacheFolder, `${hash}.png`))
            ) {
                this.imageCache.queueImage(file, hash);
            }

            atlasHash += hash;
        }

        return hashBuff(Buffer.from(atlasHash));
    }

    getAtlasFolderPath(atlas: Atlas, hash: string) {
        return Path.join(atlasesCacheFolder, `${atlas}-${hash}`);
    }

    getChangedAtlases() {
        const changedAtlases: { name: Atlas; hash: string }[] = [];

        for (const atlas of Object.keys(Atlases) as Atlas[]) {
            const hash = this.hashAtlas(atlas);

            this.atlasCache[atlas] = hash;

            const atlasPath = Path.join(
                this.getAtlasFolderPath(atlas, hash),
                "data.json",
            );

            if (!fs.existsSync(atlasPath)) {
                changedAtlases.push({ name: atlas, hash });
            }
        }

        return changedAtlases;
    }

    async buildAtlases(atlasesToBuild: { name: Atlas; hash: string }[]) {
        await this.imageCache.renderImages();

        const promises: Promise<void>[] = [];

        for (const atlas of atlasesToBuild) {
            const proc = cp.fork(Path.resolve(import.meta.dirname, "atlasWorker.ts"), {
                serialization: "advanced",
                execArgv: ["--import", "tsx"],
            });

            const atlasPath = this.getAtlasFolderPath(atlas.name, atlas.hash);
            fs.mkdirSync(atlasPath, {
                recursive: true,
            });

            const promise = new Promise<void>((resolve) => {
                proc.send({
                    name: atlas.name,
                    def: Atlases[atlas.name],
                } satisfies MainToWorkerMsg);

                proc.on("message", (msg: WorkerToMainMsg) => {
                    const data = msg;

                    const atlasJson: Record<string, ISpritesheetData[]> = {};

                    for (const sheet of data) {
                        const filePath = Path.join(atlasPath, sheet.data.meta.image!);
                        fs.writeFileSync(filePath, Buffer.from(sheet.buff));
                        (atlasJson[sheet.res] ??= []).push(sheet.data);
                    }

                    const filePath = Path.join(atlasPath, "data.json");
                    fs.writeFileSync(filePath, JSON.stringify(atlasJson));

                    proc.kill();
                    resolve();
                });
            });

            promises.push(promise);
        }

        await Promise.all(promises);
    }
}
