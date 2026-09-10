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

export interface FilterParams {
    team_mode: { mode: TeamMode };
    max_rank: { maxRank: number };
    building: { buildingType: Array<string> };
    role: { role: Array<string> };
    weapon: {
        weaponClass: "gun";
        weaponType?: string;
        ammo?: Array<string>;
    } | { weaponClass: "melee" | "throwable"; weaponType?: string };
    obstacle: { subType: "category"; obstacleCategory: Array<string> } | {
        subType: "type";
        obstacleType: Array<string>;
    };
    item: { subType: "category"; itemCategory: Array<string> } | {
        subType: "type";
        itemType: Array<string>;
    };
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
        Filter<"role">,
        Filter<"item">,
    ];
    airdrop_unlocked: [
        Filter<"team_mode">,
        Filter<"role">,
        Filter<"obstacle">,
    ];
    destruction: [
        Filter<"team_mode">,
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
export type MapFilter = MapFilterEntry[];

export type QuestMapFilter = {
    mapFilterType?: undefined;
} | {
    mapFilterType: "only_on" | "all_except";
    maps: MapFilter;
};

type QuestDefForEvent<E extends QuestEvent> = {
    type: "quest";
    event: E;
    target: number;
    xp: number;
    icon?: {
        urls: string[];
        rot?: number;
        scale?: number;
    };
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
        icon: {
            urls: ["img/gui/player.svg"],
        },
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
        icon: {
            urls: ["img/gui/player-duos.svg"],
        },
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
        icon: {
            urls: ["img/gui/player-squads.svg"],
        },
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
        mapFilterType: "all_except",
        maps: [MapId.Faction, MapId.FactionPotato],
    },
    quest_win_any: {
        type: "quest",
        event: "placement",
        target: 1,
        xp: 50,
        icon: {
            urls: ["img/gui/chicken.svg"],
        },
        filters: [
            {
                type: "max_rank",
                maxRank: 1,
            },
        ],
        difficulty: QuestDifficulty.Hard,
        mapFilterType: "all_except",
        maps: [MapId.Faction, MapId.FactionPotato],
    },
    quest_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        icon: {
            urls: ["img/gui/skull-team.svg"],
        },
    },
    quest_kills_hard: {
        type: "quest",
        event: "kill",
        target: 10,
        xp: 40,
        icon: {
            urls: ["img/gui/skull-team.svg"],
        },
    },
    quest_kills_harder: {
        type: "quest",
        event: "kill",
        target: 30,
        xp: 50,
        icon: {
            urls: ["img/gui/skull-team.svg"],
        },
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
        icon: {
            urls: ["img/gui/timer.svg"],
        },
        timed: true,
    },
    quest_damage_9mm: {
        type: "quest",
        event: "damage",
        target: 350,
        xp: 30,
        icon: {
            urls: ["img/emotes/ammo-9mm.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["9mm"],
            },
        ],
        mapFilterType: "all_except",
        maps: [MapId.Savannah, MapId.Cobalt],
    },
    quest_damage_9mm_ltm: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        icon: {
            urls: ["img/emotes/ammo-9mm.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["9mm"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Savannah, MapId.Cobalt],
    },
    quest_damage_762mm: {
        type: "quest",
        event: "damage",
        target: 350,
        xp: 30,
        icon: {
            urls: ["img/emotes/ammo-762mm.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["762mm"],
            },
        ],
        mapFilterType: "all_except",
        maps: [MapId.Savannah, MapId.Woods, MapId.Cobalt],
    },
    quest_damage_762mm_ltm: {
        type: "quest",
        event: "damage",
        target: 350,
        xp: 30,
        icon: {
            urls: ["img/emotes/ammo-762mm.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["762mm"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Savannah, MapId.Woods, MapId.Cobalt],
    },
    quest_damage_556mm: {
        type: "quest",
        event: "damage",
        target: 350,
        xp: 30,
        icon: {
            urls: ["img/emotes/ammo-556mm.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["556mm"],
            },
        ],
        mapFilterType: "all_except",
        maps: [MapId.Savannah, MapId.Woods, MapId.Cobalt],
    },
    quest_damage_556mm_ltm: {
        type: "quest",
        event: "damage",
        target: 350,
        xp: 30,
        icon: {
            urls: ["img/emotes/ammo-762mm.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["762mm"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Savannah, MapId.Woods, MapId.Cobalt],
    },
    quest_damage_12gauge: {
        type: "quest",
        event: "damage",
        target: 350,
        xp: 30,
        icon: {
            urls: ["img/emotes/ammo-12gauge.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["12gauge"],
            },
        ],
        mapFilterType: "all_except",
        maps: [MapId.Woods, MapId.Cobalt],
    },
    quest_damage_12gauge_ltm: {
        type: "quest",
        event: "damage",
        target: 700,
        xp: 30,
        icon: {
            urls: ["img/emotes/ammo-12gauge.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["12gauge"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Woods, MapId.Cobalt],
    },
    quest_damage_45acp: {
        type: "quest",
        event: "damage",
        target: 350,
        xp: 30,
        icon: {
            urls: ["img/emotes/ammo-45acp.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["45acp"],
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
        icon: {
            urls: ["img/emotes/ammo-potato_ammo.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["potato_ammo"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Potato, MapId.FactionPotato],
    },
    quest_damage_rare_ammo: {
        type: "quest",
        event: "damage",
        target: 250,
        xp: 50,
        icon: {
            urls: [
                "img/emotes/ammo-50AE.svg",
                "img/emotes/ammo-308sub.svg",
            ],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["50AE", "308sub"],
            },
        ],
        difficulty: QuestDifficulty.Hard,
        mapFilterType: "all_except",
        maps: [MapId.Faction, MapId.Desert, MapId.Savannah, MapId.Potato, MapId.FactionPotato],
    },
    quest_damage_rare_ammo_ltm: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 50,
        icon: {
            urls: [
                "img/emotes/ammo-50AE.svg",
                "img/emotes/ammo-308sub.svg",
            ],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "gun",
                ammo: ["50AE", "308sub"],
            },
        ],
        difficulty: QuestDifficulty.Hard,
        mapFilterType: "only_on",
        maps: [MapId.Faction, MapId.Desert, MapId.Savannah, MapId.Potato, MapId.FactionPotato],
    },
    quest_damage_woods_king: {
        type: "quest",
        event: "damage",
        target: 1000,
        xp: 50,
        icon: {
            urls: ["img/gui/quest-damage-woods-king.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["woods_king"],
            },
        ],
        difficulty: QuestDifficulty.Hard,
        mapFilterType: "only_on",
        maps: [MapId.Woods],
    },
    quest_damage_grenade: {
        type: "quest",
        event: "damage",
        target: 200,
        xp: 40,
        icon: {
            urls: [
                "img/loot/loot-throwable-frag.svg",
                "img/loot/loot-throwable-mirv.svg",
                "img/loot/loot-throwable-strobe.svg",
            ],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "throwable",
            },
        ],
        mapFilterType: "all_except",
        maps: [MapId.Cobalt],
    },
    quest_damage_grenade_ltm: {
        type: "quest",
        event: "damage",
        target: 400,
        xp: 40,
        icon: {
            urls: [
                "img/loot/loot-throwable-frag.svg",
                "img/loot/loot-throwable-mirv.svg",
            ],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "throwable",
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_damage_melee: {
        type: "quest",
        event: "damage",
        target: 250,
        xp: 40,
        icon: {
            urls: ["img/gui/loadout-melee.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "melee",
            },
        ],
        mapFilterType: "all_except",
        maps: [MapId.Cobalt],
    },
    quest_damage_melee_ltm: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        icon: {
            urls: ["img/gui/loadout-melee.svg"],
        },
        filters: [
            {
                type: "weapon",
                weaponClass: "melee",
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_heal: {
        type: "quest",
        event: "item_used",
        target: 10,
        xp: 30,
        icon: {
            urls: [
                "img/loot/loot-medical-bandage.svg",
                "img/loot/loot-medical-healthkit.svg",
            ],
        },
        filters: [
            {
                type: "item",
                subType: "category",
                itemCategory: ["heal"],
            },
        ],
    },
    quest_boost: {
        type: "quest",
        event: "item_used",
        target: 10,
        xp: 30,
        icon: {
            urls: [
                "img/loot/loot-medical-soda.svg",
                "img/loot/loot-medical-pill.svg",
            ],
        },
        filters: [
            {
                type: "item",
                subType: "category",
                itemCategory: ["boost"],
            },
        ],
    },
    quest_airdrop: {
        type: "quest",
        event: "airdrop_unlocked",
        target: 1,
        xp: 30,
        icon: {
            urls: ["img/gui/ping-team-airdrop.svg"],
        },
        mapFilterType: "all_except",
        maps: [MapId.Desert, MapId.FactionPotato, MapId.Potato],
    },
    quest_airdrop_ltm: {
        type: "quest",
        event: "airdrop_unlocked",
        target: 5,
        xp: 30,
        icon: {
            urls: ["img/gui/ping-team-airdrop.svg"],
        },
        mapFilterType: "only_on",
        maps: [MapId.Desert, MapId.FactionPotato, MapId.Potato],
    },
    quest_airdrop_ltm_hard: {
        type: "quest",
        event: "airdrop_unlocked",
        target: 10,
        xp: 40,
        icon: {
            urls: ["img/gui/ping-team-airdrop.svg"],
        },
        mapFilterType: "only_on",
        maps: [MapId.Desert, MapId.FactionPotato, MapId.Potato],
    },
    quest_airdrop_rare: {
        type: "quest",
        event: "airdrop_unlocked",
        target: 1,
        xp: 40,
        icon: {
            urls: ["img/gui/ping-team-airdrop.svg"],
        },
        filters: [
            {
                type: "obstacle",
                subType: "type",
                obstacleType: [
                    "airdrop_crate_02",
                    "airdrop_crate_02de",
                    "airdrop_crate_02h",
                    "airdrop_crate_02sv",
                    "airdrop_crate_02x",
                    "airdrop_crate_03dev",
                    "airdrop_crate_04",
                    "airdrop_crate_05",
                ],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Desert],
    },
    quest_crates: {
        type: "quest",
        event: "destruction",
        target: 25,
        xp: 30,
        icon: {
            urls: ["img/map/map-crate-01.svg"],
        },
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: ["crate"],
            },
        ],
    },
    quest_toilets: {
        type: "quest",
        event: "destruction",
        target: 5,
        xp: 30,
        icon: {
            urls: ["img/map/map-toilet-01.svg"],
        },
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: ["toilet"],
            },
        ],
    },
    quest_furniture: {
        type: "quest",
        event: "destruction",
        target: 10,
        xp: 30,
        icon: {
            urls: [
                "img/map/map-stand-01.svg",
                "img/map/map-table-03.svg",
                "img/map/map-couch-03.svg",
            ],
        },
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: ["furniture"],
            },
        ],
    },
    quest_barrels: {
        type: "quest",
        event: "destruction",
        target: 10,
        xp: 30,
        icon: {
            urls: [
                "img/map/map-barrel-01.svg",
                "img/map/map-barrel-02.svg",
            ],
        },
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: ["barrel"],
            },
        ],
    },
    quest_lockers: {
        type: "quest",
        event: "destruction",
        target: 10,
        xp: 30,
        icon: {
            urls: [
                "img/map/map-locker-01.svg",
                "img/map/map-deposit-box-01.svg",
            ],
        },
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: ["locker"],
            },
        ],
    },
    quest_pots: {
        type: "quest",
        event: "destruction",
        target: 8,
        xp: 30,
        icon: {
            urls: ["img/map/map-pot-01.svg"],
        },
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: ["pot"],
            },
        ],
    },
    quest_vending: {
        type: "quest",
        event: "destruction",
        target: 1,
        xp: 40,
        icon: {
            urls: ["img/map/map-vending-soda-01.svg"],
        },
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: ["vending"],
            },
        ],
    },
    quest_hardstone: {
        type: "quest",
        event: "destruction",
        target: 2,
        xp: 40,
        icon: {
            urls: [
                "img/map/map-stone-04.svg",
                "img/map/map-stone-05.svg",
            ],
        },
        filters: [
            {
                type: "obstacle",
                subType: "type",
                obstacleType: [
                    "stone_04",
                    "stone_04x",
                    "stone_05",
                ],
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
        icon: {
            urls: [
                "img/map/map-crate-02.svg",
                "img/map/map-crate-02f.svg",
            ],
        },
        filters: [
            {
                type: "obstacle",
                subType: "type",
                obstacleType: [
                    "crate_02",
                    "crate_02f",
                ],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Faction, MapId.FactionPotato],
    },
    quest_initiative_crate: {
        type: "quest",
        event: "destruction",
        target: 3,
        xp: 30,
        icon: {
            urls: ["img/map/map-crate-22.svg"],
        },
        filters: [
            {
                type: "obstacle",
                subType: "type",
                obstacleType: ["crate_22"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Faction, MapId.FactionPotato],
    },
    quest_pvt_swappers: {
        type: "quest",
        event: "destruction",
        target: 50,
        xp: 30,
        icon: {
            urls: [
                "img/map/map-potato-01.svg",
                "img/map/map-tomato-01.svg",
            ],
        },
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: ["potato"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.FactionPotato],
    },
    quest_potatoes: {
        type: "quest",
        event: "destruction",
        target: 50,
        xp: 30,
        icon: {
            urls: ["img/map/map-potato-01.svg"],
        },
        filters: [
            {
                type: "obstacle",
                subType: "category",
                obstacleCategory: ["potato"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Potato],
    },
    quest_club_kills: {
        type: "quest",
        event: "kill",
        target: 2,
        xp: 40,
        icon: {
            urls: ["img/gui/club-ring.svg"],
        },
        filters: [
            {
                type: "building",
                buildingType: ["club_01", "bathhouse_01"],
            },
        ],
        mapFilterType: "all_except",
        maps: [
            MapId.Beach,
            MapId.Birthday,
            MapId.Desert,
            MapId.Faction,
            MapId.FactionPotato,
            MapId.Halloween,
            MapId.Savannah,
            MapId.Woods,
        ],
    },
    quest_docks_kills: {
        type: "quest",
        event: "kill",
        target: 2,
        xp: 40,
        filters: [
            {
                type: "building",
                buildingType: ["warehouse_complex_01"],
            },
        ],
        mapFilterType: "all_except",
        maps: [MapId.Faction, MapId.FactionPotato, MapId.Savannah, MapId.Woods, MapId.Desert, MapId.Birthday],
    },
    quest_river_town_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 30,
        filters: [
            {
                type: "building",
                buildingType: ["river_town_01"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Faction, MapId.FactionPotato],
    },
    quest_desert_town_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 30,
        filters: [
            {
                type: "building",
                buildingType: ["desert_town_01", "desert_town_02"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Desert],
    },
    quest_reserve_kills: {
        type: "quest",
        event: "kill",
        target: 2,
        xp: 40,
        filters: [
            {
                type: "building",
                buildingType: ["reserve_01", "reserve_basement_01"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Desert],
    },
    quest_logging_complex_kills: {
        type: "quest",
        event: "kill",
        target: 2,
        xp: 40,
        icon: {
            urls: ["img/gui/hatchet.svg"],
        },
        filters: [
            {
                type: "building",
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
        icon: {
            urls: [
                "img/gui/ribbon-red.svg",
                "img/gui/ribbon-blue.svg",
            ],
            scale: 1.2,
        },
        mapFilterType: "only_on",
        maps: [MapId.Faction, MapId.FactionPotato],
        difficulty: QuestDifficulty.Hard,
    },
    quest_promote_hunted: {
        type: "quest",
        event: "promote",
        target: 1,
        xp: 40,
        icon: {
            urls: ["img/gui/quest-promote-hunted.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["the_hunted"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Savannah],
    },
    quest_factions_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 40,
        filters: [
            {
                type: "role",
                role: [
                    "leader",
                    "captain",
                    "lieutenant",
                    "medic",
                    "marksman",
                    "recon",
                    "grenadier",
                    "bugler",
                    "last_man",
                ],
            },
        ],
        icon: {
            urls: [
                "img/loot/player-helmet-leader.svg",
                "img/loot/player-helmet-captain.svg",
                "img/loot/player-helmet-lieutenant.svg",
                "img/loot/player-helmet-medic.svg",
                "img/loot/player-helmet-marksman.svg",
                "img/loot/player-helmet-recon.svg",
                "img/loot/player-helmet-grenadier.svg",
                "img/loot/player-helmet-bugler.svg",
                "img/loot/player-helmet-last-man-01.svg",
            ],
            rot: Math.PI / 2,
            scale: 1.5,
        },
        mapFilterType: "only_on",
        maps: [MapId.Faction, MapId.FactionPotato],
    },
    quest_last_man_damage_hard: {
        type: "quest",
        event: "damage",
        target: 1000,
        xp: 50,
        icon: {
            urls: [
                "img/loot/player-helmet-last-man-01.svg",
                "img/loot/player-helmet-last-man-02.svg",
            ],
            rot: Math.PI / 2,
            scale: 1.5,
        },
        filters: [
            {
                type: "role",
                role: ["last_man"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Faction, MapId.FactionPotato],
        difficulty: QuestDifficulty.Hard,
    },
    quest_factions_kills: {
        type: "quest",
        event: "kill",
        target: 3,
        xp: 40,
        filters: [
            {
                type: "role",
                role: [
                    "leader",
                    "captain",
                    "lieutenant",
                    "medic",
                    "marksman",
                    "recon",
                    "grenadier",
                    "bugler",
                    "last_man",
                ],
            },
        ],
        icon: {
            urls: [
                "img/loot/player-helmet-leader.svg",
                "img/loot/player-helmet-captain.svg",
                "img/loot/player-helmet-lieutenant.svg",
                "img/loot/player-helmet-medic.svg",
                "img/loot/player-helmet-marksman.svg",
                "img/loot/player-helmet-recon.svg",
                "img/loot/player-helmet-grenadier.svg",
                "img/loot/player-helmet-bugler.svg",
                "img/loot/player-helmet-last-man-01.svg",
            ],
            rot: Math.PI / 2,
            scale: 1.5,
        },
        mapFilterType: "only_on",
        maps: [MapId.Faction, MapId.FactionPotato],
    },
    quest_healer_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        icon: {
            urls: ["img/gui/role-healer.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["healer"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_tank_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        icon: {
            urls: ["img/gui/role-tank.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["tank"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_sniper_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        icon: {
            urls: ["img/gui/role-sniper.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["sniper"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_scout_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        icon: {
            urls: ["img/gui/role-scout.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["scout"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_demo_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        icon: {
            urls: ["img/gui/role-demo.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["demo"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_assault_kills: {
        type: "quest",
        event: "kill",
        target: 5,
        xp: 30,
        icon: {
            urls: ["img/gui/role-assault.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["assault"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_healer_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        icon: {
            urls: ["img/gui/role-healer.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["healer"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_tank_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        icon: {
            urls: ["img/gui/role-tank.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["tank"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_sniper_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        icon: {
            urls: ["img/gui/role-sniper.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["sniper"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_scout_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        icon: {
            urls: ["img/gui/role-scout.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["scout"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_demo_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        icon: {
            urls: ["img/gui/role-demo.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["demo"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_assault_damage: {
        type: "quest",
        event: "damage",
        target: 500,
        xp: 30,
        icon: {
            urls: ["img/gui/role-assault.svg"],
        },
        filters: [
            {
                type: "role",
                role: ["assault"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
    },
    quest_classless_damage: {
        type: "quest",
        event: "damage",
        target: 750,
        xp: 50,
        icon: {
            urls: ["img/loot/player-helmet-classless.svg"],
            rot: Math.PI / 2,
            scale: 1.5,
        },
        filters: [
            {
                type: "role",
                role: ["classless"],
            },
        ],
        mapFilterType: "only_on",
        maps: [MapId.Cobalt],
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
    ["quest_factions_damage", "quest_last_man_damage_hard"],
];
