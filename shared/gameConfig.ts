export enum TeamMode {
    Solo = 1,
    Duo = 2,
    Squad = 4,
}

export enum EmoteSlot {
    Top,
    Right,
    Bottom,
    Left,
    Win,
    Death,
    Count,
}

export enum DamageType {
    Player,
    Bleeding,
    Gas,
    Airdrop,
    Airstrike,
    filip,
    deathalls,
    tenno,
    Spectator, // used when a player joins as a spectator
    Disconnect,
    KillSteal,
    FriendlyKillSteal,
}

export enum Action {
    None,
    Reload,
    ReloadAlt,
    UseItem,
    Revive,
    Count,
    InstantRevive,
    Modify,
}

export enum Rarity {
    Stock,
    Common,
    Uncommon,
    Rare,
    Epic,
    Mythic,
}

export enum WeaponSlot {
    Primary,
    Secondary,
    Melee,
    Throwable,
    Count,
}

export enum GasMode {
    Inactive,
    Waiting,
    Moving,
}

export enum Anim {
    None,
    Melee,
    Cook,
    Throw,
    CrawlForward,
    CrawlBackward,
    Revive,
    Count,
}

export enum Plane {
    Airdrop,
    Airstrike,
    SupplyDrop,
}

export enum HasteType {
    None,
    Windwalk,
    Takedown,
    Inspire,
    Count,
}

export enum BuildingGroups {
    //Bank, Police, Mansion
    POIs = 1,
    //Club, Docs
    SVSpawns = 2,
    // Teahouses
    SniperSpawns = 3,
    // Hydra bunker, Greenhouse, Storm Bunker
    BunkerSpawns = 4,
    // Workshop
    WorkshopSpawns = 5,
};

export enum MinDistance {
    POIs = 275,
    BunkerSpawns = 200,
    SVSpawns = 600,
    SniperSpawns = 225,
    WorkshopSpawns = 250,
}

export enum NoSpawnRadius {
    POIs = 100,
    BunkerSpawns = 0,
    SVSpawns = 200,
    SniperSpawns = 100,
    WorkshopSpawns = 0,
}

export enum ExperienceConverter {
    kill = 1,
    win = 1,
    timeSurvived = 0.016, // 1 xp per minute survived
}

export enum Input {
    MoveLeft,
    MoveRight,
    MoveUp,
    MoveDown,
    Fire,
    Reload,
    Cancel,
    Interact,
    Revive,
    Use,
    Loot,
    EquipPrimary,
    EquipSecondary,
    EquipMelee,
    EquipThrowable,
    EquipFragGrenade,
    EquipSmokeGrenade,
    EquipNextWeap,
    EquipPrevWeap,
    EquipLastWeap,
    EquipOtherGun,
    EquipPrevScope,
    EquipNextScope,
    UseBandage,
    UseHealthKit,
    UseSoda,
    UsePainkiller,
    StowWeapons,
    SwapWeapSlots,
    ToggleMap,
    CycleUIMode,
    EmoteMenu,
    TeamPingMenu,
    Fullscreen,
    HideUI,
    TeamPingSingle,
    JoinChat,
    SwitchAmmo,
    Count,
}

export const GameConfig = {
    // started with 1000 to distinguish us from the original surviv protocol
    // the protocol we originated from was 78
    // remember to bump this every time a serialization function is changed
    // or a definition item added, removed or moved
    protocolVersion: 1017,
    Input,
    EmoteSlot,
    WeaponSlot,
    WeaponType: ["gun", "gun", "melee", "throwable"] as const,
    DamageType,
    Action,
    Anim,
    GasMode,
    Plane,
    HasteType,
    gas: {
        damageTickRate: 2,
    },
    map: {
        gridSize: 16,
        shoreVariation: 3,
        grassVariation: 2,
    },
    serverSettings:{
        passes: {
            "pass_survivr1": {
                passMaxLevel: 99,
                seasonStart: "2026-03-01T22:00:00Z",
                seasonEnd:   "2026-05-31T23:59:30Z",
            },
            "pass_survivr2": {
                passMaxLevel: 99,
                seasonStart: "2026-05-31T22:00:00Z",
                seasonEnd:   "2026-07-31T23:59:30",
            },
            "pass_survivr3": {
                passMaxLevel: 99,
                seasonStart: "2026-07-31T23:59:59",
                seasonEnd:   "2026-10-31T23:59:30",
            },
        } as Record<string, { passMaxLevel: number; seasonStart: string; seasonEnd: string }>,
        get currentPass(): string {
            const now = Date.now();
            for (const [id, cfg] of Object.entries(this.passes)) {
                const start = new Date(cfg.seasonStart).getTime();
                const end   = new Date(cfg.seasonEnd).getTime();
                if (now >= start && now <= end) return id;
            }
            return Object.keys(this.passes).at(-1)!;
        },
        get seasonStart(): string  { return this.passes[this.currentPass].seasonStart; },
        get seasonEnd(): string    { return this.passes[this.currentPass].seasonEnd; },
        get passMaxLevel(): number { return this.passes[this.currentPass].passMaxLevel; },

        xpBoostEvents: {
            "pass_survivr2": {
                "Happy New Pass!":{
                    maps: ["local", "two_vs_two", "comp"],
                    start: "2026-06-02T00:00:00Z",
                    end:   "2026-06-02T23:59:59Z",
                    boost: 2,
                },
                "Weekend 1": {
                    maps: ["local"],
                    start: "2026-06-05T00:00:00Z",
                    end:   "2026-06-07T23:59:59Z",
                    boost: 2,
                },
                "Weekend 2": {
                    maps: ["comp"],
                    start: "2026-06-12T00:00:00Z",
                    end:   "2026-06-14T23:59:59Z",
                    boost: 2,
                },
                "Weekend 3": {
                    maps: ["local", "comp"],
                    start: "2026-06-19T00:00:00Z",
                    end:   "2026-06-21T23:59:59Z",
                    boost: 2,
                },
                "Weekend 4": {
                    maps: ["scrims"],
                    start: "2026-06-26T00:00:00Z",
                    end:   "2026-06-28T23:59:59Z",
                    boost: 3,
                },
            },
        } as Record<string, Record<string, { maps: string[]; start: string; end: string; boost: number }>>,
    },
    player: {
        radius: 1,
        maxVisualRadius: 3.75,
        maxInteractionRad: 3.5,
        health: 100,
        reviveHealth: 24,
        minActiveTime: 30,
        boostDecay: 0.375,
        boostMoveSpeed: 1.85,
        boostHealAmounts: [0.5, 1.25, 1.5, 1.75],
        boostBreakpoints: [1, 1, 1.5, 0.5],
        scopeDelay: 0.25,
        baseSwitchDelay: 0.25,
        freeSwitchCooldown: 1,
        headshotChance: 0.00,
        moveSpeed: 12,
        waterSpeedPenalty: 3,
        cookSpeedPenalty: 3,
        frozenSpeedPenalty: 3,
        hasteSpeedBonus: 4.8,
        bleedTickRate: 1,
        downedMoveSpeed: 4,
        downedRezMoveSpeed: 2,
        downedDamageBuffer: 0.1, // time buffer after being downed where a player can't take damage
        keepZoomWhileDowned: false,
        reviveDuration: 8,
        reviveRange: 5,
        crawlTime: 0.75,
        teammateSpawnRadius: 5, // radius of circle that teammates spawn inside of, relative to the first player on the team to join
        emoteSoftCooldown: 0,
        emoteHardCooldown: 0,
        emoteThreshold: 6,
        throwableMaxMouseDist: 18,
        cookTime: 0.1,
        throwTime: 0.3,
        meleeHeight: 0.25,
        touchLootRadMult: 1.4,
        medicHealRange: 8,
        medicReviveRange: 6,
        spectateDeadTimeout: 2,
        killLeaderMinKills: 1,
        perkModeRoleSelectDuration: 20,

        //default settings for maps to use if they don't specify their own, can be overridden per map
        edgeBuffer: 150, // distance to maps border (to prevent pakistani spawns)
        centerNoSpawnRadius: 230, // no spawn zone in the center of the map
        minSpawnRad: 400, // spawn radius away from alive players
        minPosSpawnRad: 100, // spawn radius from other spawn locations
        
        //boost decay settings to disable boostDecayAmount -> 0
        camperPunishmentDistance: 15, // distance player has to move to not decay boost
        camperDecayTime: 6, // time in *seconds* until boost decays
        boostDecayAmount: 1.5, // amount of boost to decay per boostDecayDistance
        camperPunishment: false, // if true, player will have enhanced decay for boostDecayTime after not moving for boostDecayTime
        camperPunishmentTime: 3, // time in *seconds* after boost decay to punish player for not moving
        camperGracePeriod: 40, // time in *seconds* after spawn before camping checks start

        /* STRIP_FROM_PROD_CLIENT:START */
        defaultItems: {
            weapons: [
                { type: "", ammo: 0 },
                { type: "", ammo: 0 },
                { type: "fists", ammo: 0 },
                { type: "", ammo: 0 },
            ],
            outfit: "outfitBase",
            backpack: "backpack00",
            helmet: "",
            chest: "",
            scope: "1xscope",
            perks: [] as Array<{ type: string; droppable?: boolean }>,
            inventory: {
                "9mm": 0,
                "762mm": 0,
                "556mm": 0,
                "12gauge": 0,
                "50AE": 0,
                "308sub": 0,
                flare: 0,
                "45acp": 0,
                "construction_item": 0,
                frag: 0,
                smoke: 0,
                strobe: 0,
                mirv: 0,
                snowball: 0,
                potato: 0,
                coconut: 0,
                bandage: 0,
                healthkit: 0,
                soda: 0,
                painkiller: 0,
                "1xscope": 1,
                "2xscope": 0,
                "4xscope": 0,
                "8xscope": 0,
                "15xscope": 0,
            },
        },
        /* STRIP_FROM_PROD_CLIENT:END */
    },
    defaultEmoteLoadout: [
        "emote_happyface",
        "emote_thumbsup",
        "emote_surviv",
        "emote_sadface",
        "",
        "",
    ],
    airdrop: {
        actionOffset: 0,
        fallTime: 8,
        crushDamage: 100,
        planeVel: 48,
        planeRad: 150,
        soundRangeMult: 2.5,
        soundRangeDelta: 0.25,
        soundRangeMax: 92,
        fallOff: 0,
    },
    airstrike: {
        actionOffset: 0,
        bombJitter: 4,
        bombOffset: 2,
        bombVel: 3,
        bombCount: 20,
        planeVel: 350,
        planeRad: 120,
        soundRangeMult: 18,
        soundRangeDelta: 18,
        soundRangeMax: 48,
        fallOff: 1.25,
    },
    supplydrop: {
        actionOffset: 0,
        fallTime: 8,
        crushDamage: 100,
        planeDelay: 40,
        planeVel: 200,
        planeRad: 150,
        soundRangeMult: 2.5,
        soundRangeDelta: 0.25,
        soundRangeMax: 92,
        fallOff: 0,
    },
    groupColors: [0xffff00, 0xff00ff, 0xffff, 0xff5400],
    teamColors: [0xcc0000, 0x7eff],
    bullet: {
        maxReflect: 3,
        maxPierce: 1,
        reflectDistDecay: 1.5,
        height: 0.25,
        falloff: true,
    },
    projectile: {
        maxHeight: 5,
    },
    structureLayerCount: 2,
    tracerColors: {
        "9mm": {
            regular: 0xfee2c6,
            saturated: 0xffd9b3,
            chambered: 0xff7f00,
            apSaturated: 0xa54b0b,
            alphaRate: 0.92,
            alphaMin: 0.14,
        },
        "9mm_suppressed_bonus": {
            regular: 0xfee2c6,
            saturated: 0xffd9b3,
            chambered: 0xff7f00,
            apSaturated: 0xa54b0b,
            alphaRate: 0.96,
            alphaMin: 0.28,
        },
        "9mm_cursed": {
            regular: 0x130900,
            saturated: 0x130900,
            chambered: 0x130900,
            apSaturated: 0x130900,
            alphaRate: 0.92,
            alphaMin: 0.14,
        },
        "762mm": {
            regular: 0xc5d6fe,
            saturated: 0xabc4ff,
            chambered: 0x4cff,
            apSaturated: 0x0000c8,
            alphaRate: 0.94,
            alphaMin: 0.2,
        },
        "12gauge": {
            regular: 0xfedcdc,
            saturated: 0xfedcdc,
            chambered: 0xff0000,
            apSaturated: 0x9f0000,
        },
        "556mm": {
            regular: 0xa9ff92,
            saturated: 0xa9ff92,
            chambered: 0x36ff00,
            apSaturated: 0x308000,
            alphaRate: 0.92,
            alphaMin: 0.14,
        },
        "50AE": {
            regular: 0xfff088,
            saturated: 0xfff088,
            chambered: 0xffdf00,
            apSaturated: 0xff8000,
        },
        "308sub": {
            regular: 0x252b00,
            saturated: 0x465000,
            chambered: 0x131600,
            apSaturated: 0x000a02,
            alphaRate: 0.92,
            alphaMin: 0.07,
        },
        flare: {
            regular: 0xe2e2e2,
            saturated: 0xe2e2e2,
            chambered: 0xc4c4c4,
            apSaturated: 0xc4c4c4,
        },
        "45acp": {
            regular: 0xecbeff,
            saturated: 0xe7acff,
            chambered: 0xb500ff,
            apSaturated: 0x470349,
        },
        "construction_item": {
            regular: 0x333333,
            saturated: 0x333333,
            chambered: 0x333333,
            apSaturated: 0x333333,
        },
        shrapnel: { regular: 0x333333, saturated: 0x333333 },
        frag: { regular: 0xcb0000, saturated: 0xcb0000, apSaturated: 0xcb0000 },
        invis: { regular: 0, saturated: 0, chambered: 0, apSaturated: 0 },
    },
    scopeZoomRadius: {
        desktop: {
            "1xscope": 28,
            "2xscope": 36,
            "4xscope": 48,
            "8xscope": 68,
            "15xscope": 104,
        } as Record<string, number>,
        mobile: {
            "1xscope": 32,
            "2xscope": 40,
            "4xscope": 48,
            "8xscope": 64,
            "15xscope": 88,
        } as Record<string, number>,
    },
    bagSizes: {
        "9mm": [120, 240, 330, 420],
        "762mm": [90, 180, 240, 300],
        "556mm": [90, 180, 240, 300],
        "12gauge": [15, 30, 60, 90],
        "50AE": [49, 98, 147, 196],
        "308sub": [20, 40, 60, 80],
        flare: [2, 4, 6, 8],
        "45acp": [150, 300, 420, 540],
        "construction_item": [5, 10, 15, 25],
        frag: [3, 6, 9, 12],
        smoke: [3, 6, 9, 12],
        strobe: [2, 3, 4, 5],
        mirv: [2, 4, 6, 8],
        snowball: [10, 20, 30, 40],
        potato: [10, 20, 30, 40],
        coconut: [3, 6, 9, 12],
        bandage: [5, 10, 15, 30],
        healthkit: [1, 2, 3, 4],
        soda: [2, 5, 10, 15],
        painkiller: [1, 2, 3, 4],
        "1xscope": [1, 1, 1, 1],
        "2xscope": [1, 1, 1, 1],
        "4xscope": [1, 1, 1, 1],
        "8xscope": [1, 1, 1, 1],
        "15xscope": [1, 1, 1, 1],
    },
    lootRadius: {
        outfit: 1,
        melee: 1.25,
        gun: 1.25,
        throwable: 1,
        ammo: 1.2,
        heal: 1,
        boost: 1,
        backpack: 1,
        helmet: 1,
        chest: 1,
        scope: 1,
        perk: 1.25,
        xp: 1,
    } as Record<string, number>,
};

export type InventoryItem = keyof (typeof GameConfig)["bagSizes"];
