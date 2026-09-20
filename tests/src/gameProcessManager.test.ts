import { expect, test, vi } from "vitest";
import { GameProcess, GameProcessManager, ProcState } from "../../server/src/game/gameProcessManager.ts";
import { type ProcessMsg, ProcessMsgType } from "../../server/src/game/ipcTypes.ts";
import type { FindGamePrivateBody } from "../../server/src/utils/types.ts";
import { GameConfig, TeamMode } from "../../shared/gameConfig.ts";

test.each(["normal", "ranked"])(
    "a delayed ranked allocation cannot populate a worker reused for a %s game",
    async mode => {
        const duel = { seriesId: "series", roundId: "round", round: 1, teamSize: 1 as const };
        const addJoinTokens = vi.fn();
        const process = Object.assign(Object.create(GameProcess.prototype), {
            gameData: { id: "original-game", duel, stopped: false },
            state: ProcState.CreatingGame,
            onCreatedCbs: [],
            avaliableSlots: 2,
            addJoinTokens,
        }) as GameProcess;
        const manager = Object.assign(Object.create(GameProcessManager.prototype), {
            processes: [process],
        }) as GameProcessManager;
        const request: FindGamePrivateBody = {
            region: "local",
            version: GameConfig.protocolVersion,
            mapName: "duel",
            teamMode: TeamMode.Solo,
            autoFill: false,
            duel,
            playerData: [0, 1].map(i => ({
                joinToken: `token-${i}`,
                userId: null,
                ip: "127.0.0.1",
                duelProfileId: `player-${i}`,
                duelName: `Player${i}`,
                duelTeam: i as 0 | 1,
            })),
        };
        const finding = manager.findGame(request);
        expect(process.onCreatedCbs).toHaveLength(1);
        // The original creation was cancelled and this process now hosts another arena.
        process.gameData.id = "replacement-game";
        process.gameData.duel = mode === "ranked"
            ? { ...duel, roundId: "replacement-round", phase: "connecting", connected: 0, expected: 2 }
            : undefined;
        process.state = ProcState.Running;
        for (const callback of process.onCreatedCbs) callback(process);
        expect(await finding).toBeUndefined();
        expect(addJoinTokens).not.toHaveBeenCalled();
    },
);

test("region population excludes stopped arenas retained for process reuse", () => {
    // Exercise the manager method without constructing timers or child processes.
    const manager = Object.assign(Object.create(GameProcessManager.prototype), {
        processes: [
            { gameData: { stopped: false, aliveCount: 3 } },
            { gameData: { stopped: true, aliveCount: 8 } },
            { gameData: { stopped: true, aliveCount: 2 } },
            { gameData: { stopped: false, aliveCount: 4 } },
        ],
    }) as GameProcessManager;
    expect(manager.getPlayerCount()).toBe(7);
    for (const process of manager.processes) process.gameData.stopped = true;
    expect(manager.getPlayerCount()).toBe(0);
});

test("individual removal targets only the exact reserved round and returns its confirmed combat", async () => {
    const snapshot = { seriesId: "series", roundId: "round", round: 1, gameId: "game", players: [] };
    const removeDuelPlayer = vi.fn().mockResolvedValue(snapshot);
    const other = vi.fn();
    const manager = Object.assign(Object.create(GameProcessManager.prototype), {
        processes: [
            { gameData: { duel: { seriesId: "series", roundId: "round" } }, removeDuelPlayer },
            { gameData: { duel: { seriesId: "series", roundId: "other-round" } }, removeDuelPlayer: other },
            { gameData: {}, removeDuelPlayer: other },
        ],
    }) as GameProcessManager;
    expect(await manager.removeDuelPlayer("series", "round", "player")).toEqual(snapshot);
    expect(removeDuelPlayer).toHaveBeenCalledExactlyOnceWith("series", "round", "player");
    expect(other).not.toHaveBeenCalled();
});

test("removal waits for its correlated IPC acknowledgement and expires unconfirmed requests", async () => {
    vi.useFakeTimers();
    try {
        const send = vi.fn(), requests = new Map();
        const process = Object.assign(Object.create(GameProcess.prototype), {
            process: { killed: false, channel: true, send },
            gameData: {},
            duelRemovalRequests: requests,
        }) as GameProcess;
        const receive = (message: ProcessMsg) =>
            (process as unknown as { _onProcessMsg(msg: ProcessMsg): void })._onProcessMsg(message);
        const first = process.removeDuelPlayer("series", "round", "player");
        const request = send.mock.calls[0][0];
        expect(request).toMatchObject({
            type: ProcessMsgType.RemoveDuelPlayer,
            seriesId: "series",
            roundId: "round",
            profileId: "player",
        });
        receive({ type: ProcessMsgType.DuelPlayerRemoved, requestId: "different-request" });
        expect(requests.size).toBe(1);
        const combat = { seriesId: "series", roundId: "round", round: 1, gameId: "game", players: [] };
        receive({ type: ProcessMsgType.DuelPlayerRemoved, requestId: request.requestId, combat });
        expect(await first).toEqual(combat);
        expect(requests.size).toBe(0);
        const second = process.removeDuelPlayer("series", "round", "player");
        const rejected = expect(second).rejects.toThrow("did not confirm");
        await vi.advanceTimersByTimeAsync(3000);
        await rejected;
        expect(requests.size).toBe(0);
    } finally {
        vi.useRealTimers();
    }
});
