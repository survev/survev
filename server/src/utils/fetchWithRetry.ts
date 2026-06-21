import { defaultLogger } from "./logger.ts";

export async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const maxAttempts = 3;

    for (let i = 1; i <= maxAttempts; i++) {
        try {
            const res = await fetch(input, init);

            const type = res.headers.get("Content-Type");
            if (!type?.toLowerCase().includes("application/json")) {
                throw new Error(`Expected json response, got ${type}`);
            }
            return res;
        } catch (e) {
            if (i === maxAttempts) {
                throw e;
            }
            defaultLogger.warn(`Failed to fetch ${input}, retrying`);

            await new Promise(res => setTimeout(res, i * 1500));
        }
    }
    // to make TS happy!
    // this should never run
    return undefined as unknown as Promise<Response>;
}
