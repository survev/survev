import { MapId, TeamMode } from "../../gameConfig.ts";
import type { MapDefKey } from "../mapDefs.ts";

export type QuestEvent =
    | "kill"
    | "damage"
    | "survived"
    | "placement"
    | "item_used"
    | "airdrop_unlocked"
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
    airdrop_unlocked: [
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

export type MapFilterEntry = MapId | MapDefKey;
export type MapFilter = MapFilterEntry | MapFilterEntry[];

export type QuestMapFilter = {
    mapFilterType?: undefined;
} | {
    mapFilterType: "only_on" | "all_except";
    maps: MapFilter;
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
} & QuestMapFilter;

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
    quest_win_any: {
        type: "quest",
        event: "placement",
        target: 1,
        xp: 50,
        filters: [
            {
                type: "max_rank",
                maxRank: 1,
            },
        ],
        difficulty: QuestDifficulty.Hard,
        mapFilterType: "all_except",
        maps: MapId.Faction,
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
    quest_kills_harder: {
        type: "quest",
        event: "kill",
        target: 30,
        xp: 50,
        difficulty: QuestDifficulty.Hard,
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
    quest_damage_harder: {
        type: "quest",
        event: "damage",
        target: 4500,
        xp: 50,
        difficulty: QuestDifficulty.Hard,
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
        target: 350,
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
        target: 350,
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
        target: 350,
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
        target: 350,
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
    quest_damage_45acp: {
        type: "quest",
        event: "damage",
        target: 350,
        xp: 30,
        icon: "img/emotes/ammo-45acp.svg",
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: "45acp",
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Desert, MapId.Savannah],
    },
    quest_damage_potato_ammo: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        icon: "img/emotes/ammo-potato_ammo.svg",
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: "potato_ammo",
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Potato, "faction_potato"],
    },
    quest_damage_rare_ammo: {
        type: "quest",
        event: "damage",
        target: 250,
        xp: 50,
        icon: "img/emotes/ammo-50AE.svg",
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["50AE", "308sub"],
            },
        ],
        difficulty: QuestDifficulty.Hard,
    },
    quest_damage_woods_king: {
        type: "quest",
        event: "damage",
        target: 1000,
        xp: 50,
        filters: [
            {
                type: "role",
                role: "woods_king",
            },
        ],
        difficulty: QuestDifficulty.Hard,
    },
    quest_damage_grenade: {
        type: "quest",
        event: "damage",
        target: 200,
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
        target: 250,
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
        event: "airdrop_unlocked",
        target: 1,
        xp: 30,
        filters: [],
    },
    quest_airdrop_rare: {
        type: "quest",
        event: "airdrop_unlocked",
        target: 1,
        xp: 40,
        filters: [
            {
                type: "obstacle",
                subType: "type",
                obstacleType: ["airdrop_crate_02de", "airdrop_crate_05"],
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
    quest_hardstone: {
        type: "quest",
        event: "destruction",
        target: 2,
        xp: 40,
        filters: [
            {
                type: "obstacle",
                subType: "type",
                obstacleType: ["stone_04", "stone_05"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Desert, MapId.Woods],
    },
    quest_soviet_crate: {
        type: "quest",
        event: "destruction",
        target: 3,
        xp: 30,
        filters: [
            {
                type: "obstacle",
                subType: "type",
                obstacleType: "crate_02f",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_initiative_crate: {
        type: "quest",
        event: "destruction",
        target: 3,
        xp: 30,
        filters: [
            {
                type: "obstacle",
                subType: "type",
                obstacleType: "crate_22",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_pvt_swappers: {
        type: "quest",
        event: "destruction",
        target: 50,
        xp: 30,
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: "pvt_swapper",
            },
        ],
        mapFilterType: "only_on",
        maps: "faction_potato",
    },
    quest_potatoes: {
        type: "quest",
        event: "destruction",
        target: 50,
        xp: 30,
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: "potato",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Potato,
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
        mapFilterType: "only_on",
        maps: [MapId.Main, MapId.Cobalt, MapId.Beach, MapId.Potato],
    },
    quest_docks_kills: {
        type: "quest",
        event: "kill",
        target: 2,
        xp: 40,
        filters: [
            {
                type: "building",
                subType: "type",
                buildingType: "warehouse_complex_01",
            },
        ],
        mapFilterType: "all_except",
        maps: MapId.Faction,
    },
    quest_river_town_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 30,
        filters: [
            {
                type: "building",
                subType: "type",
                buildingType: "river_town_01",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_desert_town_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 30,
        filters: [
            {
                type: "building",
                subType: "type",
                buildingType: ["desert_town_01", "desert_town_02"],
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Desert,
    },
    quest_reserve_kills: {
        type: "quest",
        event: "kill",
        target: 2,
        xp: 40,
        filters: [
            {
                type: "building",
                subType: "type",
                buildingType: "reserve_01",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Desert,
    },
    quest_logging_complex_kills: {
        type: "quest",
        event: "kill",
        target: 2,
        xp: 40,
        filters: [
            {
                type: "building",
                subType: "type",
                buildingType: [
                    "logging_complex_01",
                    "logging_complex_01sp",
                    "logging_complex_01su",
                ],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Woods],
    },
    quest_be_mvp: {
        type: "quest",
        event: "be_mvp",
        target: 1,
        xp: 50,
        mapFilterType: "only_on",
        maps: MapId.Faction,
        difficulty: QuestDifficulty.Hard,
    },
    quest_promote_hunted: {
        type: "quest",
        event: "promote",
        target: 1,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "the_hunted",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Savannah,
    },
    quest_leader_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "leader",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_captain_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "captain",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_lieutenant_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "lieutenant",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_medic_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "medic",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_marksman_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "marksman",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_recon_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "recon",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_grenadier_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "grenadier",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_bugler_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "bugler",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_last_man_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "last_man",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_last_man_damage_hard: {
        type: "quest",
        event: "damage",
        target: 1000,
        xp: 50,
        filters: [
            {
                type: "role",
                role: "last_man",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
        difficulty: QuestDifficulty.Hard,
    },
    quest_leader_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "leader",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_captain_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "captain",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_lieutenant_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "lieutenant",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_medic_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "medic",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_marksman_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "marksman",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_recon_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "recon",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_grenadier_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "grenadier",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_bugler_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "bugler",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_last_man_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 40,
        filters: [
            {
                type: "role",
                role: "last_man",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Faction,
    },
    quest_healer_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "healer",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_tank_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "tank",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_sniper_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "sniper",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_scout_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "scout",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_demo_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "demo",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_assault_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "assault",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_healer_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "healer",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_tank_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "tank",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_sniper_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "sniper",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_scout_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "scout",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_demo_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "demo",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_assault_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        filters: [
            {
                type: "role",
                role: "assault",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
    },
    quest_classless_damage: {
        type: "quest",
        event: "damage",
        target: 750,
        xp: 50,
        filters: [
            {
                type: "role",
                role: "classless",
            },
        ],
        mapFilterType: "only_on",
        maps: MapId.Cobalt,
        difficulty: QuestDifficulty.Hard,
    },
};

export const exclusivityGroups: string[][] = [
    ["quest_kills", "quest_kills_hard", "quest_kills_harder"],
    ["quest_damage", "quest_damage_hard", "quest_damage_harder"],
    ["quest_healer_kills", "quest_healer_damage"],
    ["quest_tank_kills", "quest_tank_damage"],
    ["quest_sniper_kills", "quest_sniper_damage"],
    ["quest_scout_kills", "quest_scout_damage"],
    ["quest_demo_kills", "quest_demo_damage"],
    ["quest_assault_kills", "quest_assault_damage"],
    ["quest_reserve_kills", "quest_desert_town_kills"],
    ["quest_soviet_crate", "quest_initiative_crate"],
    ["quest_win_any", "quest_top_solo"],
    ["quest_win_any", "quest_top_duo"],
    ["quest_win_any", "quest_top_squad"],
];
