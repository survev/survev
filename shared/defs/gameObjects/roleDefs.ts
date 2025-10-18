import type { InventoryItem } from "../../gameConfig";
import { type DeepPartial, util } from "../../utils/util";
import { TeamColor } from "../maps/factionDefs";

type BasicRoleWeapon = {
    type: string;
    ammo: number;
    /** guns only, fill inventory to the max of the respective ammo */
    fillInv?: boolean;
};
/**
 * a role weapon not only needs to be conditionally defined depending on what team the player with the role is,
 * but it also needs to be able to be randomly chosen to satisfy the requirements of certain roles like marksman
 */
type RoleWeapon = BasicRoleWeapon | ((teamcolor: TeamColor) => BasicRoleWeapon);

function getTeamWeapon(
    colorToWeaponMap: Record<TeamColor, BasicRoleWeapon>,
    teamcolor: TeamColor,
): BasicRoleWeapon {
    return colorToWeaponMap[teamcolor];
}

function getTeamHelmet(
    colorToHelmetMap: Record<TeamColor, string>,
    teamcolor: TeamColor,
) {
    return colorToHelmetMap[teamcolor];
}

type DefaultItems = {
    weapons: [RoleWeapon, RoleWeapon, RoleWeapon, RoleWeapon];
    backpack: string;
    helmet: string | ((teamcolor: TeamColor) => string);
    chest: string;
    outfit: string | ((teamcolor: TeamColor) => string);
    inventory: Partial<Record<InventoryItem, number>>;
};

export interface RoleDef {
    readonly type: "role";
    announce: boolean;
    killFeed?: {
        assign?: boolean;
        dead?: boolean;
        color?: string;
    };
    sound: {
        assign?: string;
        dead?: string;
    };

    mapIcon?: {
        alive: string;
        dead?: string;
    };
    defaultItems?: DefaultItems;
    perks?: (string | (() => string))[];
    mapIndicator?: {
        sprite: string;
        tint: number;
        pulse: boolean;
        pulseTint: number;
    };
    visorImg?: {
        baseSprite: string;
        spriteScale: number;
    };
    guiImg?: string;
    color?: number;
}

function createDefaultItems(e: DeepPartial<DefaultItems>): DefaultItems {
    const defaultItems: DefaultItems = {
        weapons: [
            { type: "", ammo: 0 },
            { type: "", ammo: 0 },
            { type: "", ammo: 0 },
            { type: "", ammo: 0 },
        ],
        backpack: "",
        helmet: "",
        chest: "",
        outfit: "",
        // perks: [] as Array<{ type: string; droppable?: boolean }>,
        inventory: {
            "9mm": 0,
            "762mm": 0,
            "556mm": 0,
            "12gauge": 0,
            "50AE": 0,
            "308sub": 0,
            flare: 0,
            "45acp": 0,
            frag: 0,
            smoke: 0,
            strobe: 0,
            mirv: 0,
            snowball: 0,
            potato: 0,
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
    };
    return util.mergeDeep(defaultItems, e || {});
}

export const RoleDefs: Record<string, RoleDef> = {
    leader: {
        type: "role",
        announce: true,
        killFeed: { assign: true, dead: true },
        sound: {
            assign: "leader_assigned_01",
            dead: "leader_dead_01",
        },
        mapIcon: {
            alive: "player-star.img",
            dead: "skull-leader.img",
        },
        perks: ["leadership"],
        defaultItems: createDefaultItems({
            weapons: [
                (teamcolor: TeamColor) =>
                    getTeamWeapon(
                        {
                            [TeamColor.Red]: { type: "m1014", ammo: 8, fillInv: true },
                            [TeamColor.Blue]: { type: "an94", ammo: 45, fillInv: true },
                        },
                        teamcolor,
                    ),
                { type: "flare_gun", ammo: 1 },
                (teamcolor: TeamColor) =>
                    getTeamWeapon(
                        {
                            [TeamColor.Red]: { type: "machete_taiga", ammo: 0 },
                            [TeamColor.Blue]: { type: "kukri_trad", ammo: 0 },
                        },
                        teamcolor,
                    ),
                { type: "", ammo: 0 },
            ],
            backpack: "backpack03",
            helmet: "helmet04_leader",
            chest: "chest03",
            outfit: (teamcolor: TeamColor) =>
                ({
                    [TeamColor.Red]: "outfitRedLeader",
                    [TeamColor.Blue]: "outfitBlueLeader",
                })[teamcolor],
            inventory: {
                "8xscope": 1,
                bandage: 10,
                healthkit: 1,
            },
        }),
    },
    captain: {
        type: "role",
        announce: true,
        killFeed: { assign: true },
        sound: { assign: "captain_assigned_01" },
        mapIcon: {
            alive: "player-captain.img",
        },
        perks: ["assume_leadership", "firepower"],
        defaultItems: createDefaultItems({
            weapons: [
                { type: "", ammo: 0 },
                { type: "", ammo: 0 },
                { type: "", ammo: 0 },
                { type: "", ammo: 0 },
            ],
            backpack: "backpack03",
            helmet: "helmet04_captain",
            chest: "chest03",
            outfit: (teamcolor: TeamColor) =>
                ({
                    [TeamColor.Red]: "outfitRedLeader",
                    [TeamColor.Blue]: "outfitBlueLeader",
                })[teamcolor],
            inventory: {
                "8xscope": 1,
                bandage: 10,
                healthkit: 1,
                soda: 2,
            },
        }),
    },
    lieutenant: {
        type: "role",
        announce: true,
        killFeed: { assign: true },
        sound: { assign: "lt_assigned_01" },
        perks: ["firepower"],
        defaultItems: createDefaultItems({
            weapons: [
                { type: "", ammo: 0 },
                (teamcolor: TeamColor) =>
                    getTeamWeapon(
                        {
                            [TeamColor.Red]: { type: "m4a1", ammo: 40, fillInv: true },
                            [TeamColor.Blue]: { type: "grozas", ammo: 40, fillInv: true },
                        },
                        teamcolor,
                    ),
                { type: "spade_assault", ammo: 0 },
                { type: "", ammo: 0 },
            ],
            backpack: "backpack03",
            helmet: "helmet03_lt",
            chest: "chest03",
            inventory: {
                "4xscope": 1,
                bandage: 10,
                healthkit: 1,
                soda: 2,
            },
        }),
    },
    medic: {
        type: "role",
        announce: true,
        killFeed: { assign: true },
        sound: { assign: "medic_assigned_01" },
        mapIcon: {
            alive: "player-medic.img",
            dead: "skull-leader.img",
        },
        perks: ["aoe_heal", "self_revive"],
        defaultItems: createDefaultItems({
            weapons: [
                { type: "", ammo: 0 },
                { type: "", ammo: 0 },
                { type: "bonesaw_rusted", ammo: 0 },
                { type: "smoke", ammo: 0 },
            ],
            backpack: "backpack03",
            helmet: "helmet04_medic",
            chest: "chest03",
            inventory: {
                "4xscope": 1,
                bandage: 30,
                healthkit: 4,
                painkiller: 4,
                soda: 15,
                smoke: 6,
            },
        }),
    },
    marksman: {
        type: "role",
        announce: true,
        killFeed: { assign: true },
        sound: { assign: "marksman_assigned_01" },
        perks: ["targeting"],
        defaultItems: createDefaultItems({
            weapons: [
                { type: "", ammo: 0 },
                (teamcolor: TeamColor) =>
                    getTeamWeapon(
                        {
                            [TeamColor.Red]: util.weightedRandom([
                                { type: "l86", ammo: 30, fillInv: true, weight: 0.9 },
                                { type: "scarssr", ammo: 10, fillInv: true, weight: 0.1 },
                            ]),
                            [TeamColor.Blue]: util.weightedRandom([
                                { type: "svd", ammo: 10, fillInv: true, weight: 0.9 },
                                { type: "scarssr", ammo: 10, fillInv: true, weight: 0.1 },
                            ]),
                        },
                        teamcolor,
                    ),
                { type: "kukri_sniper", ammo: 0 },
                { type: "", ammo: 0 },
            ],
            backpack: "backpack03",
            helmet: "helmet03_marksman",
            chest: "chest03",
            inventory: {
                "8xscope": 1,
                bandage: 5,
            },
        }),
    },
    recon: {
        type: "role",
        announce: true,
        killFeed: { assign: true },
        sound: { assign: "recon_assigned_01" },
        perks: ["small_arms"],
        defaultItems: createDefaultItems({
            weapons: [
                { type: "", ammo: 0 },
                { type: "glock_dual", ammo: 34, fillInv: true },
                { type: "crowbar_recon", ammo: 0 },
                { type: "", ammo: 0 },
            ],
            backpack: "backpack03",
            helmet: "helmet03_recon",
            chest: "chest03",
            inventory: {
                "4xscope": 1,
                soda: 6,
                bandage: 5,
            },
        }),
    },
    grenadier: {
        type: "role",
        announce: true,
        killFeed: { assign: true },
        sound: { assign: "grenadier_assigned_01" },
        perks: ["flak_jacket"],
        defaultItems: createDefaultItems({
            weapons: [
                { type: "", ammo: 0 },
                { type: "saiga", ammo: 5, fillInv: true },
                { type: "katana", ammo: 0 },
                { type: "mirv", ammo: 8 },
            ],
            backpack: "backpack03",
            helmet: "helmet03_grenadier",
            chest: "chest03",
            inventory: {
                mirv: 8,
                frag: 12,
                "4xscope": 1,
                bandage: 5,
            },
        }),
    },
    bugler: {
        type: "role",
        announce: true,
        killFeed: { assign: true },
        sound: { assign: "bugler_assigned_01" },
        perks: ["inspiration", "final_bugle"],
        defaultItems: createDefaultItems({
            weapons: [
                { type: "", ammo: 0 },
                { type: "bugle", ammo: 1 },
                { type: "pan", ammo: 0 },
                { type: "", ammo: 0 },
            ],
            backpack: "backpack03",
            helmet: "helmet03_bugler",
            chest: "chest03",
            inventory: {
                "4xscope": 1,
                bandage: 5,
            },
        }),
    },
    last_man: {
        type: "role",
        announce: true,
        killFeed: { assign: true },
        sound: { assign: "last_man_assigned_01" },
        perks: [
            "steelskin",
            () =>
                util.weightedRandom([
                    { type: "ap_rounds", weight: 1 },
                    { type: "splinter", weight: 1 },
                ]).type,
            "takedown",
            () =>
                util.weightedRandom([
                    { type: "windwalk", weight: 1 },
                    { type: "field_medic", weight: 1 },
                ]).type,
        ],
        defaultItems: createDefaultItems({
            weapons: [
                { type: "", ammo: 0 },
                (teamcolor: TeamColor) =>
                    getTeamWeapon(
                        {
                            [TeamColor.Red]: util.weightedRandom([
                                { type: "m249", ammo: 100, fillInv: true, weight: 1 },
                                { type: "pkp", ammo: 200, fillInv: true, weight: 1 },
                            ]),
                            [TeamColor.Blue]: util.weightedRandom([
                                { type: "m249", ammo: 100, fillInv: true, weight: 1 },
                                { type: "pkp", ammo: 200, fillInv: true, weight: 1 },
                            ]),
                        },
                        teamcolor,
                    ),
                { type: "", ammo: 0 },
                { type: "mirv", ammo: 8 },
            ],
            backpack: "backpack03",
            helmet: (teamcolor: TeamColor) =>
                getTeamHelmet(
                    {
                        [TeamColor.Red]: "helmet04_last_man_red",
                        [TeamColor.Blue]: "helmet04_last_man_blue",
                    },
                    teamcolor,
                ),
            chest: "chest04",
            inventory: {
                mirv: 8,
                "8xscope": 1,
                bandage: 10,
                healthkit: 1,
                soda: 2,
            },
        }),
    },
    woods_king: {
        type: "role",
        announce: false,
        killFeed: { dead: true, color: "#12ff00" },
        sound: { dead: "leader_dead_01" },
        perks: ["gotw", "windwalk"],
    },
    kill_leader: {
        type: "role",
        announce: false,
        killFeed: { assign: true, dead: true, color: "#ff8400" },
        sound: {
            assign: "leader_assigned_01",
            dead: "leader_dead_01",
        },
    },
    the_hunted: {
        type: "role",
        announce: true,
        killFeed: { assign: true, dead: true, color: "#ff8400" },
        sound: {
            assign: "leader_assigned_01",
            dead: "leader_dead_01",
        },
        mapIndicator: {
            sprite: "player-the-hunted.img",
            tint: 0xff8400,
            pulse: true,
            pulseTint: 0xff8400,
        },
        perks: ["hunted"],
    },
    healer: {
        type: "role",
        defaultItems: createDefaultItems({
            outfit: "outfitMedic",
            inventory: {
                healthkit: 1,
            },
        }),
        announce: false,
        sound: { assign: "spawn_01" },
        perks: ["field_medic", "windwalk"],
        visorImg: {
            baseSprite: "player-visor-healer.img",
            spriteScale: 0.3,
        },
        guiImg: "img/gui/role-healer.svg",
        color: 0xaf00af,
    },
    tank: {
        type: "role",
        defaultItems: createDefaultItems({
            outfit: "outfitTank",
            chest: "chest01",
        }),
        announce: false,
        sound: { assign: "spawn_01" },
        perks: ["steelskin", "endless_ammo"],
        visorImg: {
            baseSprite: "player-visor-tank.img",
            spriteScale: 0.3,
        },
        guiImg: "img/gui/role-tank.svg",
        color: 0xd38600,
    },
    sniper: {
        type: "role",
        defaultItems: createDefaultItems({
            outfit: "outfitSniper",
            inventory: {
                "2xscope": 1,
            },
        }),
        announce: false,
        sound: { assign: "spawn_01" },
        perks: ["chambered", "takedown"],
        visorImg: {
            baseSprite: "player-visor-sniper.img",
            spriteScale: 0.3,
        },
        guiImg: "img/gui/role-sniper.svg",
        color: 0x77e8,
    },
    scout: {
        type: "role",
        defaultItems: createDefaultItems({
            outfit: "outfitScout",
            inventory: {
                soda: 1,
            },
        }),
        announce: false,
        sound: { assign: "spawn_01" },
        perks: ["small_arms", "tree_climbing"],
        visorImg: {
            baseSprite: "player-visor-scout.img",
            spriteScale: 0.3,
        },
        guiImg: "img/gui/role-scout.svg",
        color: 0x66a000,
    },
    demo: {
        type: "role",
        defaultItems: createDefaultItems({
            outfit: "outfitDemo",
            backpack: "backpack01",
        }),
        announce: false,
        sound: { assign: "spawn_01" },
        perks: ["fabricate", "flak_jacket"],
        visorImg: {
            baseSprite: "player-visor-demo.img",
            spriteScale: 0.3,
        },
        guiImg: "img/gui/role-demo.svg",
        color: 0x670300,
    },
    assault: {
        type: "role",
        defaultItems: createDefaultItems({
            outfit: "outfitAssault",
            inventory: {
                bandage: 5,
            },
        }),
        announce: false,
        sound: { assign: "spawn_01" },
        perks: ["firepower", "bonus_assault"],
        visorImg: {
            baseSprite: "player-visor-assault.img",
            spriteScale: 0.3,
        },
        guiImg: "img/gui/role-assault.svg",
        color: 0xffec17,
    },
};
