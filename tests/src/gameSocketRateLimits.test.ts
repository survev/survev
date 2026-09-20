import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Config } from "../../server/src/config.ts";
import { GameSocketRateLimits } from "../../server/src/game/gameSocketRateLimits.ts";

const originalEnabled = Config.rateLimitsEnabled;
beforeEach(() => {
    vi.useFakeTimers();
    Config.rateLimitsEnabled = true;
});
afterEach(() => {
    Config.rateLimitsEnabled = originalEnabled;
    vi.clearAllTimers();
    vi.useRealTimers();
});

test("ranked admits a same-NAT 4v4 roster and overlapping reconnect sockets, with a bounded cap", () => {
    const limits = new GameSocketRateLimits();
    const ip = "192.0.2.1";
    const players = Array.from({ length: 8 }, () => limits.reserve(ip, true));
    expect(players.every(Boolean)).toBe(true);
    const reconnects = Array.from({ length: 8 }, () => limits.reserve(ip, true));
    expect(reconnects.every(Boolean)).toBe(true);
    expect(limits.reserve(ip, true)).toBeUndefined();
    for (const player of players) player!.release();
    vi.advanceTimersByTime(1000);
    expect(Array.from({ length: 8 }, () => limits.reserve(ip, true)).every(Boolean)).toBe(true);
    expect(limits.reserve(ip, true)).toBeUndefined();
});

test("normal connection limits stay at five and late ranked closes do not change them", () => {
    const limits = new GameSocketRateLimits();
    const ip = "192.0.2.2";
    const normal = Array.from({ length: 5 }, () => limits.reserve(ip, false));
    expect(normal.every(Boolean)).toBe(true);
    expect(limits.reserve(ip, false)).toBeUndefined();
    const ranked = Array.from({ length: 8 }, () => limits.reserve(ip, true));
    expect(ranked.every(Boolean)).toBe(true);
    for (const socket of ranked) {
        socket!.release();
        socket!.release();
    }
    vi.advanceTimersByTime(1000);
    expect(limits.reserve(ip, false)).toBeUndefined();
    normal[0]!.release();
    normal[0]!.release();
    expect(limits.reserve(ip, false)).toBeDefined();
    expect(limits.reserve(ip, false)).toBeUndefined();
});

test("failed/aborted upgrades release capacity once, without disabling message throttling", () => {
    const limits = new GameSocketRateLimits();
    const ip = "192.0.2.3";
    for (let i = 0; i < 20; i++) {
        const aborted = limits.reserve(ip, true);
        expect(aborted).toBeDefined();
        aborted!.release();
        aborted!.release();
        vi.advanceTimersByTime(1000);
    }
    const connected = Array.from({ length: 16 }, () => limits.reserve(ip, true));
    expect(connected.every(Boolean)).toBe(true);
    expect(limits.reserve(ip, true)).toBeUndefined();
    const counts = {};
    for (let i = 0; i < 500; i++) expect(connected[0]!.isRateLimited(counts)).toBeFalsy();
    expect(connected[0]!.isRateLimited(counts)).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(connected[0]!.isRateLimited(counts)).toBeFalsy();
});
