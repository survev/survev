import type { Context } from "hono";

/** An expected request rejection whose message is safe to display to the player. */
export class RankedRequestError extends Error {}

export async function readRankedJson(c: Context): Promise<unknown> {
    try {
        return await c.req.json();
    } catch (error) {
        if (error instanceof SyntaxError) throw new RankedRequestError("Invalid JSON request.");
        throw error;
    }
}
