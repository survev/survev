import { createCanvas, type Image } from "canvas";
import { type Bin, MaxRectsPacker, type Rectangle } from "maxrects-packer";
import type { ISpritesheetData } from "pixi.js-legacy";
import sharp from "sharp";
import type { Atlas } from "../../shared/defs/mapDefs";
import { atlasLogger, ImageManager } from "./atlasBuilder";
import { type AtlasDef, Atlases, type AtlasRes, AtlasResolutions } from "./atlasDefs";
import type { Edges } from "./detectEdges";

interface ImageData {
    image: Image;
    key: string;
    edges: Edges;
    width: number;
    height: number;
}

export type MainToWorkerMsg = Array<{ name: Atlas; hash: string }>;

export type WorkerToMainMsg = Array<{
    name: Atlas;
    hash: string;
    data: Array<{
        res: AtlasRes;
        data: ISpritesheetData;
        buff: Buffer;
    }>;
}>;

const cache = new ImageManager();
cache.loadFromDisk();

export class AtlasBuilder {
    packer: MaxRectsPacker;

    rects: Array<{
        width: number;
        height: number;
        size: number;
        data: ImageData;
    }> = [];

    atlases: WorkerToMainMsg[0]["data"] = [];

    def: AtlasDef;

    constructor(public name: Atlas) {
        this.def = Atlases[name];
        this.packer = new MaxRectsPacker(4096, 4096, 4, {
            border: 2,
            square: true,
        });
    }

    async build() {
        atlasLogger.info(`Building atlas ${this.name}`);

        const start = Date.now();
        await this.pack();
        await this.generateAtlases();

        const timeTaken = Date.now() - start;
        atlasLogger.info(`Finished building ${this.name} after ${timeTaken}ms`);
    }

    static imageCache = new Map<
        string,
        {
            image: Image;
            edges: Edges;
        }
    >();

    async loadImage(key: string, path: string) {
        const { image, edges } = await cache.getCachedImage(path);

        // need to test more if floor, ceil or round is better here...
        // or maybe a combination of them?

        const width = image.width - edges.left - edges.right;
        const height = image.height - edges.top - edges.bottom;

        this.rects.push({
            width,
            height,
            // used for sorting
            // max(width, height) gives more optimized packing from my tests
            size: Math.max(width, height),
            data: {
                image,
                key: key,
                edges: edges,
                width: image.width,
                height: image.height,
            },
        });
    }

    async pack() {
        const imagePromises: Promise<void>[] = [];

        for (const file of this.def.images) {
            let key: string | string[] = file.split("/").at(-1)!.split(".");
            key.pop(); // remove file extension
            key = `${key.join(".")}.img`;
            imagePromises.push(this.loadImage(key, file));
        }
        await Promise.all(imagePromises);

        // sort all rects by their size for more optimized packing that generates
        // less spritesheets
        this.rects.sort((a, b) => {
            return b.size - a.size;
        });

        for (const rect of this.rects) {
            this.packer.add(rect.width, rect.height, rect.data);
        }
    }

    async generateAtlases() {
        const renderPromises: Promise<void>[] = [];
        for (let i = 0; i < this.packer.bins.length; i++) {
            const bin = this.packer.bins[i];
            for (const res in AtlasResolutions) {
                renderPromises.push(
                    this.renderSheet(`${this.name}-${i}`, res as AtlasRes, bin),
                );
            }
        }
        await Promise.all(renderPromises);
    }

    async renderSheet(name: string, res: AtlasRes, bin: Bin<Rectangle>) {
        const scale = AtlasResolutions[res];

        const canvas = createCanvas(bin.width * scale, bin.height * scale);

        const ctx = canvas.getContext("2d");

        const sheetData: ISpritesheetData = {
            meta: {
                image: `${name}-${100 * scale}.png`,
                size: {
                    w: bin.width * scale,
                    h: bin.height * scale,
                },
                scale: scale,
            },
            frames: {},
        };

        for (const rect of bin.rects) {
            const data = rect.data as ImageData;

            const frameData = {
                frame: {
                    x: Math.ceil(rect.x * scale),
                    y: Math.ceil(rect.y * scale),
                    w: Math.ceil(rect.width * scale),
                    h: Math.ceil(rect.height * scale),
                },
                rotated: false,
                trimmed: true,
                spriteSourceSize: {
                    x: Math.ceil(data.edges.left * scale),
                    y: Math.ceil(data.edges.top * scale),
                    w: Math.ceil(rect.width * scale),
                    h: Math.ceil(rect.height * scale),
                },
                sourceSize: {
                    w: Math.ceil(data.width * scale),
                    h: Math.ceil(data.height * scale),
                },
            };
            sheetData.frames[data.key] = frameData;

            const frame = frameData.frame;

            ctx.drawImage(
                data.image,
                // unscaled image position and size
                data.edges.left,
                data.edges.top,
                data.image.width - (data.edges.left + data.edges.right),
                data.image.height - (data.edges.top + data.edges.bottom),
                // scaled image position and size
                frame.x,
                frame.y,
                frame.w,
                frame.h,
            );
        }

        let buff: Buffer;

        // see comment on the atlasDef interface
        if (this.def.compress) {
            buff = await sharp(canvas.toBuffer("image/png"))
                .png({
                    compressionLevel: 9,
                    quality: 99,
                    dither: 0,
                })
                .toBuffer();
        } else {
            buff = Buffer.from(
                canvas.toBuffer("image/png", {
                    compressionLevel: 9,
                }),
            );
        }
        this.atlases.push({
            res: res,
            data: sheetData,
            buff,
        });
    }
}

process.on("message", async (msg: MainToWorkerMsg) => {
    const res: WorkerToMainMsg = [];

    for (const atlas of msg) {
        const builder = new AtlasBuilder(atlas.name);
        await builder.build();
        res.push({
            name: atlas.name,
            hash: atlas.hash,
            data: builder.atlases,
        });
    }
    process.send!(res);
});
