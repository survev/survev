import { describe, expect, test } from "vitest";
import { Config } from "../../server/src/config.ts";
import type { Client } from "../../server/src/game/client.ts";
import { Game } from "../../server/src/game/game.ts";
import { getDuelRoundConfig } from "../../server/src/game/gameProcessManager.ts";
import { NoOpSocket } from "../../server/src/game/socket.ts";
import type { DuelPlayerAbandoned, DuelRoundResult, FindGamePrivateBody } from "../../server/src/utils/types.ts";
import { GameConfig, GasMode, Input, TeamMode } from "../../shared/gameConfig.ts";
import { EditMsg } from "../../shared/net/editMsg.ts";
import { InputMsg } from "../../shared/net/inputMsg.ts";
import { JoinMsg } from "../../shared/net/joinMsg.ts";
import { AliveCountsMsg, JoinedMsg, MapMsg, MsgStream, MsgType, UpdateMsg } from "../../shared/net/net.ts";
import { ObjectType } from "../../shared/net/objectSerializeFns.ts";
import { loadout } from "../../shared/utils/loadout.ts";
import { v2 } from "../../shared/utils/v2.ts";

class DuelTestGame extends Game {
    results: DuelRoundResult[] = [];
    abandonments: DuelPlayerAbandoned[] = [];
    override _reportDuelResult(result: DuelRoundResult) {
        this.results.push(result);
    }
    override _reportDuelPlayerAbandoned(result: DuelPlayerAbandoned) {
        this.abandonments.push(result);
    }
}

class RecordingSocket extends NoOpSocket<Client> {
    packets: ArrayBuffer[] = [];
    override send(data: Uint8Array<ArrayBuffer>) {
        this.packets.push(data.slice().buffer);
    }
}

function readUpdate(packet: ArrayBuffer) {
    const stream = new MsgStream(packet);
    for (;;) {
        const type = stream.deserializeMsgType();
        if (type === MsgType.Update) {
            const update = new UpdateMsg();
            update.deserialize(stream.stream, { m_getTypeById: () => ObjectType.Invalid });
            return update;
        }
        const msg = type === MsgType.Joined
            ? new JoinedMsg()
            : type === MsgType.Map
            ? new MapMsg()
            : type === MsgType.AliveCounts
            ? new AliveCountsMsg()
            : undefined;
        if (!msg) throw new Error(`Expected game update, received message type ${type}`);
        msg.deserialize(stream.stream);
        stream.stream.readAlignToNextByte();
    }
}

function request(teamSize: 1 | 2 | 3 | 4 = 1, round = 1): FindGamePrivateBody {
    return {
        region: "local",
        version: GameConfig.protocolVersion,
        autoFill: false,
        mapName: "duel",
        teamMode: teamSize === 1 ? TeamMode.Solo : teamSize === 2 ? TeamMode.Duo : TeamMode.Squad,
        duel: { seriesId: "series", roundId: `round-${round}`, round, teamSize },
        playerData: Array.from({ length: teamSize * 2 }, (_, i) => ({
            joinToken: `token-${i}`,
            userId: null,
            ip: "127.0.0.1",
            duelProfileId: `profile-${i}`,
            duelName: `Player${i}`,
            duelTeam: (i < teamSize ? 0 : 1) as 0 | 1,
        })),
    };
}

function createDuel(size: 1 | 2 | 3 | 4 = 1, round = 1) {
    Config.logging.infoLogs = false;
    Config.logging.debugLogs = false;
    Config.logging.logDate = false;
    const body = request(size, round);
    const game = new DuelTestGame("ranked-test", {
        mapName: "duel",
        teamMode: body.teamMode,
        duel: getDuelRoundConfig(body),
    });
    game.addJoinTokens(body.playerData, false);
    return game;
}

function join(game: Game, index: number, bot = false, socket = new NoOpSocket<Client>()) {
    const msg = new JoinMsg();
    msg.protocol = GameConfig.protocolVersion;
    msg.joinToken = `token-${index}`;
    msg.name = "SpoofedName";
    msg.bot = bot;
    msg.loadout = loadout.defaultLoadout();
    const stream = new MsgStream(new ArrayBuffer(1024));
    stream.serializeMsg(MsgType.Join, msg);
    const bytes = stream.getBuffer();
    game.clientBarn.handleMsg(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), socket);
    const client = socket.getUserData()!;
    return { client, socket, player: client?.player };
}

describe("ranked duel rounds", () => {
    test("dead teammates cannot switch to enemy spectating during a living teammate's reconnect grace", () => {
        const game = createDuel(2);
        const players = [0, 1, 2, 3].map(i => join(game, i));
        game.step(3.1);
        players[0].player!.kill({
            damageType: GameConfig.DamageType.Player,
            dir: v2.create(1, 0),
            source: players[2].player!,
        });
        game.clientBarn.handleSocketClose(players[1].socket);
        expect(game.over).toBe(false);
        expect(players[0].client.getSpectablePlayers().map(player => player.__id)).toEqual([players[1].player!.__id]);
        players[0].client.spectating = players[0].client.getNewPlayerToSpectate();
        expect(players[0].client.spectating).toBe(players[1].player);
        expect(join(game, 1).player).toBe(players[1].player);
        game.step(0.2);
        expect(players[0].client.spectating).toBe(players[1].player);
    });

    test.each([1, 2, 3, 4] as const)(
        "team size %s: exact teams, compact normal island and complete roster start",
        size => {
            const game = createDuel(size);
            const members = Array.from({ length: size * 2 }, (_, i) => join(game, i).player!);
            expect(game.map.width).toBe([280, 336, 420, 560][size - 1]);
            expect(game.map.height).toBe(game.map.width);
            expect(game.map.buildings.length).toBeGreaterThan(2);
            expect(game.lootBarn.loots.length).toBeGreaterThan(10);
            expect(members.every(p => game.map.canPlayerSpawn(p.pos))).toBe(true);
            expect(members[0].pos.x).toBeGreaterThan(game.map.width / 2);
            expect(members[size].pos.x).toBeLessThan(game.map.width / 2);
            expect(new Set(members.slice(0, size).map(p => p.teamId)).size).toBe(1);
            expect(new Set(members.slice(size).map(p => p.teamId)).size).toBe(1);
            expect(members[0].teamId).not.toBe(members[size].teamId);
            if (size > 1) {
                expect(game.playerBarn.groups.map(g => [g.players.length, g.maxPlayers])).toEqual([[size, size], [
                    size,
                    size,
                ]]);
            }
            game.step(2.8);
            expect(game.started).toBe(false);
            expect(game.duelStatus?.phase).toBe("countdown");
            game.step(0.3);
            expect(game.started).toBe(true);
            expect(game.gas.duration).toBe(60);
            expect(game.results).toEqual([]);
        },
    );

    test("no movement, inventory actions, damage, gas or time advantage before everyone connects", () => {
        const game = createDuel();
        const first = join(game, 0);
        const origin = v2.copy(first.player!.pos);
        const input = new InputMsg();
        input.moveLeft = input.shootStart = input.shootHold = true;
        input.inputs = [Input.Loot, Input.Interact];
        first.client.handleMsg(MsgType.Input, input);
        first.player!.damage({ amount: 200, damageType: GameConfig.DamageType.Gas, dir: v2.create(1, 0) });
        game.step(20);
        expect(first.player!.pos).toEqual(origin);
        expect(first.player!.health).toBe(100);
        expect(first.player!.timeAlive).toBe(0);
        expect(first.player!.shootHold).toBe(false);
        expect(game.gas.mode).toBe(GasMode.Inactive);
        expect(game.started).toBe(false);
        expect(game.over).toBe(false);
        expect(game.results).toEqual([]);
        join(game, 1);
        game.step(3.1);
        expect(game.started).toBe(true);
        first.client.handleMsg(MsgType.Input, input);
        expect(first.player!.moveLeft).toBe(true);
    });

    test("server names and reserved identities reject impostors and duplicate players", () => {
        const game = createDuel();
        const first = join(game, 0);
        expect(first.player!.name).toBe("Player0");
        expect(join(game, 0).socket.closed()).toBe(true);
        expect(game.aliveCount).toBe(1);
        const token = game.joinTokens.get("token-1")!;
        if (token.type !== "join") throw new Error();
        expect(game.canJoinDuel({ ...token.data, duelProfileId: "outsider" })).toBe(false);
        expect(game.canJoinDuel({ ...token.data, duelTeam: 0 })).toBe(false);
        expect(game.canJoinDuel({ ...token.data, duelName: "SpoofedName" })).toBe(false);
    });

    test("trios require two full unique rosters", () => {
        const body = request(3);
        expect(() => getDuelRoundConfig({ ...body, playerData: body.playerData.slice(0, 5) })).toThrow();
        body.playerData[5].duelProfileId = body.playerData[0].duelProfileId;
        expect(() => getDuelRoundConfig(body)).toThrow();
        const unequal = request(3);
        unequal.playerData[5].duelTeam = 0;
        expect(() => getDuelRoundConfig(unequal)).toThrow();
    });

    test("later rounds admit only the remaining reserved players while retaining the original arena and team size", () => {
        const body = request(3, 2);
        body.playerData = body.playerData.filter((_, i) => [1, 3, 4].includes(i));
        const game = new DuelTestGame("partial-roster", {
            mapName: "duel",
            teamMode: TeamMode.Squad,
            duel: getDuelRoundConfig(body),
        });
        game.addJoinTokens(body.playerData, false);
        expect(game.map.width).toBe(420);
        join(game, 1);
        join(game, 3);
        game.step(5);
        expect(game.started).toBe(false);
        join(game, 4);
        game.step(3.1);
        expect(game.started).toBe(true);
        expect(game.duelStatus).toMatchObject({ expected: 3, connected: 3 });
        expect(game.playerBarn.groups.map(g => [g.players.length, g.maxPlayers])).toEqual([[1, 3], [2, 3]]);
        expect(join(game, 0).socket.closed()).toBe(true);
        expect(game.over).toBe(false);
        expect(() => getDuelRoundConfig({ ...body, duel: { ...body.duel!, round: 1 } })).toThrow();
        expect(() => getDuelRoundConfig({ ...body, playerData: body.playerData.filter(p => p.duelTeam === 1) }))
            .toThrow();
    });

    test("an individual forfeit removes only that player and permanently invalidates their round tokens", () => {
        const game = createDuel(3);
        const players = Array.from({ length: 6 }, (_, i) => join(game, i));
        game.step(3.1);
        expect(game.removeDuelPlayer("wrong-series", "round-1", "profile-1")).toBe(false);
        expect(game.removeDuelPlayer("series", "old-round", "profile-1")).toBe(false);
        expect(game.removeDuelPlayer("series", "round-1", "outsider")).toBe(false);
        expect(game.removeDuelPlayer("series", "round-1", "profile-1")).toBe(true);
        expect(players[1].player!.dead).toBe(true);
        expect(players[1].socket.closed()).toBe(true);
        expect(game.aliveCount).toBe(5);
        expect(game.over).toBe(false);
        expect(game.duelStatus).toMatchObject({ expected: 5, connected: 5 });
        expect(game.results).toEqual([]);
        expect(game.abandonments).toEqual([]);
        expect(game.removeDuelPlayer("series", "round-1", "profile-1")).toBe(true);
        game.addJoinTokens(request(3).playerData.filter(p => p.duelProfileId === "profile-1"), false);
        expect(game.joinTokens.has("token-1")).toBe(false);
        expect(join(game, 1).socket.closed()).toBe(true);
        const input = new InputMsg();
        input.moveRight = true;
        players[0].client.handleMsg(MsgType.Input, input);
        expect(players[0].player!.moveRight).toBe(true);
    });

    test("one forfeiting player does not block the remaining team's shared countdown", () => {
        const game = createDuel(2);
        join(game, 0);
        join(game, 2);
        join(game, 3);
        expect(game.removeDuelPlayer("series", "round-1", "profile-1")).toBe(true);
        game.step(2.8);
        expect(game.started).toBe(false);
        game.step(0.3);
        expect(game.started).toBe(true);
        expect(game.aliveCount).toBe(3);
        expect(game.results).toEqual([]);
    });

    test("individual disconnects get a fresh reconnect grace, then abandon only that player", () => {
        const game = createDuel(2);
        const players = Array.from({ length: 4 }, (_, i) => join(game, i));
        game.step(3.1);
        game.clientBarn.handleSocketClose(players[0].socket);
        game.step(10);
        const returned = join(game, 0);
        expect(returned.player).toBe(players[0].player);
        game.clientBarn.handleSocketClose(returned.socket);
        game.step(14.8);
        expect(game.abandonments).toEqual([]);
        expect(players[0].player!.dead).toBe(false);
        game.step(0.4);
        expect(game.abandonments).toMatchObject([{
            seriesId: "series",
            roundId: "round-1",
            round: 1,
            gameId: game.id,
            profileId: "profile-0",
            abandonedProfileIds: ["profile-0"],
        }]);
        expect(players[0].player!.dead).toBe(true);
        expect(game.aliveCount).toBe(3);
        expect(game.over).toBe(false);
        expect(join(game, 0).socket.closed()).toBe(true);
        game.step(16);
        expect(game.abandonments).toHaveLength(1);
        expect(game.results).toEqual([]);
    });

    test("later-round missing players are reported individually and remaining teammates can start", () => {
        const game = createDuel(2, 2);
        join(game, 0);
        join(game, 2);
        join(game, 3);
        game.step(45.2);
        expect(game.abandonments).toHaveLength(1);
        expect(game.abandonments[0]).toMatchObject({ profileId: "profile-1", roundId: "round-2", round: 2 });
        expect(game.started).toBe(false);
        expect(game.duelStatus).toMatchObject({ expected: 3, connected: 3 });
        game.step(3.1);
        expect(game.started).toBe(true);
        expect(game.results).toEqual([]);
        expect(join(game, 1).socket.closed()).toBe(true);
    });

    test("development edit packets and bot flags never enable ranked cheats", () => {
        const game = createDuel();
        const player = join(game, 0, true).player!;
        join(game, 1);
        game.step(3.1);
        expect(player.bot).toBe(false);
        const edit = new EditMsg();
        edit.godMode = edit.noClip = edit.preventGameStart = true;
        edit.gameSpeedEnabled = edit.speedEnabled = true;
        edit.gameSpeed = 50;
        edit.speed = 1000;
        edit.spawnLootType = "m249";
        edit.loadNewMap = true;
        edit.newMapSeed = 42;
        const seed = game.map.seed;
        const lootCount = game.lootBarn.loots.length;
        const stream = new MsgStream(new ArrayBuffer(512));
        stream.serializeMsg(MsgType.Edit, edit);
        expect(game.clientBarn.deserializeMsg(stream.getBuffer().buffer).msg).toBeUndefined();
        player.client.handleMsg(MsgType.Edit, edit);
        expect(player.debug.godMode).toBe(false);
        expect(player.debug.noClip).toBe(false);
        expect(player.debug.speedEnabled).toBe(false);
        expect(game.debugSpeedMulti).toBe(1);
        expect(game.map.seed).toBe(seed);
        expect(game.lootBarn.loots).toHaveLength(lootCount);
    });

    test("missing connection cancels without a winner, never awarding an empty round", () => {
        const game = createDuel();
        join(game, 0);
        game.step(45.2);
        expect(game.results).toHaveLength(1);
        expect(game.results[0]).toMatchObject({
            winnerTeam: null,
            reason: "connection_timeout",
            started: false,
            missingTeams: [1],
            missingProfileIds: ["profile-1"],
        });
        expect(game.abandonments).toEqual([]);
    });

    test("initial timeout identifies only absent active participants across both teams", () => {
        const game = createDuel(3);
        join(game, 0);
        join(game, 3);
        const disconnected = join(game, 4);
        game.clientBarn.handleSocketClose(disconnected.socket);
        game.removeDuelPlayer("series", "round-1", "profile-2");
        game.step(45.2);
        expect(game.results).toHaveLength(1);
        expect(game.results[0]).toMatchObject({
            winnerTeam: null,
            started: false,
            reason: "connection_timeout",
            missingTeams: [0, 1],
            missingProfileIds: ["profile-1", "profile-4", "profile-5"],
            abandonedProfileIds: [],
        });
        expect(game.results[0].combat!.players.every(p => p.kills === 0 && p.damageDealt === 0 && p.roundWins === 0))
            .toBe(true);
        expect(game.abandonments).toEqual([]);
        game.step(1);
        expect(game.results).toHaveLength(1);
    });

    test("a player who reconnects before the initial deadline is not reported missing", () => {
        const game = createDuel(2);
        join(game, 0);
        const returning = join(game, 1);
        join(game, 2);
        game.clientBarn.handleSocketClose(returning.socket);
        game.step(20);
        expect(join(game, 1).player).toBe(returning.player);
        game.step(25.2);
        expect(game.results[0].missingProfileIds).toEqual(["profile-3"]);
    });

    test("authoritative team elimination reports precisely once", () => {
        const game = createDuel(3);
        const players = Array.from({ length: 6 }, (_, i) => join(game, i).player!);
        game.step(3.1);
        for (const player of players.slice(3)) {
            player.kill({ damageType: GameConfig.DamageType.Player, dir: v2.create(1, 0), source: players[0] });
        }
        game.checkGameOver();
        expect(game.over).toBe(true);
        expect(game.results).toEqual([]);
        game.step(2.9);
        expect(game.stopped).toBe(false);
        expect(game.results).toEqual([]);
        game.step(0.2);
        expect(game.results).toHaveLength(1);
        expect(game.results[0]).toMatchObject({
            winnerTeam: 0,
            reason: "elimination",
            started: true,
            roundId: "round-1",
        });
        expect(game.winningTeamId).toBe(players[0].teamId);
        game.step(2);
        expect(game.stopped).toBe(true);
        expect(game.results).toHaveLength(1);
    });

    test("post-win movement, fire releases and action timers run before a clean delayed transition", () => {
        const game = createDuel();
        const socket = new RecordingSocket();
        const winner = join(game, 0, false, socket);
        const loser = join(game, 1).player!;
        const player = winner.player!;
        game.step(3.1);

        // Locate a clear real movement corridor, without disabling collision or other game mechanics.
        let corridor: ReturnType<typeof v2.create> | undefined;
        for (let x = 45; x < game.map.width - 60 && !corridor; x += 10) {
            for (let y = 45; y < game.map.height - 45 && !corridor; y += 10) {
                if (
                    Array.from({ length: 15 }, (_, offset) => game.map.canPlayerSpawn(v2.create(x + offset, y))).every(
                        Boolean,
                    )
                ) {
                    corridor = v2.create(x, y);
                }
            }
        }
        expect(corridor).toBeDefined();
        player.pos.x = corridor!.x;
        player.pos.y = corridor!.y;
        game.grid.updateObject(player);
        player.invManager.set("9mm", 100);
        player.weaponManager.setWeapon(GameConfig.WeaponSlot.Primary, "mp5", 30);
        player.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Primary, true);
        game.step(0.5);
        const origin = v2.copy(player.pos);
        const held = new InputMsg();
        held.seq = 1;
        held.moveRight = held.shootStart = held.shootHold = true;
        winner.client.handleMsg(MsgType.Input, held);
        loser.kill({ damageType: GameConfig.DamageType.Player, dir: v2.create(1, 0), source: player });
        game.step(0.3);
        expect(game.over).toBe(true);
        expect(game.gameplayFrozen).toBe(false);
        expect(game.results).toEqual([]);
        expect(player.pos.x).toBeGreaterThan(origin.x);
        expect(player.weapons[GameConfig.WeaponSlot.Primary].ammo).toBeLessThan(30);

        const release = new InputMsg();
        release.seq = 2;
        winner.client.handleMsg(MsgType.Input, release);
        const ammoAfterRelease = player.weapons[GameConfig.WeaponSlot.Primary].ammo;
        game.step(0.3);
        expect(winner.client.ack).toBe(2);
        expect(player.shootHold).toBe(false);
        expect(player.moveRight).toBe(false);
        expect(player.weapons[GameConfig.WeaponSlot.Primary].ammo).toBe(ammoAfterRelease);

        player.health = 50;
        player.invManager.set("healthkit", 1);
        const heal = new InputMsg();
        heal.useItem = "healthkit";
        winner.client.handleMsg(MsgType.Input, heal);
        game.step(0.4);
        expect(player.actionType).toBe(GameConfig.Action.UseItem);
        expect(player.action.time).toBeGreaterThan(0);
        const cancel = new InputMsg();
        cancel.inputs = [Input.Cancel];
        winner.client.handleMsg(MsgType.Input, cancel);
        expect(player.actionType).toBe(GameConfig.Action.None);

        game.step(1.6);
        expect(game.stopped).toBe(false);
        heal.moveRight = true;
        winner.client.handleMsg(MsgType.Input, heal);
        expect(player.actionType).toBe(GameConfig.Action.UseItem);
        game.step(0.5);
        expect(game.stopped).toBe(true);
        expect(player.moveRight).toBe(false);
        expect(player.shootStart).toBe(false);
        expect(player.shootHold).toBe(false);
        expect(player.actionType).toBe(GameConfig.Action.None);
        expect(player.animType).toBe(GameConfig.Anim.None);
        expect(game.results).toHaveLength(1);
        expect(game.results[0].winnerTeam).toBe(0);
        const finalState = readUpdate(socket.packets.at(-1)!);
        expect(finalState.activePlayerData.actionDirty).toBe(true);
        expect(finalState.activePlayerData.action.duration).toBe(0);
        winner.client.handleMsg(MsgType.Input, held);
        expect(player.shootHold).toBe(false);
        game.stop();
        game.checkGameOver();
        expect(game.results).toHaveLength(1);
    });

    test("a coordinator cancellation during celebration does not publish a stale pending round", () => {
        const game = createDuel();
        const winner = join(game, 0).player!;
        const loser = join(game, 1).player!;
        game.step(3.1);
        loser.kill({ damageType: GameConfig.DamageType.Player, dir: v2.create(1, 0), source: winner });
        expect(game.over).toBe(true);
        expect(game.results).toEqual([]);
        expect(game.cancelDuel("series", "round-1")).toBe(true);
        game.step(10);
        expect(game.results).toEqual([]);
    });

    test("reconnect restores the original player and resets full-side disconnect grace", () => {
        const game = createDuel();
        const first = join(game, 0);
        expect(game.joinTokens.has("token-0")).toBe(true);
        join(game, 1);
        game.step(3.1);
        game.clientBarn.handleSocketClose(first.socket);
        game.step(10);
        expect(game.results).toEqual([]);
        const returned = join(game, 0);
        expect(returned.player).toBe(first.player);
        expect(game.aliveCount).toBe(2);
        expect(game.playerBarn.players).toHaveLength(2);
        game.step(0.1);
        game.clientBarn.handleSocketClose(returned.socket);
        game.step(14);
        expect(game.results).toEqual([]);
        game.step(1.2);
        expect(game.over).toBe(true);
        expect(game.results).toEqual([]);
        game.step(3.1);
        expect(game.results[0]).toMatchObject({ winnerTeam: 1, reason: "disconnect", started: true });
    });

    test("reconnect sends a complete owner snapshot over the wire after previous dirty flags were flushed", () => {
        const game = createDuel(2);
        const first = join(game, 0);
        for (let i = 1; i < 4; i++) join(game, i);
        game.step(3.1);
        const player = first.player!;
        player.health = 73;
        player.boost = 37;
        player.invManager.set("9mm", 44);
        player.weaponManager.setWeapon(GameConfig.WeaponSlot.Primary, "m9", 9);
        player.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Primary, true);
        game.netSync();
        expect(player.weapsDirty).toBe(false);
        expect(player.inventoryDirty).toBe(false);

        game.clientBarn.handleSocketClose(first.socket);
        const socket = new RecordingSocket();
        expect(join(game, 0, false, socket).player).toBe(player);
        game.netSync();
        const snapshot = readUpdate(socket.packets[0]);
        expect(snapshot.activePlayerId).toBe(player.__id);
        expect(snapshot.activePlayerIdDirty).toBe(true);
        expect(snapshot.activePlayerData).toMatchObject({
            healthDirty: true,
            health: expect.closeTo(73, 0),
            boostDirty: true,
            boost: expect.closeTo(37, 0),
            zoomDirty: true,
            actionDirty: true,
            inventoryDirty: true,
            inventory: { "9mm": 44 },
            weapsDirty: true,
            curWeapIdx: GameConfig.WeaponSlot.Primary,
            spectatorCountDirty: true,
        });
        expect(snapshot.activePlayerData.weapons).toHaveLength(GameConfig.WeaponSlot.Count);
        expect(snapshot.activePlayerData.weapons[snapshot.activePlayerData.curWeapIdx]).toEqual({
            type: "m9",
            ammo: 9,
        });
        expect(snapshot.fullObjects.some(obj => obj.__id === player.__id)).toBe(true);
        expect(snapshot.playerInfos).toHaveLength(4);
        expect(snapshot.gasDirty).toBe(true);
        expect(snapshot.gasTDirty).toBe(true);
        expect(snapshot.groupStatusDirty).toBe(true);
        expect(snapshot.groupStatus).toHaveLength(2);

        game.netSync();
        const delta = readUpdate(socket.packets[1]);
        expect(delta.activePlayerIdDirty).toBe(false);
        expect(delta.activePlayerData.weapsDirty).toBe(false);
        expect(delta.activePlayerData.inventoryDirty).toBe(false);
    });

    test("ordinary game tokens remain single-use while ranked tokens still expire", () => {
        const normal = new Game("ordinary", { mapName: "test_normal", teamMode: TeamMode.Solo });
        normal.addJoinTokens([{ joinToken: "token-0", userId: null, ip: "127.0.0.1" }], false);
        expect(join(normal, 0).player).toBeDefined();
        expect(normal.joinTokens.has("token-0")).toBe(false);
        expect(join(normal, 0).socket.closed()).toBe(true);

        const ranked = createDuel();
        ranked.joinTokens.get("token-0")!.expiresAt = Date.now() - 1;
        expect(join(ranked, 0).socket.closed()).toBe(true);
        expect(ranked.joinTokens.has("token-0")).toBe(false);
        expect(ranked.aliveCount).toBe(0);
    });

    test("small-island river generation accepts the coast-crossing live regression seed", () => {
        const game = createDuel(4);
        game.map.regenerate(1367769627);
        expect(game.map.normalRivers).toHaveLength(1);
        const players = Array.from({ length: 8 }, (_, i) => join(game, i).player!);
        expect(players.every(p => game.map.canPlayerSpawn(p.pos))).toBe(true);
    });

    test("a countdown disconnect pauses and restarts the shared three seconds", () => {
        const game = createDuel();
        join(game, 0);
        const second = join(game, 1);
        game.step(2);
        game.clientBarn.handleSocketClose(second.socket);
        game.step(0.1);
        expect(game.duelStatus?.phase).toBe("connecting");
        join(game, 1);
        game.step(2.8);
        expect(game.started).toBe(false);
        game.step(0.3);
        expect(game.started).toBe(true);
    });

    test("both sides abandoning produces no invented winner", () => {
        const game = createDuel();
        const players = [join(game, 0), join(game, 1)];
        game.step(3.1);
        for (const p of players) game.clientBarn.handleSocketClose(p.socket);
        game.step(15.2);
        expect(game.results[0]).toMatchObject({
            winnerTeam: null,
            reason: "draw",
            abandonedProfileIds: ["profile-0", "profile-1"],
        });
        expect(game.abandonments.map(p => p.profileId)).toEqual(["profile-0", "profile-1"]);
        expect(game.abandonments.every(p => p.abandonedProfileIds?.join(",") === "profile-0,profile-1")).toBe(true);
    });

    test.each([false, true])(
        "coordinator cancellation stops the exact round without a result (started: %s)",
        started => {
            const game = createDuel();
            const sockets = [join(game, 0).socket, join(game, 1).socket];
            if (started) game.step(3.1);
            expect(game.cancelDuel("different-series", "round-1")).toBe(false);
            expect(game.cancelDuel("series", "old-round")).toBe(false);
            expect(game.stopped).toBe(false);
            expect(game.cancelDuel("series", "round-1")).toBe(true);
            expect(game.stopped).toBe(true);
            expect(sockets.every(s => s.closed())).toBe(true);
            game.step(60);
            game.checkGameOver();
            expect(game.results).toEqual([]);
        },
    );
});
