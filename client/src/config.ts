import { GameConfig } from "../../shared/gameConfig";
import loadout from "../../shared/utils/loadout";
import { util } from "../../shared/utils/util";
import type { Locale } from "./ui/localization";

export const debugToolsConfig = {
    enabled: false,

    zoomEnabled: false,
    zoom: GameConfig.scopeZoomRadius.desktop["1xscope"],

    speedEnabled: false,
    speed: GameConfig.player.moveSpeed,

    mapSeed: 0,

    loot: "",
    role: "",

    noClip: false,
    godMode: false,
    teleportToPings: false,
    moveObjs: false,
};

export const debugRenderConfig = {
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
    },
    structures: {
        buildingBounds: false,
        obstacleBounds: false,
        bridge: false,
        waterEdge: false,
        stairs: false,
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
};

export type DebugRenderOpts = typeof debugRenderConfig;

const defaultConfig = {
    muteAudio: false,
    masterVolume: 1,
    soundVolume: 1,
    musicVolume: 1,
    highResTex: true,
    interpolation: true,
    localRotation: false,
    screenShake: true,
    anonPlayerNames: false,
    touchMoveStyle: "anywhere" as "locked" | "anywhere",
    touchAimStyle: "anywhere" as "locked" | "anywhere",
    touchAimLine: true,
    profile: null as { slug: string } | null,
    playerName: "",
    region: "na",
    gameModeIdx: 2,
    teamAutoFill: true,
    language: "en" as Locale,
    prerollGamesPlayed: 0,
    totalGamesPlayed: 0,
    promptAppRate: true,
    regionSelected: false,
    lastNewsTimestamp: 0,
    perkModeRole: "",
    loadout: loadout.defaultLoadout(),
    sessionCookie: "" as string | null,
    binds: "",
    cachedBgImg: "img/main_splash.png",
    version: 1,
    /* STRIP_FROM_PROD_CLIENT:START */
    debugTools: debugToolsConfig,
    debugRenderer: debugRenderConfig,
    /* STRIP_FROM_PROD_CLIENT:END */
    debugHUD: debugHUDConfig,
};

export type ConfigType = typeof defaultConfig;
export type ConfigKey = keyof ConfigType;

export class ConfigManager {
    loaded = false;
    localStorageAvailable = true;
    config = {} as ConfigType;
    onModifiedListeners: Array<(key?: string) => void> = [];

    load(onLoadCompleteCb: () => void) {
        const onLoaded = (strConfig: string) => {
            let data = {};
            try {
                data = JSON.parse(strConfig);
            } catch (_e) {}
            this.config = util.mergeDeep({}, defaultConfig, data);
            this.checkUpgradeConfig();
            this.onModified();
            this.loaded = true;
            onLoadCompleteCb();
        };
        let storedConfig: string | null = "{}";
        try {
            storedConfig = localStorage.getItem("surviv_config")!;
        } catch (_err) {
            this.localStorageAvailable = false;
        }
        onLoaded(storedConfig);
    }

    store() {
        const strData = JSON.stringify(this.config);
        if (this.localStorageAvailable) {
            // In browsers, like Safari, localStorage setItem is
            // disabled in private browsing mode.
            // This try/catch is here to handle that situation.
            try {
                localStorage.setItem("surviv_config", strData);
            } catch (_e) {}
        }
    }

    set<T extends ConfigKey>(key: T, value: ConfigType[T]) {
        if (!key) {
            return;
        }
        const path = key.split(".");

        let elem = this.config;
        while (path.length > 1) {
            // @ts-expect-error bleh
            elem = elem[path.shift()];
        }
        // @ts-expect-error bleh
        elem[path.shift()] = value;

        this.store();
        this.onModified(key);
    }

    get<T extends ConfigKey>(key: T): ConfigType[T] | undefined {
        if (!key) {
            return undefined;
        }

        const path = key.split(".");
        let elem = this.config as any;
        for (let i = 0; i < path.length; i++) {
            elem = elem[path[i]];
        }
        return elem;
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
        // validation logic
        this.config.loadout = loadout.validate(this.config.loadout);

        // seem not to be implemeted yet
        // this.get("version");
        // // @TODO: Put upgrade code here
        // this.set("version", 1);
    }
}
