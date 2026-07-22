import { collider } from "../../../utils/collider.ts";
import { type DeepPartial, util } from "../../../utils/util.ts";
import { v2 } from "../../../utils/v2.ts";
import type { ObstacleDef } from "./obstacleDefs.ts";

//
// Buttons, Puzzle Pieces, Recorders, etc.
//

function createButton(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.5, 0.5)),
        height: 0.3,
        collidable: false,
        destructible: false,
        health: 50,
        hitParticle: "barrelChip",
        explodeParticle: "",
        reflectBullets: false,
        loot: [],
        map: { display: false, color: 0xffffff, scale: 1 },
        terrain: { grass: true, beach: true },
        img: {
            sprite: "map-button-01.img",
            residue: "none",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "deposit_box_break_01",
            enter: "none",
        },
        button: {
            interactionRad: 1.25,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-button-02.img",
            sound: {
                on: "button_press_01",
                off: "button_press_01",
            },
        },
    };
    return util.mergeDeep(baseDef, overrides);
}

function createControlPanel(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1, 1)),
        height: 0.5,
        collidable: true,
        destructible: true,
        explosion: "explosion_barrel",
        health: 250,
        hitParticle: "barrelChip",
        explodeParticle: "depositBoxGreyBreak",
        reflectBullets: true,
        loot: [],
        map: { display: false },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-power-box-01.img",
            residue: "",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "deposit_box_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(baseDef, overrides);
}

function createRecorder(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.9, 1.5)),
        height: 0.5,
        collidable: true,
        destructible: false,
        explosion: "explosion_barrel",
        health: 250,
        hitParticle: "barrelChip",
        explodeParticle: "depositBoxGreyBreak",
        reflectBullets: true,
        loot: [],
        map: { display: false },
        terrain: { grass: false, beach: true },
        img: {
            sprite: "map-recorder-01.img",
            residue: "",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 9,
        },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "deposit_box_break_01",
            enter: "none",
        },
        button: {
            interactionRad: 0.2,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-recorder-02.img",
            sound: { on: "", off: "" },
        },
    };
    return util.mergeDeep(baseDef, overrides);
}

function createBottle2(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.5, 0.5)),
        height: 0.3,
        collidable: true,
        destructible: false,
        health: 50,
        hitParticle: "bottleBlueChip",
        explodeParticle: "bottleBlueBreak",
        reflectBullets: false,
        loot: [],
        map: { display: true, color: 0x663300, scale: 1 },
        terrain: { grass: true, beach: true },
        img: {
            sprite: "map-bottle-02.img",
            residue: "none",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "glass_bullet",
            punch: "glass_bullet",
            explode: "window_break_01",
            enter: "none",
        },
        button: {
            interactionRad: 1.25,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-bottle-03.img",
            sound: {
                on: "button_press_01",
                off: "button_press_01",
            },
        },
    };
    return util.mergeDeep(baseDef, overrides);
}

function createSwitch(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.8 },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.45, 0.55)),
        height: 0.5,
        collidable: true,
        destructible: false,
        explosion: "",
        health: 100,
        hitParticle: "barrelChip",
        explodeParticle: "",
        reflectBullets: true,
        loot: [],
        map: { display: false },
        terrain: { grass: false, beach: true },
        button: {
            interactionRad: 0.2,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-switch-02.img",
            offImg: "map-switch-03.img",
            sound: {
                on: "button_press_01",
                off: "button_press_01",
            },
        },
        img: {
            sprite: "map-switch-01.img",
            residue: "",
            scale: 0.5,
            alpha: 1,
            tint: 0xffffff,
            zIdx: 10,
        },
        sound: {
            bullet: "wall_bullet",
            punch: "metal_punch",
            explode: "deposit_box_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(baseDef, overrides);
}

function createTreeSwitch(overrides: DeepPartial<ObstacleDef>): ObstacleDef {
    const baseDef: ObstacleDef = {
        type: "obstacle",
        scale: { createMin: 1, createMax: 1, destroy: 0.75 },
        collision: collider.createCircle(v2.create(0, 0), 1.6),
        aabb: collider.createAabbExtents(v2.create(0, 0), v2.create(5.75, 5.75)),
        button: {
            interactionRad: 0.2,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-tree-switch-04.img",
            sound: {
                on: "button_press_01",
                off: "button_press_01",
            },
        },
        height: 0.5,
        collidable: true,
        destructible: false,
        health: 175,
        hitParticle: "woodChip",
        explodeParticle: "woodLog",
        reflectBullets: false,
        loot: [],
        map: { display: false, color: 0x834400, scale: 1 },
        terrain: { grass: true, beach: false },
        img: {
            sprite: "map-tree-switch-01.img",
            residue: "map-tree-res-01.img",
            scale: 0.5,
            alpha: 1,
            zIdx: 10,
            tint: 0xffffff,
        },
        sound: {
            bullet: "tree_bullet",
            punch: "tree_bullet",
            explode: "tree_break_01",
            enter: "none",
        },
    };
    return util.mergeDeep(baseDef, overrides);
}

export const InteractableDefs: Record<string, ObstacleDef> = {
    control_panel_01: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.7)),
        button: {
            interactionRad: 0.75,
            interactionText: "game-use",
            useOnce: true,
            useType: "cell_door_01",
            useDelay: 1.1,
            useDir: v2.create(-1, 0),
            useImg: "map-control-panel-02.img",
            sound: { on: "cell_control_01", off: "" },
        },
        img: { sprite: "map-control-panel-01.img" },
    }),
    control_panel_02: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.7)),
        health: 175,
        img: { sprite: "map-control-panel-02.img" },
    }),
    control_panel_02b: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.7)),
        destructible: false,
        button: {
            interactionRad: 0.2,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-control-panel-01.img",
            sound: {
                on: "button_press_01",
                off: "button_press_01",
            },
        },
        img: { sprite: "map-control-panel-02.img" },
    }),
    control_panel_03: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(1.25, 1.2)),
        health: 150,
        img: { sprite: "map-control-panel-03.img" },
    }),
    control_panel_04: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.7)),
        button: {
            interactionRad: 0.75,
            interactionText: "game-use",
            useOnce: true,
            useType: "crossing_door_01",
            useDelay: 4.25,
            useDir: v2.create(1, 0),
            useImg: "map-control-panel-05.img",
            sound: { on: "cell_control_02", off: "" },
        },
        img: { sprite: "map-control-panel-04.img" },
    }),
    control_panel_06: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.5, 1.2)),
        health: 200,
        img: { sprite: "map-control-panel-06.img" },
    }),
    // Reserve-specific control panel
    control_panel_07: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(2.25, 1.7)),
        destructible: false,
        button: {
            interactionRad: 0.2,
            interactionText: "game-use",
            useOnce: false,
            useType: "house_door_02",
            useDelay: 0.25,
            useStyle: "close",
            useLock: "lock",
            useCooldown: 27,
            useExpiration: 12,
            resetAfterCooldown: true,
            useDir: v2.create(-1, 0),
            useImg: "map-control-panel-02.img",
            sound: {
                on: "cell_control_01",
                off: "button_press_01",
            },
        },
        img: { sprite: "map-control-panel-01.img" },
    }),
    switch_01: createSwitch({}),
    switch_01o: createSwitch({
        img: { sprite: "map-switch-01o.img" },
    }),
    switch_01p: createSwitch({
        img: { sprite: "map-switch-01p.img" },
    }),
    switch_01y: createSwitch({
        img: { sprite: "map-switch-01y.img" },
    }),
    switch_02: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.45, 0.55)),
        destructible: false,
        img: { sprite: "map-switch-02.img" },
    }),
    switch_03: createControlPanel({
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.45, 0.55)),
        destructible: false,
        button: {
            interactionRad: 0.2,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-switch-02.img",
            offImg: "map-switch-02.img",
            sound: { on: "button_press_01", off: "" },
        },
        img: { sprite: "map-switch-01.img" },
    }),

    bottle_02r: createBottle2({ img: { tint: 0xc90000 } }),
    bottle_02o: createBottle2({
        collidable: false,
        img: { tint: 0xff5a00 },
    }),
    bottle_02y: createBottle2({
        collidable: false,
        img: { tint: 0xffff00 },
    }),
    bottle_02g: createBottle2({ collidable: false, img: { tint: 0x8000 } }),
    bottle_02b: createBottle2({ img: { tint: 0x6cff } }),
    bottle_02i: createBottle2({
        collidable: false,
        img: { tint: 0x4b0082 },
    }),
    bottle_02v: createBottle2({ img: { tint: 0xee82ee } }),
    button_01: createButton({}),
    button_01g: createButton({
        img: { sprite: "map-button-01g.img" },
        button: {
            interactionRad: 1.25,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-button-02.img",
            offImg: "map-button-02.img",
            sound: {
                on: "button_press_01",
                off: "button_press_01",
            },
        },
    }),
    button_01b: createButton({
        img: { sprite: "map-button-01b.img" },
        button: {
            interactionRad: 1.25,
            interactionText: "game-use",
            useOnce: true,
            useType: "",
            useDelay: 0.25,
            useDir: v2.create(-1, 0),
            useImg: "map-button-02.img",
            offImg: "map-button-02.img",
            sound: {
                on: "button_press_01",
                off: "button_press_01",
            },
        },
    }),
    recorder_01: createRecorder({
        button: { sound: { on: "log_01" } },
    }),
    recorder_02: createRecorder({
        button: { sound: { on: "log_02" } },
    }),
    recorder_03: createRecorder({
        button: { sound: { on: "log_03" } },
    }),
    recorder_04: createRecorder({
        button: { sound: { on: "log_04" } },
    }),
    recorder_05: createRecorder({
        button: { sound: { on: "log_05" } },
    }),
    recorder_06: createRecorder({
        button: { sound: { on: "log_06" } },
    }),
    recorder_07: createRecorder({
        button: { sound: { on: "footstep_07" } },
    }),
    recorder_08: createRecorder({
        button: { sound: { on: "footstep_08" } },
    }),
    recorder_09: createRecorder({
        button: { sound: { on: "footstep_09" } },
    }),
    recorder_10: createRecorder({
        button: { sound: { on: "cell_control_03" } },
    }),
    recorder_11: createRecorder({
        button: {
            sound: { on: "log_11" },
            useImg: "map-recorder-04.img",
        },
        img: { sprite: "map-recorder-03.img" },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 1.25)),
    }),
    recorder_12: createRecorder({
        button: {
            sound: { on: "log_12" },
            useImg: "map-recorder-04.img",
        },
        img: { sprite: "map-recorder-03.img" },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 1.25)),
    }),
    recorder_13: createRecorder({
        button: {
            sound: { on: "log_13" },
            useImg: "map-recorder-04.img",
        },
        img: { sprite: "map-recorder-03.img" },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 1.25)),
    }),
    recorder_14: createRecorder({
        button: {
            sound: { on: "log_14" },
            useImg: "map-recorder-04.img",
        },
        img: { sprite: "map-recorder-03.img" },
        collision: collider.createAabbExtents(v2.create(0, 0), v2.create(0.75, 1.25)),
    }),
    tree_switch_01: createTreeSwitch({
        img: { sprite: "map-tree-switch-01.img" },
    }),
    tree_switch_02: createTreeSwitch({
        img: { sprite: "map-tree-switch-02.img" },
    }),
    tree_switch_03: createTreeSwitch({
        img: { sprite: "map-tree-switch-03.img" },
    }),
};
