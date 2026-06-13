type QuestEvent =
    | "kill"
    | "damage"
    | "survived"
    | "placement"
    | "item_used"
    | "destruction";

interface QuestWhere {
    mode?: "solo" | "duo" | "squad";
    maxRank?: number;
    buildingType?: string;
    ammo?: string;
    weaponClass?: "melee" | "throwable";
    itemType?: string;
    itemClass?: "heal" | "boost";
    obstacleType?: string;
}

export interface QuestDef {
    readonly type: "quest";
    event: QuestEvent;
    target: number;
    xp: number;
    icon?: string;
    timed?: boolean;
    where?: QuestWhere;
}

export const QuestDefs: Record<string, QuestDef> = {
    quest_top_solo: {
        type: "quest",
        event: "placement",
        target: 2,
        xp: 30,
        where: {
            mode: "solo",
            maxRank: 10,
        },
    },
    quest_top_squad: {
        type: "quest",
        event: "placement",
        target: 2,
        xp: 30,
        where: {
            mode: "squad",
            maxRank: 5,
        },
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
        where: {
            ammo: "9mm",
        },
    },
    quest_damage_762mm: {
        type: "quest",
        event: "damage",
        target: 250,
        xp: 30,
        icon: "img/emotes/ammo-762mm.svg",
        where: {
            ammo: "762mm",
        },
    },
    quest_damage_556mm: {
        type: "quest",
        event: "damage",
        target: 250,
        xp: 30,
        icon: "img/emotes/ammo-556mm.svg",
        where: {
            ammo: "556mm",
        },
    },
    quest_damage_12gauge: {
        type: "quest",
        event: "damage",
        target: 250,
        xp: 30,
        icon: "img/emotes/ammo-12gauge.svg",
        where: {
            ammo: "12gauge",
        },
    },
    quest_damage_grenade: {
        type: "quest",
        event: "damage",
        target: 100,
        xp: 40,
        where: {
            weaponClass: "throwable",
        },
    },
    quest_damage_melee: {
        type: "quest",
        event: "damage",
        target: 150,
        xp: 40,
        where: {
            weaponClass: "melee",
        },
    },
    quest_heal: {
        type: "quest",
        event: "item_used",
        target: 10,
        xp: 30,
        where: {
            itemClass: "heal",
        },
    },
    quest_boost: {
        type: "quest",
        event: "item_used",
        target: 10,
        xp: 30,
        where: {
            itemClass: "boost",
        },
    },
    quest_airdrop: {
        type: "quest",
        event: "item_used",
        target: 1,
        xp: 30,
        where: {
            itemType: "airdrop_crate",
        },
    },
    quest_crates: {
        type: "quest",
        event: "destruction",
        target: 25,
        xp: 30,
        where: {
            obstacleType: "crate",
        },
    },
    quest_toilets: {
        type: "quest",
        event: "destruction",
        target: 5,
        xp: 30,
        where: {
            obstacleType: "toilet",
        },
    },
    quest_furniture: {
        type: "quest",
        event: "destruction",
        target: 10,
        xp: 30,
        where: {
            obstacleType: "furniture",
        },
    },
    quest_barrels: {
        type: "quest",
        event: "destruction",
        target: 10,
        xp: 30,
        where: {
            obstacleType: "barrel",
        },
    },
    quest_lockers: {
        type: "quest",
        event: "destruction",
        target: 10,
        xp: 30,
        where: {
            obstacleType: "locker",
        },
    },
    quest_pots: {
        type: "quest",
        event: "destruction",
        target: 8,
        xp: 30,
        where: {
            obstacleType: "pot",
        },
    },
    quest_vending: {
        type: "quest",
        event: "destruction",
        target: 1,
        xp: 40,
        where: {
            obstacleType: "vending",
        },
    },
    quest_club_kills: {
        type: "quest",
        event: "kill",
        target: 2,
        xp: 40,
        where: {
            buildingType: "club",
        },
    },
};
