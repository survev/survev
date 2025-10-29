export const PerkProperties = {
    leadership: {
        minBoost: 100,
        scale: 0.25,
    },
    assume_leadership: {
        minBoost: 50,
        scale: 0.15,
    },
    steelskin: {
        scale: 0.4,
        damageReduction: 0.45,
    },
    flak_jacket: {
        scale: 0.1,
        damageReduction: 0.1,
        explosionDamageReduction: 0.9,
    },
    small_arms: {
        scale: -0.25,
    },
    splinter: {
        mainDamageMult: 0.6,
        splitsDamageMult: 0.5,
    },
    ap_rounds: {
        armorPenetration: 0.8,
        obstacleMult: 1.5,
    },
    trick_size: {
        scale: 0.25,
    },
    final_bugle: {
        scaleOnDeath: 0.2,
    },
    broken_arrow: {
        bonusAirstrikes: 2,
    },
    fabricate: {
        refillInterval: 12, // means refill every x seconds
        giveInterval: 0.08, // interval between each grenade being given until the backpack is full
    },
    gotw: {
        scale: 0.25,
        healthRegen: 0.5, // per second
    },
    field_medic: {
        speedBoost: 1,
    },
    tree_climbing: {
        waterSpeedBoost: 2,
    },
    bonus_9mm: {
        spreadMul: 1.1,
    },
    rare_potato: {
        quality: 1,
    },
    // map of ammo type to perk that boosts that ammo
    ammoBonuses: {
        "9mm": ["treat_9mm", "bonus_9mm"],
        "762mm": ["treat_762"],
        "556mm": ["treat_556"],
        "12gauge": ["treat_12g"],
        "45acp": ["bonus_45"],
    } as Record<string, string[]>,
    ammoBonusDamageMult: 1.08,
};

export interface PerkDef {
    readonly type: "perk";
    name: string;
    lootImg: {
        sprite: string;
        tint: number;
        border: string;
        borderTint: number;
        scale: number;
    };
    sound: {
        pickup: string;
    };
    emoteOnPickup?: string;
}

export const PerkDefs: Record<string, PerkDef> = {
    leadership: {
        name: "Leadership",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-leadership.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    assume_leadership: {
        name: "Assume Leadership",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-assume-leadership.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    firepower: {
        name: "Firepower",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-firepower.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    gotw: {
        name: "Gift of the Wild",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-gotw.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    windwalk: {
        name: "Windwalk",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-windwalk.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    rare_potato: {
        name: "Rare Potato",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-rare-potato.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    aoe_heal: {
        name: "Mass Medicate",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-aoe-heal.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    endless_ammo: {
        name: "Endless Ammo",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-endless-ammo.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    steelskin: {
        name: "Steelskin",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-steelskin.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    ap_rounds: {
        name: "AP Rounds",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-ap-rounds.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    splinter: {
        name: "Splinter Rounds",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-splinter.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    small_arms: {
        name: "Small Arms",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-small-arms.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    takedown: {
        name: "Takedown",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-takedown.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    field_medic: {
        name: "Field Medic",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-field-medic.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    tree_climbing: {
        name: "Tree Climbing",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-tree-climbing.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    scavenger: {
        name: "Scavenger",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-scavenger.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    scavenger_adv: {
        name: "Master Scavenger",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-scavenger_adv.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    hunted: {
        name: "The Hunted",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-hunted.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    chambered: {
        name: "One In The Chamber",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-chambered.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    martyrdom: {
        name: "Martyrdom",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-martyrdom.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    targeting: {
        name: "Targeting",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-targeting.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    bonus_45: {
        name: ".45 In The Chamber",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-bonus-45.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    broken_arrow: {
        name: "Broken Arrow",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-broken-arrow.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    fabricate: {
        name: "Fabricate",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-fabricate.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    self_revive: {
        name: "Revivify",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-self-revive.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    bonus_9mm: {
        name: "9mm Overpressure",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-bonus-9mm.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    flak_jacket: {
        name: "Flak Jacket",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-flak-jacket.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    explosive: {
        name: "Explosive Rounds",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-explosive.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    bonus_assault: {
        name: "Hollow-points",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-bonus-assault.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    inspiration: {
        name: "Inspiration",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-inspiration.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: { pickup: "perk_pickup_01" },
    },
    final_bugle: {
        name: "Last Breath",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-final-bugle.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: { pickup: "perk_pickup_01" },
    },
    halloween_mystery: {
        name: "Trick Or Treat?",
        type: "perk",
        lootImg: {
            sprite: "loot-perk-halloween-mystery.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    trick_nothing: {
        name: "One With Nothing",
        type: "perk",
        emoteOnPickup: "emote_trick_nothing",
        lootImg: {
            sprite: "loot-perk-trick-nothing.img",
            tint: 0xffffff,
            border: "loot-circle-outer-04.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    trick_size: {
        name: "Feedership",
        type: "perk",
        emoteOnPickup: "emote_trick_size",
        lootImg: {
            sprite: "loot-perk-trick-size.img",
            tint: 0xffffff,
            border: "loot-circle-outer-04.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    trick_m9: {
        name: "Dev Troll Special",
        type: "perk",
        emoteOnPickup: "emote_trick_m9",
        lootImg: {
            sprite: "loot-perk-trick-m9.img",
            tint: 0xffffff,
            border: "loot-circle-outer-04.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    trick_chatty: {
        name: "Gabby Ghost",
        type: "perk",
        emoteOnPickup: "emote_trick_chatty",
        lootImg: {
            sprite: "loot-perk-trick-chatty.img",
            tint: 0xffffff,
            border: "loot-circle-outer-04.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    trick_drain: {
        name: "That Sucks",
        type: "perk",
        emoteOnPickup: "emote_trick_drain",
        lootImg: {
            sprite: "loot-perk-trick-drain.img",
            tint: 0xffffff,
            border: "loot-circle-outer-04.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    treat_9mm: {
        name: "Candy Corn",
        type: "perk",
        emoteOnPickup: "emote_treat_9mm",
        lootImg: {
            sprite: "loot-perk-treat-9mm.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    treat_12g: {
        name: "Red Jelly Beans",
        type: "perk",
        emoteOnPickup: "emote_treat_12g",
        lootImg: {
            sprite: "loot-perk-treat-12g.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    treat_556: {
        name: "Sour Apple Belt",
        type: "perk",
        emoteOnPickup: "emote_treat_556",
        lootImg: {
            sprite: "loot-perk-treat-556.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    treat_762: {
        name: "Blueberry Taffy",
        type: "perk",
        emoteOnPickup: "emote_treat_762",
        lootImg: {
            sprite: "loot-perk-treat-762.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    treat_super: {
        name: "Full Size OKAMI Bar",
        type: "perk",
        emoteOnPickup: "emote_treat_super",
        lootImg: {
            sprite: "loot-perk-treat-super.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
    turkey_shoot: {
        name: "Perky Shoot",
        type: "perk",
        emoteOnPickup: "emote_turkeyanimal",
        lootImg: {
            sprite: "loot-perk-turkey_shoot.img",
            tint: 0xffffff,
            border: "loot-circle-outer-03.img",
            borderTint: 0xffffff,
            scale: 0.275,
        },
        sound: {
            pickup: "perk_pickup_01",
        },
    },
};
