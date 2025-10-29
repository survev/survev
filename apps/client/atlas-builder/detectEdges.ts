/**
 * Typescript port of https://github.com/GMartigny/detect-edges
 */

import type { Canvas } from "canvas";

/**
 * Check pixels transparency
 * @param tolerance - tolerance level
 */
const checkOpacityLevel = (tolerance: number) => (pixels: Uint8ClampedArray) => {
    let transparent = true;
    for (let i = 3, l = pixels.length; i < l && transparent; i += 4) {
        transparent = transparent && pixels[i] <= 255 * tolerance;
    }
    return transparent;
};

const defaultOptions = {
    tolerance: 0,
};

interface Options {
    tolerance: number;
}

export interface Edges {
    top: number;
    left: number;
    bottom: number;
    right: number;
}

/**
 * Smartly detect edges of an image
 * @param canvas - Tainted canvas element
 * @param options - Some options
 */
export function detectEdges(
    canvas: Canvas | HTMLCanvasElement,
    options?: Options,
): Edges {
    const { tolerance } = {
        ...defaultOptions,
        ...options,
    };

    const isTransparent = checkOpacityLevel(tolerance);

    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    const { width, height } = canvas;
    let pixels: Uint8ClampedArray;

    let top = -1;
    do {
        ++top;
        pixels = context.getImageData(0, top, width, 1).data;

        if (top >= height) {
            throw new Error("Can't detect edges.");
        }
    } while (isTransparent(pixels));

    // Left
    let left = -1;
    do {
        ++left;
        pixels = context.getImageData(left, top, 1, height - top).data;
    } while (isTransparent(pixels));

    // Bottom
    let bottom = -1;
    do {
        ++bottom;
        pixels = context.getImageData(left, height - bottom - 1, width - left, 1).data;
    } while (isTransparent(pixels));

    // Right
    let right = -1;
    do {
        ++right;
        pixels = context.getImageData(
            width - right - 1,
            top,
            1,
            height - (top + bottom),
        ).data;
    } while (isTransparent(pixels));

    return {
        top,
        right,
        bottom,
        left,
    };
}
