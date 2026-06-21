import { afterEach, describe, expect, it } from "vitest";
import { TeamMode } from "../../shared/gameConfig.ts";
import { Config } from "../../server/src/config.ts";
import type { JoinTokenData } from "../../server/src/game/game.ts";
import {
    hasParticipantConflict,
    type ParticipantRecord,
} from "../../server/src/utils/matchmaking.ts";
import { createGame } from "./gameTestHelpers.ts";

const originalMatchmakingConfig = { ...Config.matchmaking };

afterEach(() => {
    Object.assign(Config.matchmaking, originalMatchmakingConfig);
});

function addPlayers(count: number) {
    const game = createGame(TeamMode.Solo, "test_normal");
    for (let i = 0; i < count; i++) {
        game.playerBarn.addTestPlayer({});
    }
    return game;
}

function joinData(params: Partial<JoinTokenData>): JoinTokenData {
    return {
        expiresAt: Date.now() + 10000,
        userId: null,
        findGameIp: "127.0.0.1",
        reservationId: "reservation-a",
        groupData: {
            autoFill: true,
            playerCount: 1,
            groupHashToJoin: "",
        },
        ...params,
    };
}

describe("late-join matchmaking", () => {
    it("keeps the original early join window separate from late matchmaking", () => {
        const game = addPlayers(4);

        game.started = true;
        game.startedTime = Config.matchmaking.earlyJoinWindowSeconds + 1;
        game.gas.circleIdx = 0;

        expect(game.isEarlyJoinWindowOpen).toBe(false);
        expect(game.canUpdateGroupSpawnAnchor).toBe(false);
        expect(game.canAcceptMatchmakingPlayers).toBe(true);
    });

    it("does not late-join games that are too old, too small, or past the gas limit", () => {
        const tooSmall = addPlayers(Config.matchmaking.lateJoinMinAliveCount - 1);
        tooSmall.started = true;
        tooSmall.startedTime = Config.matchmaking.earlyJoinWindowSeconds + 1;
        tooSmall.gas.circleIdx = 0;
        expect(tooSmall.canAcceptMatchmakingPlayers).toBe(false);

        const tooOld = addPlayers(Config.matchmaking.lateJoinMinAliveCount);
        tooOld.started = true;
        tooOld.startedTime = Config.matchmaking.lateJoinMaxStartedTime + 1;
        tooOld.gas.circleIdx = 0;
        expect(tooOld.canAcceptMatchmakingPlayers).toBe(false);

        const tooLateGas = addPlayers(Config.matchmaking.lateJoinMinAliveCount);
        tooLateGas.started = true;
        tooLateGas.startedTime = Config.matchmaking.earlyJoinWindowSeconds + 1;
        tooLateGas.gas.circleIdx = Config.matchmaking.lateJoinMaxGasCircleIdx + 1;
        expect(tooLateGas.canAcceptMatchmakingPlayers).toBe(false);
    });

    it("records participant identities permanently for a match", () => {
        const game = addPlayers(1);
        const firstJoin = joinData({
            userId: "user-1",
            clientId: "11111111-1111-4111-8111-111111111111",
            findGameIp: "127.0.0.10",
            reservationId: "reservation-a",
        });

        game.registerParticipant(firstJoin);

        expect(game.hasParticipantConflict(joinData({ userId: "user-1" }))).toBe(true);
        expect(
            game.hasParticipantConflict(
                joinData({
                    clientId: "11111111-1111-4111-8111-111111111111",
                    findGameIp: "127.0.0.20",
                    reservationId: "reservation-b",
                }),
            ),
        ).toBe(true);
        expect(
            game.hasParticipantConflict(
                joinData({
                    findGameIp: "127.0.0.10",
                    reservationId: "reservation-b",
                }),
            ),
        ).toBe(true);
    });

    it("allows same-reservation IP matches but blocks later IP re-entry", () => {
        const records: ParticipantRecord[] = [
            {
                key: "ip:127.0.0.10",
                reservationId: "reservation-a",
            },
        ];
        const keys = ["ip:127.0.0.10"];

        expect(hasParticipantConflict(records, keys, "reservation-a")).toBe(false);
        expect(hasParticipantConflict(records, keys, "reservation-b")).toBe(true);
    });
});
