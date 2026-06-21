import { GameConfig } from "@/shared/gameConfig.ts";
import loadout from "@/shared/utils/loadout.ts";
import { util } from "@/shared/utils/util.ts";
import { v2 } from "@/shared/utils/v2.ts";

import type { MapDefKey } from "@/shared/defs/mapDefs.ts";
import type { Locale } from "../../ui/localization.ts";

type AimStyle = "locked" | "anywhere";

export const debugToolsConfig = {
    enabled: false,

    zoomEnabled: false,
    zoom: GameConfig.scopeZoomRadius.desktop["1xscope"],

    speedEnabled: false,
    speed: GameConfig.player.moveSpeed,

    gameSpeedEnabled: false,
    gameSpeed: 1,

    mapSeed: 0,

    loot: "",
    role: "",

    noClip: false,
    godMode: false,
    teleportToPings: false,
    moveObjs: false,
    preventGameStart: false,
};

export const debugRendererConfig = {
    enabled: false,
    players: false,
    obstacles: false,
    loot: false,
    explosions: false,
    rivers: false,
    buildings: {
        buildingBounds: false,
        obstacleBounds: false,
        bridge: false,
        waterEdge: false,
        ceiling: false,
        floors: false,
        minimap: false,
    },
    structures: {
        buildingBounds: false,
        obstacleBounds: false,
        bridge: false,
        waterEdge: false,
        stairs: false,
        layerMasks: false,
    },
};

export const debugHUDConfig = {
    enabled: false,
    position: false,
    objectPools: false,
    fps: {
        show: false,
        showGraph: false,
    },
    ping: {
        show: false,
        showGraph: false,
    },
    netIn: {
        show: false,
        showGraph: false,
    },
    updateInterval: {
        show: false,
        showGraph: false,
    },
};

export type DebugRendererOpts = typeof debugRendererConfig;

export const BuildingEditorConfig = {
    zoom: 1,
    pos: v2.create(0, 0),
    object: "house_red_01",
    map: "main" as MapDefKey,
    grid: true,
};

const defaultConfig = {
    // Settings widget checkboxes.
    muteAudio: false,
    highResTex: true,
    interpolation: true,
    localRotation: false,
    screenShake: true,
    anonPlayerNames: false,

    // Volume sliders.
    masterVolume: 1,
    soundVolume: 1,
    musicVolume: 1,

    // Mobile-specific options.
    touchMoveStyle: "anywhere" as AimStyle,
    touchAimStyle: "anywhere" as AimStyle,
    touchAimLine: true,

    // Splash options.
    regionSelected: false,
    cachedBgImg: "img/main_splash.png",
    profile: null as { slug: string } | null,
    playerName: "",
    region: "na",
    gameModeIdx: 2,
    language: "en" as Locale,

    // Team menu options.
    teamAutoFill: true,

    // Ingame-related data.
    perkModeRole: "",
    loadout: loadout.defaultLoadout(),
    sessionCookie: "" as string | null,
    binds: "",

    // SVC.
    version: 1,

    // Unused stuff.
    prerollGamesPlayed: 0,
    totalGamesPlayed: 0,
    lastNewsTimestamp: 0,
    promptAppRate: true,

    /* STRIP_FROM_PROD_CLIENT:START */
    debugTools: debugToolsConfig,
    debugRenderer: debugRendererConfig,

    /* STRIP_FROM_PROD_CLIENT:END */
    debugHUD: debugHUDConfig,
    buildingEditor: BuildingEditorConfig,
};

export type ConfigType = typeof defaultConfig;
export type ConfigKey = keyof ConfigType;

export class ConfigManager {
    loaded = false;
    localStorageAvailable = true;

    config = $state({} as ConfigType);

    onModifiedListeners: Array<(key?: string) => void> = [];

    load(cb?: () => void) {
        const onLoaded = (configStr: string | null) => {
            let data = {};
            try {
                data = JSON.parse(configStr!);
            } catch (e) {
                console.warn("Failed to load config.");
            }

            this.config = util.mergeDeep({}, defaultConfig, data);

            this.checkUpgradeConfig();
            this.onModified();

            this.loaded = true;
            cb?.();
        };

        let storedConfig: string | null = "{}";
        try {
            storedConfig = localStorage.getItem("surviv_config");
        } catch (_e) {
            this.localStorageAvailable = false;
        }

        onLoaded(storedConfig);
    }

    store() {
        const strData = JSON.stringify(this.config);
        if (this.localStorageAvailable) {
            // In browsers like Safari, localStorage setItem is disabled in private browsing mode.
            // This try / catch addresses such a situation.
            try {
                localStorage.setItem("surviv_config", strData);
            } catch (_e) {
                console.warn("Failed writing config. Options will not be persistent.");
            }
        }
    }

    set<T extends ConfigKey>(key: T, value: ConfigType[T]) {
        if (!key) return;

        const path = key.split(".");

        let el: any = this.config;
        while (path.length > 1) el = el[path.shift()!];

        el[path.shift()!] = value;

        this.store();
        this.onModified(key);
    }

    get<T extends ConfigKey>(key: T): ConfigType[T] | undefined {
        if (!key) return undefined;

        const path = key.split(".");

        let el: any = this.config;
        for (let i = 0; i < path.length; i++) el = el[path[i]];

        return el as ConfigType[T] | undefined;
    }

    addModifiedListener(e: (key?: string) => void) {
        this.onModifiedListeners.push(e);
    }

    onModified(key?: string) {
        for (let i = 0; i < this.onModifiedListeners.length; i++) {
            this.onModifiedListeners[i](key);
        }
    }

    checkUpgradeConfig() {
        this.config.loadout = loadout.validate(this.config.loadout);

        // TODO: Implement the remainder of this.
    }
}
