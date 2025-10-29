import fs from "fs";
import path from "path";
import type { Game } from "./game";
import type { DamageParams } from "./objects/gameObject";
import type { Player } from "./objects/player";

interface PlayerDamageEvent extends DamageParams {
    player: Player;
}

export interface Events {
    playerRevived: Player; // player who was revived
    playerJoin: Player;
    playerDamage: PlayerDamageEvent;
    playerKill: Omit<PlayerDamageEvent, "amount">;
    gameCreated: Game;
}

export type EventType = keyof Events;

type EventHandler<E extends EventType> = (data: Events[E]) => void;

type EventHandlers = {
    [E in keyof Events]?: Set<EventHandler<E>>; // optional since handlers are not determined on object initialization
};

export function readDirectory(dir: string): string[] {
    let results: string[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.resolve(dir, file);
        const stat = fs.statSync(filePath);
        if (stat?.isDirectory()) {
            const res = readDirectory(filePath);
            results = results.concat(res);
        } else if (filePath.endsWith(".ts") || filePath.endsWith(".js")) {
            results.push(filePath);
        }
    }

    return results;
}

export const pluginDir = path.join(import.meta.dirname, "./plugins/");

let pluginPaths: string[] = [];
if (fs.existsSync(pluginDir)) {
    pluginPaths = readDirectory(pluginDir);
}

export abstract class GamePlugin {
    handlers: EventHandlers = {};

    constructor(public readonly game: Game) {
        this.initListeners();
    }

    protected abstract initListeners(): void;

    on<E extends keyof Events>(eventName: E, handler: EventHandler<E>): void {
        // eslint-disable-next-line
        ((this.handlers[eventName] as Set<typeof handler>) ??= new Set()).add(handler);
    }
}

export class PluginManager {
    private readonly _plugins = new Set<GamePlugin>();

    constructor(readonly game: Game) {}

    emit<E extends keyof Events>(eventName: E, data: Events[E]): void {
        for (const plugin of this._plugins) {
            const handlers: EventHandlers[E] = plugin.handlers[eventName];
            if (handlers) {
                for (const handler of handlers) {
                    handler(data);
                }
            }
        }
    }

    private loadPlugin(PluginConstructor: new (game: Game) => GamePlugin): void {
        const plugin = new PluginConstructor(this.game);
        this._plugins.add(plugin);
    }

    async loadPlugins() {
        for (const path of pluginPaths) {
            this.game.logger.info("Loading plugin", path);
            const plugin = ((await import(path)) as { default: new () => GamePlugin })
                .default;

            this.loadPlugin(plugin);
        }
    }
}
