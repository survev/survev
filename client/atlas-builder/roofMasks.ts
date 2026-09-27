/**
 * Generates shared/defs/mapObjects/buildings/roofMasks.ts, the parts of each building
 * where the ceiling art is fully opaque.
 *
 * The server uses it to withhold players and loot the client would draw under a roof.
 * Roofs aren't solid rectangles (the red house has a glass skylight), so the server can't just
 * use the zoom regions.
 *
 * Rerun after changing ceiling images or building ceiling defs:
 *     cd client && pnpm roofMasks
 */
import { createCanvas, type Image, loadImage } from "canvas";
import fs from "node:fs";
import Path from "node:path";
import type { BuildingDef } from "../../shared/defs/mapObjects/buildings/buildingDefs.ts";
import { MapObjectDefs } from "../../shared/defs/register.ts";
import { math } from "../../shared/utils/math.ts";
import { Atlases, scaledSprites } from "./atlasDefs.ts";

/** Size of a mask cell in world units. */
const CELL = 0.5;
/** Pixels per world unit, same as the client camera at zoom 1. */
const PPU = 16;
/** A cell counts as opaque only if every pixel in it has at least this alpha.
 * Glass skylights are ~100-160, anti-aliased seams between shapes dip a bit under 255. */
const MIN_ALPHA = 200;

const imageFolder = Path.resolve(import.meta.dirname, "../public/img");
const outFile = Path.resolve(
    import.meta.dirname,
    "../../shared/defs/mapObjects/buildings/roofMasks.ts",
);

const spriteFiles: Record<string, string> = {};
for (const atlas of Object.values(Atlases)) {
    for (const file of atlas.images) {
        spriteFiles[Path.basename(file).replace(/\.(svg|png)$/, ".img")] = file;
    }
}

const images = new Map<string, { image: Image; w: number; h: number }>();

async function loadSprite(sprite: string) {
    let res = images.get(sprite);
    if (!res) {
        const file = spriteFiles[sprite];
        if (!file) throw new Error(`No image file for sprite ${sprite}`);
        const image = await loadImage(Path.join(imageFolder, file));
        // Sprites scaled inside the sheets are also that much smaller in game
        const scale = scaledSprites[file] ?? 1;
        res = { image, w: Math.ceil(image.width * scale), h: Math.ceil(image.height * scale) };
        images.set(sprite, res);
    }
    return res;
}

/** Stop adding rects once this share of opaque cells is covered, or at this many rects. */
const MIN_COVERAGE = 0.98;
const MAX_RECTS = 24;
/** Rects smaller than this many cells aren't worth sending (1 cell = 0.25 square units). */
const MIN_RECT_CELLS = 16;

/**
 * Largest all-true rectangle in a grid, the classic histogram + stack method.
 */
function largestRect(grid: boolean[][]) {
    const w = grid[0]?.length ?? 0;
    const heights = new Array<number>(w).fill(0);
    let best = { area: 0, x0: 0, x1: 0, y0: 0, y1: 0 };
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < w; x++) heights[x] = grid[y][x] ? heights[x] + 1 : 0;
        const stack: number[] = [];
        for (let x = 0; x <= w; x++) {
            const h = x < w ? heights[x] : 0;
            while (stack.length && heights[stack[stack.length - 1]] >= h) {
                const top = stack.pop()!;
                const height = heights[top];
                const x0 = stack.length ? stack[stack.length - 1] + 1 : 0;
                const area = height * (x - x0);
                if (area > best.area) {
                    best = { area, x0, x1: x, y0: y - height + 1, y1: y + 1 };
                }
            }
            stack.push(x);
        }
    }
    return best;
}

/**
 * Draws a building's ceiling images in building space (ori 0) the same way `Building.m_render`
 * does on the client, and returns opaque rects as [minX, minY, maxX, maxY] in world units.
 */
async function computeMask(def: BuildingDef): Promise<number[]> {
    const imgs = def.ceiling.imgs.filter((img) => img.sprite && img.sprite !== "none");

    let ext = 0;
    const loaded = [];
    for (const img of imgs) {
        const sprite = await loadSprite(img.sprite);
        const halfW = (sprite.w * img.scale) / PPU / 2;
        const halfH = (sprite.h * img.scale) / PPU / 2;
        const pos = img.pos ?? { x: 0, y: 0 };
        ext = Math.max(ext, Math.abs(pos.x) + Math.hypot(halfW, halfH), Math.abs(pos.y) + Math.hypot(halfW, halfH));
        loaded.push({ img, sprite });
    }
    ext = Math.ceil(ext / CELL) * CELL;

    const size = Math.round(ext * 2 * PPU);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    for (const { img, sprite } of loaded) {
        const pos = img.pos ?? { x: 0, y: 0 };
        ctx.save();
        // world is y up, canvas is y down, like the screen
        ctx.translate((pos.x + ext) * PPU, (ext - pos.y) * PPU);
        ctx.rotate(math.oriToRad(img.rot ?? 0));
        ctx.scale(img.scale * (img.mirrorX ? -1 : 1), img.scale * (img.mirrorY ? -1 : 1));
        ctx.globalAlpha = img.alpha;
        ctx.drawImage(sprite.image, -sprite.w / 2, -sprite.h / 2, sprite.w, sprite.h);
        ctx.restore();
    }

    const alpha = ctx.getImageData(0, 0, size, size).data;
    const cellPx = CELL * PPU;
    const cells = size / cellPx;
    const opaque: boolean[][] = [];
    for (let cy = 0; cy < cells; cy++) {
        const row: boolean[] = [];
        for (let cx = 0; cx < cells; cx++) {
            let solid = true;
            for (let py = cy * cellPx; py < (cy + 1) * cellPx && solid; py++) {
                for (let px = cx * cellPx; px < (cx + 1) * cellPx; px++) {
                    if (alpha[(py * size + px) * 4 + 3] < MIN_ALPHA) {
                        solid = false;
                        break;
                    }
                }
            }
            row.push(solid);
        }
        opaque.push(row);
    }

    // Cover the opaque cells with a few big rects, largest first.
    // Leftover slivers are dropped, which only makes the server send a bit more.
    const free = opaque.map((row) => row.slice());
    const rects: number[] = [];
    let covered = 0;
    const total = free.flat().filter(Boolean).length;
    while (rects.length / 4 < MAX_RECTS && covered < total * MIN_COVERAGE) {
        const best = largestRect(free);
        if (best.area < MIN_RECT_CELLS) break;
        for (let cy = best.y0; cy < best.y1; cy++) {
            for (let cx = best.x0; cx < best.x1; cx++) free[cy][cx] = false;
        }
        covered += best.area;
        rects.push(
            best.x0 * CELL - ext,
            ext - best.y1 * CELL,
            best.x1 * CELL - ext,
            ext - best.y0 * CELL,
        );
    }
    return rects;
}

const masks: Record<string, number[]> = {};
const defs = (MapObjectDefs as unknown as { _defs: Record<string, BuildingDef> })._defs;
for (const type of Object.keys(defs).sort()) {
    const def = defs[type];
    if (def.type !== "building") continue;
    if (!def.ceiling.zoomRegions.some((region) => region.zoomIn)) continue;
    if (!def.ceiling.imgs.some((img) => img.sprite && img.sprite !== "none")) continue;
    masks[type] = await computeMask(def);
}

const body = Object.entries(masks)
    .map(([type, rects]) => {
        const lines = [];
        for (let i = 0; i < rects.length; i += 4) {
            lines.push(`        [${rects.slice(i, i + 4).join(", ")}],`);
        }
        return `    ${type}: [\n${lines.join("\n")}\n    ],`;
    })
    .join("\n");

fs.writeFileSync(
    outFile,
    `// dprint-ignore-file
// Generated by client/atlas-builder/roofMasks.ts, don't edit by hand.
// Rerun it after changing ceiling images or building ceiling defs: cd client && pnpm roofMasks
//
// For each building with a roof, the areas where the roof art is fully opaque,
// in building space (ori 0) as [minX, minY, maxX, maxY] rects.
export const RoofMasks: Record<string, Array<[number, number, number, number]>> = {
${body}
};
`,
);

const totalRects = Object.values(masks).reduce((n, r) => n + r.length / 4, 0);
console.log(`Wrote ${Object.keys(masks).length} roof masks (${totalRects} rects) to ${outFile}`);
