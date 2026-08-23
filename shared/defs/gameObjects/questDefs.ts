import { MapId, TeamMode } from "../../gameConfig.ts";

export type QuestEvent =
    | "kill"
    | "damage"
    | "survived"
    | "placement"
    | "item_used"
    | "obstacle_used"
    | "destruction"
    | "promote"
    | "be_mvp";

export interface QuestWhere {
    mode?: TeamMode;
    maxRank?: number;
    buildingType?: string;
    ammo?: string;
    weaponClass?: "melee" | "throwable";
    itemType?: string;
    itemClass?: "heal" | "boost";
    obstacleCategory?: string;
    role?: string | string[];
}

export interface FilterParams {
    team_mode: { mode: TeamMode };
    max_rank: { maxRank: number };
    building: { subType: "category"; structureCategory: string | string[] } | {
        subType: "type";
        buildingType: string | string[];
    };
    role: { role: string | string[] };
    weapon: { weaponClass: "gun"; ammo?: string | string[] } | { weaponClass: "melee" | "throwable" };
    obstacle: { subType: "category"; obstacleCategory: string | string[] } | {
        subType: "type";
        obstacleType: string | string[];
    };
    item: { subType: "category"; itemCategory: string | string[] } | { subType: "type"; itemType: string | string[] };
}

export type FilterTypes = keyof FilterParams;

export type Filter<F extends FilterTypes> = { type: F } & FilterParams[F];

export type SupportedFiltersMap = {
    kill: [
        Filter<"team_mode">,
        Filter<"building">,
        Filter<"role">,
        Filter<"weapon">,
    ];
    damage: [
        Filter<"team_mode">,
        Filter<"building">,
        Filter<"role">,
        Filter<"weapon">,
    ];
    survived: [
        Filter<"team_mode">,
    ];
    placement: [
        Filter<"team_mode">,
        Filter<"max_rank">,
    ];
    item_used: [
        Filter<"team_mode">,
        Filter<"building">,
        Filter<"role">,
        Filter<"item">,
    ];
    obstacle_used: [
        Filter<"team_mode">,
        Filter<"building">,
        Filter<"role">,
        Filter<"obstacle">,
    ];
    destruction: [
        Filter<"team_mode">,
        Filter<"building">,
        Filter<"role">,
        Filter<"weapon">,
        Filter<"obstacle">,
    ];
    promote: [
        Filter<"role">,
    ];
    be_mvp: [
        Filter<"role">,
    ];
};

export type SupportedFilters<K extends QuestEvent> = SupportedFiltersMap[K];

export enum QuestDifficulty {
    Normal,
    Hard,
}

export type MapFilter = {
    mapFilterType?: undefined;
} | {
    mapFilterType: "only_on";
    maps: MapId | MapId[];
} | {
    mapFilterType: "all_except";
    maps: MapId | MapId[];
};

type QuestDefForEvent<E extends QuestEvent> = {
    readonly type: "quest";
    event: E;
    target: number;
    xp: number;
    icon?: string;
    timed?: boolean;
    filters?: SupportedFilters<E>[number][];
    /**
     * @default {QuestDifficulty.Normal}
     */
    difficulty?: QuestDifficulty;
} & MapFilter;

export type QuestDef = { [E in QuestEvent]: QuestDefForEvent<E> }[QuestEvent];

export const QuestDefs: Record<string, QuestDef> = {
    quest_top_solo: {
        type: "quest",
        event: "placement",
        target: 2,
        xp: 30,
        filters: [
            {
                type: "team_mode",
                mode: TeamMode.Solo,
            },
            {
                type: "max_rank",
                maxRank: 10,
            },
        ],
    },
    quest_top_duo: {
        type: "quest",
        event: "placement",
        target: 2,
        xp: 30,
        filters: [
            {
                type: "team_mode",
                mode: TeamMode.Duo,
            },
            {
                type: "max_rank",
                maxRank: 8,
            },
        ],
    },
    quest_top_squad: {
        type: "quest",
        event: "placement",
        target: 2,
        xp: 30,
        filters: [
            {
                type: "team_mode",
                mode: TeamMode.Squad,
            },
            {
                type: "max_rank",
                maxRank: 5,
            },
        ],
    },
    quest_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
    },
    quest_kills_hard: {
        type: "quest",
        event: "kill",
        target: 10,
        xp: 40,
    },
    quest_damage: {
        type: "quest",
        event: "damage",
        target: 750,
        xp: 30,
    },
    quest_damage_hard: {
        type: "quest",
        event: "damage",
        target: 1500,
        xp: 40,
    },
    quest_survived: {
        type: "quest",
        event: "survived",
        target: 900,
        xp: 30,
        timed: true,
    },
    quest_damage_9mm: {
        type: "quest",
        event: "damage",
        target: 250,
        xp: 30,
        icon: "img/emotes/ammo-9mm.svg",
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: "9mm",
            },
        ],
    },
    quest_damage_762mm: {
        type: "quest",
        event: "damage",
        target: 250,
        xp: 30,
        icon: "img/emotes/ammo-762mm.svg",
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: "762mm",
            },
        ],
    },
    quest_damage_556mm: {
        type: "quest",
        event: "damage",
        target: 250,
        xp: 30,
        icon: "img/emotes/ammo-556mm.svg",
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: "556mm",
            },
        ],
    },
    quest_damage_12gauge: {
        type: "quest",
        event: "damage",
        target: 250,
        xp: 30,
        icon: "img/emotes/ammo-12gauge.svg",
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: "12gauge",
            },
        ],
    },
    quest_damage_grenade: {
        type: "quest",
        event: "damage",
        target: 100,
        xp: 40,
        filters: [
            {
                type: "weapon",
                weaponClass: "throwable",
            },
        ],
    },
    quest_damage_melee: {
        type: "quest",
        event: "damage",
        target: 150,
        xp: 40,
        filters: [
            {
                type: "weapon",
                weaponClass: "melee",
            },
        ],
    },
    quest_heal: {
        type: "quest",
        event: "item_used",
        target: 10,
        xp: 30,
        filters: [
            {
                type: "item",
                subType: "category",
                itemCategory: "heal",
            },
        ],
    },
    quest_boost: {
        type: "quest",
        event: "item_used",
        target: 10,
        xp: 30,
        filters: [
            {
                type: "item",
                subType: "category",
                itemCategory: "boost",
            },
        ],
    },
    quest_airdrop: {
        type: "quest",
        event: "obstacle_used",
        target: 1,
        xp: 30,
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: "airdrop_crate",
            },
        ],
    },
    quest_crates: {
        type: "quest",
        event: "destruction",
        target: 25,
        xp: 30,
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: "crate",
            },
        ],
    },
    quest_toilets: {
        type: "quest",
        event: "destruction",
        target: 5,
        xp: 30,
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: "toilet",
            },
        ],
    },
    quest_furniture: {
        type: "quest",
        event: "destruction",
        target: 10,
        xp: 30,
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: "furniture",
            },
        ],
    },
    quest_barrels: {
        type: "quest",
        event: "destruction",
        target: 10,
        xp: 30,
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: "barrel",
            },
        ],
    },
    quest_lockers: {
        type: "quest",
        event: "destruction",
        target: 10,
        xp: 30,
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: "locker",
            },
        ],
    },
    quest_pots: {
        type: "quest",
        event: "destruction",
        target: 8,
        xp: 30,
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: "pot",
            },
        ],
    },
    quest_vending: {
        type: "quest",
        event: "destruction",
        target: 1,
        xp: 40,
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: "vending",
            },
        ],
    },
    quest_club_kills: {
        type: "quest",
        event: "kill",
        target: 2,
        xp: 40,
        filters: [
            {
                type: "building",
                subType: "category",
                structureCategory: "club",
            },
        ],
    },
};

export const exclusivityGroups: string[][] = [
    ["quest_kills", "quest_kills_hard"],
    ["quest_damage", "quest_damage_hard"],
];
