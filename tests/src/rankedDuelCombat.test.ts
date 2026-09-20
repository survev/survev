import { describe, expect, test } from "vitest";
import { Config } from "../../server/src/config.ts";
import type { Client } from "../../server/src/game/client.ts";
import { Game } from "../../server/src/game/game.ts";
import { NoOpSocket } from "../../server/src/game/socket.ts";
import type { DuelPlayerAbandoned, DuelRoundResult } from "../../server/src/utils/types.ts";
import { DamageType, GameConfig, TeamMode } from "../../shared/gameConfig.ts";
import { JoinMsg, MsgStream, MsgType } from "../../shared/net/net.ts";
import { loadout } from "../../shared/utils/loadout.ts";
import { v2 } from "../../shared/utils/v2.ts";

class CombatGame extends Game {
    results: DuelRoundResult[] = [];
    abandonments: DuelPlayerAbandoned[] = [];
    override _reportDuelResult(result: DuelRoundResult) {
        this.results.push(result);
    }
    override _reportDuelPlayerAbandoned(result: DuelPlayerAbandoned) {
        this.abandonments.push(result);
    }
}

function arena(size: 1 | 2 = 1) {
    Config.logging.infoLogs = Config.logging.debugLogs = false;
    const roster = Array.from(
        { length: size * 2 },
        (_, i) => ({ profileId: `player-${i}`, name: `Player${i}`, team: (i < size ? 0 : 1) as 0 | 1 }),
    );
    const game = new CombatGame("combat-game", {
        mapName: "duel",
        teamMode: size === 1 ? TeamMode.Solo : TeamMode.Duo,
        duel: { seriesId: "series", roundId: "round", round: 1, teamSize: size, roster },
    });
    game.addJoinTokens(
        roster.map((p, i) => ({
            joinToken: `token-${i}`,
            userId: null,
            ip: "127.0.0.1",
            duelProfileId: p.profileId,
            duelTeam: p.team,
            duelName: p.name,
        })),
        false,
    );
    return game;
}
function join(game: Game, index: number) {
    const msg = new JoinMsg();
    msg.protocol = GameConfig.protocolVersion;
    msg.joinToken = `token-${index}`;
    msg.loadout = loadout.defaultLoadout();
    const stream = new MsgStream(new ArrayBuffer(1024));
    stream.serializeMsg(MsgType.Join, msg);
    const socket = new NoOpSocket<Client>(), bytes = stream.getBuffer();
    game.clientBarn.handleMsg(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), socket);
    return { socket, player: socket.getUserData()!.player! };
}

describe("authoritative ranked combat snapshots", () => {
    test("a team wipe counts the final elimination and the nested downed teammate kill", () => {
        const game = arena(2), players = [0, 1, 2, 3].map(i => join(game, i).player);
        game.step(3.1);
        players[2].damage({ amount: 100, source: players[0], damageType: DamageType.Player, dir: v2.create(1, 0) });
        expect(players[2].downed).toBe(true);
        players[3].damage({ amount: 100, source: players[0], damageType: DamageType.Player, dir: v2.create(1, 0) });
        expect(game.over).toBe(true);
        expect(players[0].kills).toBe(2);
        expect(game.getDuelCombatSnapshot()!.players[0]).toEqual({
            profileId: "player-0",
            kills: 2,
            damageDealt: 200,
            roundWins: 1,
        });
    });

    test("native damage and kills survive reconnect exactly once and freeze before celebration", () => {
        const game = arena(), first = join(game, 0), second = join(game, 1);
        game.step(3.1);
        second.player.damage({ amount: 40, source: first.player, damageType: DamageType.Player, dir: v2.create(1, 0) });
        game.clientBarn.handleSocketClose(first.socket);
        expect(join(game, 0).player).toBe(first.player);
        second.player.damage({
            amount: 1000,
            source: first.player,
            damageType: DamageType.Player,
            dir: v2.create(1, 0),
        });
        const snapshot = game.getDuelCombatSnapshot();
        expect(snapshot).toEqual({
            seriesId: "series",
            roundId: "round",
            round: 1,
            gameId: "combat-game",
            players: [
                { profileId: "player-0", kills: 1, damageDealt: 100, roundWins: 1 },
                { profileId: "player-1", kills: 0, damageDealt: 0, roundWins: 0 },
            ],
        });
        // Native victory simulation can still change counters, but the ranked decision is final.
        first.player.damage({ amount: 10, source: second.player, damageType: DamageType.Player, dir: v2.create(1, 0) });
        expect(second.player.damageDealt).toBe(10);
        expect(game.getDuelCombatSnapshot()).toEqual(snapshot);
        expect(game.results).toHaveLength(0);
        game.step(3.1);
        expect(game.results).toHaveLength(1);
        expect(game.results[0].combat).toEqual(snapshot);
    });

    test("personal removal retains partial combat and only remaining winning members earn a round win", () => {
        const game = arena(2), players = [0, 1, 2, 3].map(i => join(game, i).player);
        game.step(3.1);
        players[2].damage({ amount: 20, source: players[0], damageType: DamageType.Player, dir: v2.create(1, 0) });
        game.removeDuelPlayer("series", "round", "player-0");
        // A projectile can outlive its removed owner; their series counters are already frozen.
        players[2].damage({ amount: 5, source: players[0], damageType: DamageType.Player, dir: v2.create(1, 0) });
        players[2].damage({ amount: 30, source: players[1], damageType: DamageType.Player, dir: v2.create(1, 0) });
        game.removeDuelPlayer("series", "round", "player-1");
        expect(game.getDuelCombatSnapshot()!.players).toEqual([
            { profileId: "player-0", kills: 0, damageDealt: 20, roundWins: 0 },
            { profileId: "player-1", kills: 0, damageDealt: 30, roundWins: 0 },
            { profileId: "player-2", kills: 0, damageDealt: 0, roundWins: 1 },
            { profileId: "player-3", kills: 0, damageDealt: 0, roundWins: 1 },
        ]);
        expect(game.removeDuelPlayer("series", "round", "player-0")).toBe(true);
        expect(game.getDuelCombatSnapshot()!.players).toHaveLength(4);
    });

    test("simultaneous abandonments carry one complete snapshot of every original participant", () => {
        const game = arena(2), clients = [0, 1, 2, 3].map(i => join(game, i));
        game.step(3.1);
        clients[2].player.damage({
            amount: 17,
            source: clients[0].player,
            damageType: DamageType.Player,
            dir: v2.create(1, 0),
        });
        clients[1].player.damage({
            amount: 13,
            source: clients[2].player,
            damageType: DamageType.Player,
            dir: v2.create(1, 0),
        });
        game.clientBarn.handleSocketClose(clients[0].socket);
        game.clientBarn.handleSocketClose(clients[2].socket);
        game.step(15.2);
        expect(game.over).toBe(false);
        expect(game.abandonments).toHaveLength(2);
        expect(game.abandonments[0].combat).toEqual(game.abandonments[1].combat);
        expect(game.abandonments[0].combat!.players.map(p => [p.profileId, p.damageDealt, p.roundWins])).toEqual([
            ["player-0", 17, 0],
            ["player-1", 0, 0],
            ["player-2", 13, 0],
            ["player-3", 0, 0],
        ]);
    });

    test("a no-contest includes zero counters for reserved players who never connected", () => {
        const game = arena();
        join(game, 0);
        game.step(46);
        expect(game.results[0].combat!.players).toEqual(
            [0, 1].map(i => ({ profileId: `player-${i}`, kills: 0, damageDealt: 0, roundWins: 0 })),
        );
    });
});
