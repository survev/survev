import type { MapDefKey } from "../../../shared/defs/mapDefs.ts";
import { DamageType, TeamMode } from "../../../shared/gameConfig.ts";
import type { DuelCombatSnapshot, DuelCombatStats } from "../../../shared/types/rankedCombat.ts";
import type { Loadout } from "../../../shared/utils/loadout.ts";
import { math } from "../../../shared/utils/math.ts";
import { v2 } from "../../../shared/utils/v2.ts";
import { Config } from "../config.ts";
import { ServerLogger } from "../utils/logger.ts";
import {
    type DuelPlayerAbandoned,
    type DuelRoundResult,
    type DuelRoundStatus,
    type FindGamePrivateBody,
    type ServerGameConfig,
} from "../utils/types.ts";
import { ClientBarn } from "./client.ts";
import { GameModeManager } from "./gameModeManager.ts";
import { Grid } from "./grid.ts";
import { GameMap } from "./map.ts";
import { AirdropBarn } from "./objects/airdrop.ts";
import { BulletBarn } from "./objects/bullet.ts";
import { DeadBodyBarn } from "./objects/deadBody.ts";
import { DecalBarn } from "./objects/decal.ts";
import { ExplosionBarn } from "./objects/explosion.ts";
import { type GameObject, ObjectRegister } from "./objects/gameObject.ts";
import { Gas } from "./objects/gas.ts";
import { LootBarn } from "./objects/loot.ts";
import { MapIndicatorBarn } from "./objects/mapIndicator.ts";
import { PlaneBarn } from "./objects/plane.ts";
import { type Player, PlayerBarn } from "./objects/player.ts";
import { ProjectileBarn } from "./objects/projectile.ts";
import { SmokeBarn } from "./objects/smoke.ts";
import { Profiler } from "./profiler.ts";

export interface JoinTokenData {
    userId: string | null;
    findGameIp: string;
    loadout?: Loadout;
    quests?: string[];
    duelProfileId?: string;
    duelTeam?: 0 | 1;
    duelName?: string;
    groupData: {
        autoFill: boolean;
        playerCount: number;
        groupHashToJoin: string;
    };
}

export interface SpectateTokenData {
    playerId: number;
    specAnon: boolean;
    noSpecCooldown: boolean;
}

type JoinToken = {
    type: "join";
    expiresAt: number;
    data: JoinTokenData;
} | {
    type: "spectate";
    expiresAt: number;
    data: SpectateTokenData;
};

export class Game {
    started = false;
    stopped = false;
    over = false;
    winningTeamId = 0;
    startedTime = 0;
    stopTicker = 0;
    timeRunning = 0;
    // used to stop the game if theres no connected players
    noPlayersTicker = 0;

    id: string;
    teamMode: TeamMode;
    mapName: MapDefKey;
    isTeamMode: boolean;
    config: ServerGameConfig;
    modeManager: GameModeManager;

    now!: number;
    profiler = new Profiler();
    perfTicker = 0;
    tickTimes: number[] = [];

    tickTimeWarnThreshold = (1000 / Config.gameTps) * 4;
    gameTickWarnings = 0;

    netSyncWarnThreshold = (1000 / Config.netSyncTps) * 4;
    netSyncWarnings = 0;

    joinTokens = new Map<string, JoinToken>();

    /** Reserved identities remain attached to their original player across reconnects. */
    readonly duelPlayers = new Map<string, Player>();
    private duelCountdown = 3;
    private duelCountdownEndsAt?: number;
    private duelDisconnectedSeconds = new Map<string, number>();
    private duelRemovedProfiles = new Set<string>();
    private duelAbandonedProfiles = new Set<string>();
    private duelRemovingPlayers = false;
    private duelResult?: DuelRoundResult;
    private duelResultReported = false;
    private duelRemovedCombat = new Map<string, DuelCombatStats>();
    private duelCombatFinal?: DuelCombatSnapshot;

    /** Read the original player objects, never client/spectator connections. */
    getDuelCombatSnapshot(): DuelCombatSnapshot | undefined {
        return this.duelCombatFinal ?? this.snapshotDuelCombat(null);
    }

    private snapshotDuelCombat(winnerTeam: 0 | 1 | null): DuelCombatSnapshot | undefined {
        const duel = this.config.duel;
        if (!duel) return;
        return {
            seriesId: duel.seriesId,
            roundId: duel.roundId,
            round: duel.round,
            gameId: this.id,
            players: duel.roster.map(member => {
                const removed = this.duelRemovedCombat.get(member.profileId);
                if (removed) return { ...removed };
                const player = this.duelPlayers.get(member.profileId);
                return {
                    profileId: member.profileId,
                    kills: player?.kills ?? 0,
                    damageDealt: Math.round(player?.damageDealt ?? 0),
                    roundWins: Number(
                        this.started && member.team === winnerTeam && !this.duelRemovedProfiles.has(member.profileId),
                    ),
                };
            }),
        };
    }

    private get activeDuelRoster() {
        return this.config.duel?.roster.filter(p => !this.duelRemovedProfiles.has(p.profileId)) ?? [];
    }

    get gameplayFrozen(): boolean {
        // A decided round still simulates its native victory celebration and accepts key releases.
        return this.stopped || (!!this.config.duel && !this.started);
    }

    get duelStatus(): DuelRoundStatus | undefined {
        const duel = this.config.duel;
        if (!duel) return;
        return {
            seriesId: duel.seriesId,
            roundId: duel.roundId,
            round: duel.round,
            phase: this.over
                ? "finished"
                : this.started
                ? "playing"
                : this.duelCountdownEndsAt
                ? "countdown"
                : "connecting",
            connected: this.activeDuelRoster.filter(p => {
                const player = this.duelPlayers.get(p.profileId);
                return player && !player.disconnected;
            }).length,
            expected: this.activeDuelRoster.length,
            countdownEndsAt: this.duelCountdownEndsAt,
        };
    }

    /** Only the server's reserved roster can populate this round. */
    canJoinDuel(data: JoinTokenData): boolean {
        const duel = this.config.duel;
        if (!duel) return true;
        if (this.over || !data.duelProfileId || this.duelRemovedProfiles.has(data.duelProfileId)) return false;
        const member = duel.roster.find(p => p.profileId === data.duelProfileId);
        if (!member || member.team !== data.duelTeam || member.name !== data.duelName) return false;
        const existing = this.duelPlayers.get(member.profileId);
        return existing ? existing.disconnected : !this.started;
    }

    resetDuelDisconnectGrace(profileId: string) {
        this.duelDisconnectedSeconds.delete(profileId);
    }

    private updateDuel(dt: number) {
        const duel = this.config.duel;
        if (!duel || this.over) return;
        const roster = this.activeDuelRoster;
        // The coordinator settles a series when an entire side forfeits.
        if (new Set(roster.map(p => p.team)).size < 2) return;
        if (!this.started) {
            const status = this.duelStatus!;
            if (status.connected === status.expected) {
                if (!this.duelCountdownEndsAt) {
                    this.duelCountdownEndsAt = Date.now() + this.duelCountdown * 1000;
                    this.updateData();
                }
                this.duelCountdown -= dt;
                if (this.duelCountdown <= 0) {
                    this.started = true;
                    this.duelCountdownEndsAt = undefined;
                    this.gas.advanceGasStage();
                    this.updateData();
                }
            } else {
                if (this.duelCountdownEndsAt) {
                    this.duelCountdownEndsAt = undefined;
                    this.duelCountdown = 3;
                    this.updateData();
                }
                if (this.timeRunning >= 45) {
                    const missing = roster.filter(p => {
                        const player = this.duelPlayers.get(p.profileId);
                        return !player || player.disconnected;
                    });
                    if (duel.round > 1) {
                        this.removeDuelPlayers(missing.map(p => p.profileId), true);
                        return;
                    }
                    const missingTeams = ([0, 1] as const).filter(team => missing.some(p => p.team === team));
                    this.finishDuel(null, "connection_timeout", missingTeams, missing.map(p => p.profileId));
                }
            }
            return;
        }

        const abandoned: string[] = [];
        for (const member of roster) {
            const player = this.duelPlayers.get(member.profileId);
            const seconds = player?.disconnected ? (this.duelDisconnectedSeconds.get(member.profileId) ?? 0) + dt : 0;
            this.duelDisconnectedSeconds.set(member.profileId, seconds);
            if (seconds >= 15) abandoned.push(member.profileId);
        }
        if (abandoned.length) this.removeDuelPlayers(abandoned, true);
    }

    private finishDuel(
        winnerTeam: 0 | 1 | null,
        reason: DuelRoundResult["reason"],
        missingTeams?: Array<0 | 1>,
        missingProfileIds?: string[],
    ) {
        const duel = this.config.duel;
        if (!duel || this.duelResult) return;
        this.over = true;
        const celebrate = this.started && winnerTeam !== null;
        this.stopTicker = celebrate ? 3 : 1.8;
        this.playerBarn.sendWinEmoteTicker = 1;
        const winner = this.activeDuelRoster.find(p => p.team === winnerTeam && this.duelPlayers.has(p.profileId));
        this.winningTeamId = winner ? this.duelPlayers.get(winner.profileId)?.teamId ?? 0 : 0;
        // Celebration still simulates normally; ranked counters stop at the actual decision.
        this.duelCombatFinal = this.snapshotDuelCombat(winnerTeam);
        this.duelResult = {
            seriesId: duel.seriesId,
            roundId: duel.roundId,
            round: duel.round,
            gameId: this.id,
            winnerTeam,
            reason,
            started: this.started,
            missingTeams,
            missingProfileIds,
            abandonedProfileIds: [...this.duelAbandonedProfiles],
            combat: this.duelCombatFinal,
        };
        // Reporting immediately would make the coordinator replace the arena before celebration ends.
        if (!celebrate) this.reportDuelResult();
        this.updateData();
    }

    private reportDuelResult() {
        if (!this.duelResult || this.duelResultReported) return;
        this.duelResultReported = true;
        this._reportDuelResult(this.duelResult);
    }

    /** The coordinator owns cancellation/series forfeits; stopping here must not award a round. */
    cancelDuel(seriesId: string, roundId: string): boolean {
        if (this.config.duel?.seriesId !== seriesId || this.config.duel.roundId !== roundId) return false;
        this.over = true;
        this.duelResult = undefined;
        this.stop();
        return true;
    }

    /** An individual forfeit removes only that reserved player; teammates retain their round. */
    removeDuelPlayer(seriesId: string, roundId: string, profileId: string): boolean {
        const duel = this.config.duel;
        if (duel?.seriesId !== seriesId || duel.roundId !== roundId || this.stopped) return false;
        if (!duel.roster.some(p => p.profileId === profileId)) return false;
        this.removeDuelPlayers([profileId], false);
        return true;
    }

    private removeDuelPlayers(profileIds: string[], abandoned: boolean) {
        const duel = this.config.duel!;
        const removed = profileIds.filter(id => !this.duelRemovedProfiles.has(id));
        if (!removed.length) return;
        const combat = this.getDuelCombatSnapshot()!;
        // Mark the whole batch first so simultaneous disconnects cannot invent a winner.
        for (const id of removed) {
            const stats = combat.players.find(player => player.profileId === id);
            if (stats) this.duelRemovedCombat.set(id, { ...stats });
            this.duelRemovedProfiles.add(id);
            this.duelDisconnectedSeconds.delete(id);
            if (abandoned) this.duelAbandonedProfiles.add(id);
            for (const [token, data] of this.joinTokens) {
                if (data.type === "join" && data.data.duelProfileId === id) this.joinTokens.delete(token);
            }
        }
        this.duelRemovingPlayers = true;
        try {
            for (const profileId of removed) {
                const player = this.duelPlayers.get(profileId);
                if (player) {
                    player.clearHeldInput();
                    player.kill({ damageType: DamageType.Bleeding, dir: v2.create(0, 0) });
                    this.clientBarn.handleSocketClose(player.client.socket);
                    player.client.disconnect("invalid_token");
                }
            }
        } finally {
            this.duelRemovingPlayers = false;
        }
        if (!this.started) {
            this.duelCountdown = 3;
            this.duelCountdownEndsAt = undefined;
        } else if (!this.over) {
            const aliveTeams = new Set(
                this.activeDuelRoster.filter(p => !this.duelPlayers.get(p.profileId)?.dead).map(p => p.team),
            );
            if (aliveTeams.size <= 1) {
                this.finishDuel(aliveTeams.values().next().value ?? null, aliveTeams.size ? "disconnect" : "draw");
            }
        }
        if (abandoned) {
            const combat = this.getDuelCombatSnapshot();
            for (const profileId of removed) {
                this._reportDuelPlayerAbandoned({
                    seriesId: duel.seriesId,
                    roundId: duel.roundId,
                    round: duel.round,
                    gameId: this.id,
                    profileId,
                    abandonedProfileIds: [...this.duelAbandonedProfiles],
                    combat,
                });
            }
        }
        this.updateData();
    }

    get aliveCount(): number {
        return this.playerBarn.livingPlayers.length;
    }

    grid: Grid<GameObject>;
    map: GameMap;
    gas: Gas;
    objectRegister: ObjectRegister;

    clientBarn: ClientBarn;
    playerBarn: PlayerBarn;
    lootBarn: LootBarn;
    deadBodyBarn: DeadBodyBarn;
    decalBarn: DecalBarn;
    projectileBarn: ProjectileBarn;
    bulletBarn: BulletBarn;
    smokeBarn: SmokeBarn;
    airdropBarn: AirdropBarn;
    explosionBarn: ExplosionBarn;
    planeBarn: PlaneBarn;
    mapIndicatorBarn: MapIndicatorBarn;

    logger: ServerLogger;

    // for debug
    preventStart = false;
    debugSpeedMulti = 1;

    constructor(id: string, config: ServerGameConfig) {
        const start = Date.now();
        this.id = id;
        this.logger = new ServerLogger(`Game #${this.id.substring(0, 4)}`);
        this.logger.info("Creating");

        this.config = config;

        this.teamMode = config.teamMode;
        this.mapName = config.mapName;
        this.isTeamMode = this.teamMode !== TeamMode.Solo;

        this.map = new GameMap(this);
        this.grid = new Grid(this.map.width, this.map.height);
        this.objectRegister = new ObjectRegister(this.grid);

        this.clientBarn = new ClientBarn(this);
        this.playerBarn = new PlayerBarn(this);
        this.lootBarn = new LootBarn(this);
        this.deadBodyBarn = new DeadBodyBarn(this);
        this.decalBarn = new DecalBarn(this);
        this.projectileBarn = new ProjectileBarn(this);
        this.bulletBarn = new BulletBarn(this);
        this.smokeBarn = new SmokeBarn(this);
        this.airdropBarn = new AirdropBarn(this);
        this.explosionBarn = new ExplosionBarn(this);
        this.planeBarn = new PlaneBarn(this);
        this.mapIndicatorBarn = new MapIndicatorBarn();

        this.gas = new Gas(this);

        this.modeManager = new GameModeManager(this);

        if (this.map.factionMode) {
            for (let i = 1; i <= this.map.mapDef.gameMode.factions!; i++) {
                this.playerBarn.addTeam(i);
            }
        }

        this.map.init();

        this.logger.info(`Created in ${Date.now() - start} ms`);

        this.updateData();
    }

    update(dt?: number) {
        if (this.stopped) return;
        this.profiler.flush();

        const now = performance.now();
        if (!this.now) this.now = now;
        dt ??= math.clamp((now - this.now) / 1000, 0.001, 1 / 8);

        this.timeRunning += dt;

        dt *= this.debugSpeedMulti;

        this.now = now;

        if (this.over) {
            this.stopTicker -= dt;
            if (this.stopTicker <= 0) {
                this.stop();
                return;
            }
        }

        if (this.config.duel) {
            this.updateDuel(dt);
            if (!this.started) {
                this.clientBarn.update(dt);
                return;
            }
        }

        if (!this.config.duel && !this.started && !this.preventStart) {
            this.started = this.modeManager.isGameStarted();
            if (this.started) {
                this.gas.advanceGasStage();
            } else {
                const connected = this.playerBarn.players.reduce((a, b) => {
                    return a + (b.disconnected ? 0 : 1);
                }, 0);
                if (connected === 0) {
                    this.noPlayersTicker += dt;
                } else {
                    this.noPlayersTicker = 0;
                }
                // after 30 seconds of no connected players on a game that didn't start
                // we just force stop the game so it doesn't run forever...
                if (this.noPlayersTicker > 30) {
                    this.over = true;
                    this.stop();
                    return;
                }
            }
        }

        if (this.started) this.startedTime += dt;

        //
        // Update modules
        //
        this.profiler.addSample("gas");
        this.gas.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("players");
        this.playerBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("clients");
        this.clientBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("map");
        this.map.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("loot");
        this.lootBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("bullets");
        this.bulletBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("projectiles");
        this.projectileBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("explosions");
        this.explosionBarn.update();
        this.profiler.endSample();

        this.profiler.addSample("smoke");
        this.smokeBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("airdrops");
        this.airdropBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("deadBodies");
        this.deadBodyBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("decals");
        this.decalBarn.update(dt);
        this.profiler.endSample();

        this.profiler.addSample("planes");
        this.planeBarn.update(dt);
        this.profiler.endSample();

        const tickTime = performance.now() - this.now;

        if (tickTime > 1000) {
            let errString = `Tick took over 1 second! ${tickTime.toFixed(2)}ms\n`;
            errString += "Profiler stats:\n";
            errString += this.profiler.getStats();
            this.logger.error(errString);
        } else if (tickTime > this.tickTimeWarnThreshold) {
            this.logger.warn(
                `Tick took over ${this.tickTimeWarnThreshold}ms! ${tickTime.toFixed(2)}ms`,
            );
            this.gameTickWarnings++;

            if (this.gameTickWarnings > 20) {
                let errString = `Server is overloaded! Increasing tickTimeWarnThreshold.\n`;
                errString += "Profiler stats:\n";
                errString += this.profiler.getStats();
                this.logger.warn(errString);

                this.gameTickWarnings = 0;
                this.tickTimeWarnThreshold *= 2;
            }
        }

        if (Config.logging.debugLogs) {
            this.tickTimes.push(tickTime);

            this.perfTicker += dt;
            if (this.perfTicker >= 15) {
                this.perfTicker = 0;
                const mspt = this.tickTimes.reduce((a, b) => a + b) / this.tickTimes.length;

                this.logger.debug(
                    `Avg ms/tick: ${mspt.toFixed(2)} | Load: ${((mspt / (1000 / Config.gameTps)) * 100).toFixed(1)}%`,
                );
                this.tickTimes = [];
            }
        }
    }

    netSync() {
        if (this.stopped) return;

        const start = performance.now();

        // serialize objects and send msgs
        this.objectRegister.serializeObjs();
        this.clientBarn.sendMsgs();

        //
        // reset stuff
        //
        this.clientBarn.flush();
        this.playerBarn.flush();
        this.lootBarn.flush();
        this.planeBarn.flush();
        this.bulletBarn.flush();
        this.objectRegister.flush();
        this.explosionBarn.flush();
        this.gas.flush();
        this.mapIndicatorBarn.flush();

        const syncTime = performance.now() - start;
        if (syncTime > 1000) {
            this.logger.error(`Tick took over 1 second! ${syncTime.toFixed(2)}ms`);
        } else if (syncTime > this.netSyncWarnThreshold) {
            this.logger.warn(
                `Tick took over ${this.netSyncWarnThreshold}ms! ${syncTime.toFixed(2)}ms`,
            );
            this.netSyncWarnings++;

            if (this.netSyncWarnings > 20) {
                this.logger.warn(
                    `Server is overloaded! Increasing netSyncWarnThreshold.`,
                );

                this.netSyncWarnings = 0;
                this.netSyncWarnThreshold *= 2;
            }
        }
    }

    get canJoin(): boolean {
        if (this.config.duel) {
            return !this.over && !this.started && this.activeDuelRoster.some(p => !this.duelPlayers.has(p.profileId));
        }
        return (
            this.aliveCount < this.map.mapDef.gameMode.maxPlayers
            && !this.over
            && this.startedTime < 60
        );
    }

    checkGameOver() {
        if (this.over) return;

        if (this.config.duel) {
            if (!this.started || this.duelRemovingPlayers) return;
            const aliveTeams = new Set(
                this.activeDuelRoster.filter(p => {
                    const player = this.duelPlayers.get(p.profileId);
                    return player && !player.dead;
                }).map(p => p.team),
            );
            if (aliveTeams.size <= 1) {
                this.finishDuel(aliveTeams.values().next().value ?? null, aliveTeams.size ? "elimination" : "draw");
            }
            return;
        }

        const didGameEnd = this.started && this.modeManager.aliveCount() <= 1;

        if (didGameEnd) {
            this.over = true;

            // send win emoji after 1 second
            this.playerBarn.sendWinEmoteTicker = 1;
            // stop game after 1.8s
            this.stopTicker = 1.8;

            this.playerBarn.factionsMvp = this.modeManager.getFactionMvp();
            this.winningTeamId = this.modeManager.getWinningTeamId();
            this.updateData();
        }
    }

    addJoinTokens(tokens: FindGamePrivateBody["playerData"], autoFill: boolean) {
        if (this.config.duel) {
            for (const team of [0, 1] as const) {
                const members = tokens.filter(t =>
                    t.duelTeam === team && !this.duelRemovedProfiles.has(t.duelProfileId ?? "")
                );
                this.storeJoinTokens(members, false);
            }
            return;
        }
        this.storeJoinTokens(tokens, autoFill);
    }

    private storeJoinTokens(tokens: FindGamePrivateBody["playerData"], autoFill: boolean) {
        const groupData = {
            playerCount: tokens.length,
            groupHashToJoin: "",
            autoFill,
        };

        for (const token of tokens) {
            this.joinTokens.set(token.joinToken, {
                type: "join",
                expiresAt: Date.now() + (this.config.duel ? 10 * 60 * 1000 : 10000),
                data: {
                    userId: token.userId,
                    groupData,
                    findGameIp: token.ip,
                    loadout: token.loadout,
                    quests: token.quests,
                    duelProfileId: token.duelProfileId,
                    duelTeam: token.duelTeam,
                    duelName: token.duelName,
                },
            });
        }
    }

    addSpectateToken(token: string, data: SpectateTokenData) {
        this.joinTokens.set(token, {
            type: "spectate",
            expiresAt: Date.now() + 60000,
            data,
        });
    }

    stop() {
        if (this.stopped) return;
        if (this.config.duel) {
            for (const player of this.playerBarn.players) {
                player.clearHeldInput();
                player.cancelAction();
                player.cancelAnim();
                player.weaponManager.scheduledReload = false;
                player.weaponManager.bursts.length = 0;
                player.weaponManager.meleeAttacks.length = 0;
                player.weaponManager.bufferInput = false;
                player.weaponManager.cookTicker = 0;
                player.actionDirty = true;
            }
            // Deliver stopped animations/actions before closing the socket and exposing the next round.
            this.netSync();
            this.reportDuelResult();
        }
        this.stopped = true;
        for (const client of this.clientBarn.clients) {
            client.disconnect();
        }
        this.logger.info("Game Ended");
        this._saveGameToDatabase();
        this.updateData();
    }

    // implementation of those is on gameProcess.ts
    // this keeps the base Game class free of nodejs imports and the ability to make network requests
    // to make offline mode and unit tests easier to maintain

    updateData() {}
    protected _saveGameToDatabase() {}
    protected _reportDuelResult(_result: DuelRoundResult) {}
    protected _reportDuelPlayerAbandoned(_result: DuelPlayerAbandoned) {}
    sendQuestProgress(_userId: string, _progress: Array<{ id: string; delta: number }>) {}

    /**
     * Steps the game X seconds in the future
     * This is done in smaller steps of 0.1 seconds
     * To make sure everything updates properly
     *
     * Used for unit tests, don't call this on actual game code :p
     */
    step(seconds: number) {
        for (let i = 0, steps = seconds * 10; i < steps; i++) {
            this.update(0.1);
        }
    }
}
