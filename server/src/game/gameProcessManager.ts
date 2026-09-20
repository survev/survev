import { type ChildProcess, fork } from "node:child_process";
import { randomBytes } from "node:crypto";
import { type MapDefKey, MapDefs } from "../../../shared/defs/mapDefs.ts";
import { TeamMode } from "../../../shared/gameConfig.ts";
import type { DuelCombatSnapshot } from "../../../shared/types/rankedCombat.ts";
import { util } from "../../../shared/utils/util.ts";
import { Config } from "../config.ts";
import { ServerLogger } from "../utils/logger.ts";
import {
    type DuelRoundConfig,
    type FindGamePrivateBody,
    type ServerGameConfig,
    type SpectateGamePrivateBody,
} from "../utils/types.ts";
import type { SpectateTokenData } from "./game.ts";
import { type GameData, type ProcessMsg, ProcessMsgType } from "./ipcTypes.ts";

let procFile: string;
let procArgv: string[];

if (import.meta.filename.endsWith(".ts")) {
    procFile = "src/game/gameProcess.ts";
    procArgv = ["--expose-gc", "--import", "tsx"];
} else {
    procArgv = [];
    procFile = "dist/gameProcess.js";
}

export enum ProcState {
    Idle,
    CreatingGame,
    Running,
}

export function getDuelRoundConfig(body: FindGamePrivateBody): DuelRoundConfig {
    const duel = body.duel;
    if (!duel || (duel.round === 1 && body.playerData.length !== duel.teamSize * 2)) {
        throw new Error("The first duel round requires two complete teams");
    }
    const ids = new Set<string>();
    const tokens = new Set<string>();
    const roster = body.playerData.map(p => {
        if (
            !p.duelProfileId || !p.duelName || p.duelTeam === undefined || ids.has(p.duelProfileId)
            || tokens.has(p.joinToken)
        ) {
            throw new Error("Invalid or duplicate duel roster identity");
        }
        ids.add(p.duelProfileId);
        tokens.add(p.joinToken);
        return { profileId: p.duelProfileId, team: p.duelTeam, name: p.duelName };
    });
    if (
        [0, 1].some(team => {
            const count = roster.filter(p => p.team === team).length;
            return count < 1 || count > duel.teamSize || (duel.round === 1 && count !== duel.teamSize);
        })
    ) {
        throw new Error("Duel teams need at least one reserved player and cannot exceed the original team size");
    }
    return { ...duel, roster };
}

export class GameProcess {
    process: ChildProcess;
    port: number;

    gameData: GameData = {
        id: "",
        teamMode: 0 as TeamMode,
        mapName: "" as MapDefKey,
        canJoin: false,
        aliveCount: 0,
        startedTime: 0,
        stopped: false,
        timeRunning: 0,
        livingPlayers: [],
    };

    state = ProcState.Idle;

    createdTime = Date.now();

    stoppedTime = Date.now();
    lastMsgTime = Date.now();

    manager: GameProcessManager;

    onCreatedCbs: Array<(_proc: typeof this) => void> = [];

    avaliableSlots = 0;

    reusedCount = 0;
    private duelRemovalRequests = new Map<string, (combat?: DuelCombatSnapshot) => void>();

    constructor(
        manager: GameProcessManager,
        id: string,
        config: ServerGameConfig,
        port: number,
    ) {
        this.manager = manager;
        this.port = port;

        this.process = fork(procFile, [port.toString()], {
            serialization: "advanced",
            execArgv: procArgv,
        });

        this.process.on("message", (msg: ProcessMsg) => {
            this._onProcessMsg(msg);
        });

        this.create(id, config);
    }

    private _onProcessMsg(msg: ProcessMsg) {
        if (msg.type) {
            this.lastMsgTime = Date.now();
        }

        switch (msg.type) {
            case ProcessMsgType.DuelPlayerRemoved:
                this.duelRemovalRequests.get(msg.requestId)?.(msg.combat);
                break;
            case ProcessMsgType.UpdateData:
                if (this.state === ProcState.CreatingGame && msg.canJoin) {
                    this.state = ProcState.Running;
                    for (const cb of this.onCreatedCbs) {
                        cb(this);
                    }
                    this.onCreatedCbs.length = 0;
                    if (this.reusedCount === 1) {
                        this.manager.logger.info(
                            `Process ${this.process.pid} created in ${Date.now() - this.createdTime}ms`,
                        );
                    }
                }

                if (this.gameData.id !== msg.id) {
                    this.manager.processById.delete(this.gameData.id);
                    this.gameData.id = msg.id;
                    this.manager.processById.set(this.gameData.id, this);
                }
                this.gameData = msg;
                if (this.gameData.stopped) {
                    this.stoppedTime = Date.now();
                    this.state = ProcState.Idle;
                }
                break;
        }
    }

    send(msg: ProcessMsg) {
        if (this.process.killed || !this.process.channel) return;
        this.process.send(msg);
    }

    removeDuelPlayer(seriesId: string, roundId: string, profileId: string): Promise<DuelCombatSnapshot | undefined> {
        const cached = this.gameData.duelCombat;
        if (this.gameData.stopped) return Promise.resolve(cached);
        const requestId = randomBytes(16).toString("hex");
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.duelRemovalRequests.delete(requestId);
                reject(new Error("The arena did not confirm player removal"));
            }, 3000);
            const complete = (combat?: DuelCombatSnapshot) => {
                clearTimeout(timer);
                this.duelRemovalRequests.delete(requestId);
                resolve(combat);
            };
            this.duelRemovalRequests.set(requestId, complete);
            try {
                this.send({ type: ProcessMsgType.RemoveDuelPlayer, seriesId, roundId, profileId, requestId });
            } catch (error) {
                clearTimeout(timer);
                this.duelRemovalRequests.delete(requestId);
                reject(error);
            }
        });
    }

    create(id: string, config: ServerGameConfig) {
        this.send({
            type: ProcessMsgType.Create,
            id,
            config,
        });
        this.gameData.id = id;
        this.gameData.teamMode = config.teamMode;
        this.gameData.mapName = config.mapName;
        this.gameData.stopped = false;
        this.gameData.duelCombat = undefined;
        this.gameData.duel = config.duel
            ? {
                seriesId: config.duel.seriesId,
                roundId: config.duel.roundId,
                round: config.duel.round,
                phase: "connecting",
                connected: 0,
                expected: config.duel.roster.length,
            }
            : undefined;
        this.state = ProcState.CreatingGame;

        const mapDef = MapDefs[this.gameData.mapName as MapDefKey];
        this.avaliableSlots = config.duel?.roster.length ?? mapDef.gameMode.maxPlayers;

        this.reusedCount++;
    }

    addJoinTokens(tokens: FindGamePrivateBody["playerData"], autoFill: boolean) {
        this.send({
            type: ProcessMsgType.AddJoinToken,
            autoFill,
            tokens,
        });
        this.avaliableSlots -= this.gameData.duel ? tokens.length : 1;
    }

    addSpectateToken(token: string, data: SpectateTokenData) {
        this.send({
            type: ProcessMsgType.AddSpectateToken,
            token,
            data,
        });
    }
}

export class GameProcessManager {
    readonly processById = new Map<string, GameProcess>();
    readonly processes: GameProcess[] = [];

    readonly logger = new ServerLogger("Game Process Manager");

    private readonly _freePorts: number[] = [];

    getNextPort() {
        return this._freePorts.shift();
    }

    constructor() {
        for (let i = 0; i < Config.gameServer.maxGames; i++) {
            this._freePorts.push(Config.gameServer.firstGamePort + i);
        }

        // always keep some processes running even if theres no active games on them
        // creating a new proc is more expensive than reusing one
        const minIdleProcs = 3;

        setInterval(() => {
            for (const proc of this.processes) {
                proc.send({
                    type: ProcessMsgType.KeepAlive,
                });

                // kill processes that didn't send a keep alive msg in 10 seconds
                // because this usually means they are frozen in an infinite loop
                if (Date.now() - proc.lastMsgTime > 10000) {
                    const id = proc.gameData.id.substring(0, 4);
                    this.logger.warn(
                        `Process ${proc.process.pid} - #${id} did not send a message in more 10 seconds, killing`,
                    );
                    // sigquit can dump a core of the process
                    // useful for debugging infinite loops
                    this.killProcess(proc, "SIGQUIT");
                    continue;
                }
            }

            const idleProcs = this.processes.filter(p => {
                return p.gameData.stopped && (Date.now() - p.stoppedTime) > 60000;
            });

            // kill stale processes if there's too many
            if (idleProcs.length > minIdleProcs) {
                idleProcs.sort((a, b) => a.createdTime - b.createdTime);

                const procsToKill = Math.abs(minIdleProcs - idleProcs.length);
                for (let i = 0; i < procsToKill; i++) {
                    const proc = idleProcs[i];
                    this.logger.info(`Killing ${proc.process.pid} because we have too many stale processes`);
                    this.killProcess(proc);
                }
            }
        }, 5000);
    }

    getPlayerCount(): number {
        return this.processes.reduce((a, b) => {
            return a + (b.gameData.stopped ? 0 : b.gameData.aliveCount);
        }, 0);
    }

    newGame(config: ServerGameConfig): GameProcess | undefined {
        let gameProc: GameProcess | undefined;

        for (let i = 0; i < this.processes.length; i++) {
            const p = this.processes[i];
            if (p.gameData.stopped) {
                gameProc = p;
                break;
            }
        }

        const id = crypto.randomUUID();
        if (!gameProc) {
            const port = this.getNextPort();
            if (port === undefined) {
                return undefined;
            }
            gameProc = new GameProcess(this, id, config, port);

            this.processes.push(gameProc);

            gameProc.process.on("exit", () => {
                this.killProcess(gameProc!);
                if (!this._freePorts.includes(gameProc!.port)) {
                    this._freePorts.push(gameProc!.port);
                }
            });

            gameProc.process.on("close", () => {
                this.killProcess(gameProc!);
            });
            gameProc.process.on("disconnect", () => {
                this.killProcess(gameProc!);
            });
            this.logger.info("Created new process with PID", gameProc.process.pid);
        } else {
            this.processById.delete(gameProc.gameData.id);
            gameProc.create(id, config);
        }

        this.processById.set(id, gameProc);

        return gameProc;
    }

    killProcess(gameProc: GameProcess, signal: NodeJS.Signals = "SIGTERM"): void {
        // send SIGTERM, if still hasn't terminated after 5 seconds, send SIGKILL >:3
        gameProc.process.kill(signal);
        setTimeout(() => {
            if (!gameProc.process.killed) {
                gameProc.process.kill("SIGKILL");
            }
        }, 5000);

        util.removeFrom(this.processes, gameProc);
        this.processById.delete(gameProc.gameData.id);
    }

    getById(id: string): GameProcess | undefined {
        return this.processById.get(id);
    }

    cancelDuel(seriesId: string, roundId: string) {
        for (const proc of this.processes) {
            const duel = proc.gameData.duel;
            if (duel?.seriesId === seriesId && duel.roundId === roundId) {
                proc.send({ type: ProcessMsgType.CancelDuel, seriesId, roundId });
            }
        }
    }

    async removeDuelPlayer(seriesId: string, roundId: string, profileId: string) {
        for (const proc of this.processes) {
            const duel = proc.gameData.duel;
            if (duel?.seriesId === seriesId && duel.roundId === roundId) {
                return proc.removeDuelPlayer(seriesId, roundId, profileId);
            }
        }
    }

    async findGame(body: FindGamePrivateBody): Promise<GameProcess | undefined> {
        if (body.duel) {
            const duel = getDuelRoundConfig(body);
            let proc = this.processes.find(p =>
                !p.gameData.stopped && p.gameData.duel?.roundId === duel.roundId
                && p.gameData.duel.seriesId === duel.seriesId
            );
            if (!proc) {
                proc = this.newGame({
                    mapName: "duel",
                    teamMode: duel.teamSize === 1 ? TeamMode.Solo : duel.teamSize === 2 ? TeamMode.Duo : TeamMode.Squad,
                    duel,
                });
            }
            if (!proc) return;
            const gameId = proc.gameData.id;
            if (proc.state !== ProcState.Running) {
                const ready = await new Promise<boolean>(resolve => {
                    const callback = () => {
                        clearTimeout(timeout);
                        resolve(true);
                    };
                    const timeout = setTimeout(() => {
                        util.removeFrom(proc!.onCreatedCbs, callback);
                        resolve(false);
                    }, 20000);
                    proc!.onCreatedCbs.push(callback);
                });
                if (!ready) return;
            }
            // A cancelled arena can be replaced while its creation callback is pending.
            if (
                proc.gameData.id !== gameId || proc.gameData.stopped || proc.state !== ProcState.Running
                || proc.gameData.duel?.seriesId !== duel.seriesId || proc.gameData.duel.roundId !== duel.roundId
            ) return;
            if (proc.avaliableSlots > 0) proc.addJoinTokens(body.playerData, false);
            return proc;
        }
        // This reserved map is never a public matchmaking destination.
        if (body.mapName === "duel") return;
        let proc: GameProcess | undefined = this.processes
            .filter((proc) => {
                const game = proc.gameData;
                return (
                    (game.canJoin || proc.state === ProcState.CreatingGame)
                    && proc.avaliableSlots > 0
                    && game.teamMode === body.teamMode
                    && game.mapName === body.mapName
                    && !game.duel
                );
            })
            .sort((a, b) => {
                return a.gameData.startedTime - b.gameData.startedTime;
            })[0];

        if (!proc) {
            proc = this.newGame({
                teamMode: body.teamMode,
                mapName: body.mapName as MapDefKey,
            });
        }

        if (!proc) {
            return undefined;
        }

        // if the game has not finished creating
        // wait for it to be created to send the find game response
        if (proc.state !== ProcState.Running) {
            return await new Promise((resolve) => {
                proc.onCreatedCbs.push((proc) => {
                    proc.addJoinTokens(body.playerData, body.autoFill);
                    resolve(proc);
                });
            });
        }

        proc.addJoinTokens(body.playerData, body.autoFill);

        return proc;
    }

    async findGamesWithPlayer(body: SpectateGamePrivateBody): Promise<{ joinToken: string; game: GameProcess }[]> {
        const filterFn = (p: GameData["livingPlayers"][0]) => {
            if (body.filter.type === "user_id") {
                return p.userId === body.filter.value;
            } else {
                return p.name === body.filter.value;
            }
        };

        const res = [];
        for (const proc of this.processes) {
            if (proc.state !== ProcState.Running) continue;

            for (const player of proc.gameData.livingPlayers) {
                if (player.disconnected) continue;
                if (!filterFn(player)) continue;

                // use slightly shorter join tokens for this...
                // since for the discord bot long URLs make the message run out of characters kinda fast
                const joinToken = randomBytes(16).toString("base64url");
                proc.addSpectateToken(joinToken, {
                    playerId: player.id,
                    specAnon: true,
                    noSpecCooldown: true,
                });

                res.push({
                    joinToken,
                    game: proc,
                });
            }
        }

        return res;
    }
}
