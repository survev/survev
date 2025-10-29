export interface QuestDef {
    readonly type: "quest";
    category: string;
    target: number;
    xp: number;
    timed?: boolean;
    icon?: string;
}

export const QuestDefs: Record<string, QuestDef> = {
    quest_top_solo: {
        type: "quest",
        category: "top",
        target: 2,
        xp: 30,
    },
    quest_top_squad: {
        type: "quest",
        category: "top",
        target: 2,
        xp: 30,
    },
    quest_kills: {
        type: "quest",
        category: "pvp",
        target: 5,
        xp: 30,
    },
    quest_kills_hard: {
        type: "quest",
        category: "pvp",
        target: 10,
        xp: 40,
    },
    quest_damage: {
        type: "quest",
        category: "pvp",
        target: 750,
        xp: 30,
    },
    quest_damage_hard: {
        type: "quest",
        category: "pvp",
        target: 1500,
        xp: 40,
    },
    quest_survived: {
        type: "quest",
        category: "pvp",
        target: 900,
        xp: 30,
        timed: true,
    },
    quest_damage_9mm: {
        type: "quest",
        category: "damage",
        target: 250,
        xp: 30,
        icon: "img/emotes/ammo-9mm.svg",
    },
    quest_damage_762mm: {
        type: "quest",
        category: "damage",
        target: 250,
        xp: 30,
        icon: "img/emotes/ammo-762mm.svg",
    },
    quest_damage_556mm: {
        type: "quest",
        category: "damage",
        target: 250,
        xp: 30,
        icon: "img/emotes/ammo-556mm.svg",
    },
    quest_damage_12gauge: {
        type: "quest",
        category: "damage",
        target: 250,
        xp: 30,
        icon: "img/emotes/ammo-12gauge.svg",
    },
    quest_damage_grenade: {
        type: "quest",
        category: "damage",
        target: 100,
        xp: 40,
    },
    quest_damage_melee: {
        type: "quest",
        category: "damage",
        target: 150,
        xp: 40,
    },
    quest_heal: {
        type: "quest",
        category: "item",
        target: 10,
        xp: 30,
    },
    quest_boost: {
        type: "quest",
        category: "item",
        target: 10,
        xp: 30,
    },
    quest_airdrop: {
        type: "quest",
        category: "item",
        target: 1,
        xp: 30,
    },
    quest_crates: {
        type: "quest",
        category: "destruction",
        target: 25,
        xp: 30,
    },
    quest_toilets: {
        type: "quest",
        category: "destruction",
        target: 5,
        xp: 30,
    },
    quest_furniture: {
        type: "quest",
        category: "destruction",
        target: 10,
        xp: 30,
    },
    quest_barrels: {
        type: "quest",
        category: "destruction",
        target: 10,
        xp: 30,
    },
    quest_lockers: {
        type: "quest",
        category: "destruction",
        target: 10,
        xp: 30,
    },
    quest_pots: {
        type: "quest",
        category: "destruction",
        target: 8,
        xp: 30,
    },
    quest_vending: {
        type: "quest",
        category: "destruction",
        target: 1,
        xp: 40,
    },
    quest_club_kills: {
        type: "quest",
        category: "location",
        target: 2,
        xp: 40,
    },
};
