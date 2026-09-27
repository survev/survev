import type { GunDef } from "../../../shared/defs/gameObjects/gunDefs.ts";
import type { MeleeDef } from "../../../shared/defs/gameObjects/meleeDefs.ts";
import { RoofMasks } from "../../../shared/defs/mapObjects/buildings/roofMasks.ts";
import { GameObjectDefs, MapObjectDefs } from "../../../shared/defs/register.ts";
import { GameConfig } from "../../../shared/gameConfig.ts";
import { ObjectType } from "../../../shared/net/objectSerializeFns.ts";
import { type AABB, coldet } from "../../../shared/utils/coldet.ts";
import { collider } from "../../../shared/utils/collider.ts";
import { collisionHelpers } from "../../../shared/utils/collisionHelpers.ts";
import { mapHelpers } from "../../../shared/utils/mapHelpers.ts";
import { v2, type Vec2 } from "../../../shared/utils/v2.ts";
import type { Game } from "./game.ts";
import type { Building } from "./objects/building.ts";
import type { GameObject } from "./objects/gameObject.ts";
import type { Loot } from "./objects/loot.ts";
import type { Obstacle } from "./objects/obstacle.ts";
import type { Player } from "./objects/player.ts";
import type { Structure } from "./objects/structure.ts";

/**
 * Extra time objects stay sent after the client would have hidden them.
 * Covers latency and client side interpolation, the client's positions lag the server's.
 */
const NET_SLACK = 0.5;

/**
 * Speed of the renderer's layer fade, see `Renderer.m_update` on the client.
 */
const LAYER_FADE_RATE = 12;

/**
 * Past this distance nothing a player does is audible to other players.
 * Loudest per player sounds are reloads and heals: otherPlayers channel (volume 0.5, range 48),
 * fallOff 2, so 0.5 * (1 - d / 48) ^ 5 drops below the client's 0.003 cutoff at d ~= 30.7.
 * Footsteps (sfx channel, volume 1, fallOff 3) drop out at d ~= 27.
 */
const AUDIBLE_RANGE = 32;

/**
 * How long a hidden player keeps being sent after the last sound they made.
 * Short gaps between sounds shouldn't delete and recreate the player on the client,
 * newly created players skip their action start sounds.
 */
const NOISE_LINGER = 2;

/**
 * Bullets passing this close to a hidden player make them sent,
 * so the client can play hit effects and stop the bullet on them.
 */
const BULLET_NOISE_RAD = 2;

/** Body sprites (backpack, helmet, hands) reach a bit past the collision radius. */
const BODY_VISUAL_SCALE = 1.35;
/** Loot sprites are bigger than their collider. */
const LOOT_VISUAL_SCALE = 1.5;
/** Spacing of the points sampled along a weapon. Mask holes are several units wide. */
const WEAPON_SAMPLE_STEP = 0.5;

interface RoofInfo {
    vision: ReturnType<typeof mapHelpers.getCeilingVision>;
    /** Opaque parts of the roof art in building space, see `RoofMasks`. */
    mask: AABB[];
    /** A damaged ceiling removes some of its images, and exposes part of the inside. */
    openWhenDamaged: boolean;
}

const roofInfoCache: Record<string, RoofInfo> = {};

function getRoofInfo(type: string): RoofInfo {
    let info = roofInfoCache[type];
    if (!info) {
        const def = MapObjectDefs.typeToDef(type, "building");
        // No entry means no roof art: cellars, tents, open structures
        const mask = (RoofMasks[type] ?? []).map(([minX, minY, maxX, maxY]) =>
            collider.createAabb(v2.create(minX, minY), v2.create(maxX, maxY))
        );
        info = {
            vision: mapHelpers.getCeilingVision(type),
            mask,
            openWhenDamaged: def.ceiling.imgs.some((img) => img.removeOnDamaged),
        };
        roofInfoCache[type] = info;
    }
    return info;
}

/** World space roof masks per building, buildings never move. */
const worldMaskCache = new WeakMap<Building, { mask: AABB[]; bounds: AABB }>();

function getWorldMask(building: Building, info: RoofInfo) {
    let res = worldMaskCache.get(building);
    if (!res) {
        const mask = info.mask.map(
            (rect) => collider.transform(rect, building.pos, building.rot, building.scale) as AABB,
        );
        const bounds = coldet.boundingAabb(mask);
        res = { mask, bounds: collider.createAabb(bounds.min, bounds.max) };
        worldMaskCache.set(building, res);
    }
    return res;
}

interface Roof {
    layer: number;
    mask: AABB[];
    bounds: AABB;
}

interface NoiseState {
    activeWeapon: string;
    lastNoise: number;
}

/**
 * Decides which in-range objects a client would never draw, so the server doesn't send them.
 *
 * `Client.sendMsgs` sends everything inside a box around the player. Inside that box the client
 * hides players and loot under roofs it can't see through, and on layers it doesn't render.
 * That hiding was only visual, so a modified client could reveal all of it.
 *
 * The rules mirror the client's own rendering, using the same shared helpers where they exist.
 * When unsure they keep sending: withholding something the client would draw is a gameplay bug,
 * sending something it would hide is how it worked before.
 *
 * Hidden players are still sent while they're within earshot and making noise
 * (moving, shooting, reloading, healing, emoting, getting shot), because the client plays those
 * sounds from the player object. A player that's standing still under a roof makes no sound.
 */
export class Occlusion {
    private time = 0;
    private viewerId = 0;

    /** Building id -> time until which its ceiling counts as revealed. */
    private roofRevealUntil = new Map<number, number>();

    private hiddenLayer = -1;
    private layerGraceUntil = 0;

    /** Object id -> time it first became hidden, for objects the client still has. */
    private hiddenSince = new Map<number, number>();

    /** Player id -> what they were doing when last looked at. */
    private noise = new Map<number, NoiseState>();

    // Scratch buffers, reused every call
    private footprint: Vec2[] = [];
    private obstacles: Obstacle[] = [];
    private buildings: Building[] = [];
    private structures: Structure[] = [];
    private candidates: Array<Player | Loot> = [];
    private hiddenNow = new Set<number>();
    private seenPlayers = new Set<number>();

    constructor(private game: Game) {}

    update(dt: number) {
        this.time += dt;
    }

    /**
     * Removes from `objects` everything the viewer's client would draw hidden.
     * `sent` is what the client currently has, those objects get a moment before disappearing.
     */
    filter(viewer: Player, objects: Set<GameObject>, sent: Set<GameObject>) {
        if (viewer.__id !== this.viewerId) {
            this.viewerId = viewer.__id;
            this.roofRevealUntil.clear();
            this.hiddenSince.clear();
            this.noise.clear();
            this.hiddenLayer = -1;
            this.layerGraceUntil = 0;
        }

        const obstacles = this.obstacles;
        const buildings = this.buildings;
        const structures = this.structures;
        const candidates = this.candidates;
        obstacles.length =
            buildings.length =
            structures.length =
            candidates.length =
                0;
        for (const obj of objects) {
            switch (obj.__type) {
                case ObjectType.Obstacle:
                    obstacles.push(obj);
                    break;
                case ObjectType.Building:
                    buildings.push(obj);
                    break;
                case ObjectType.Structure:
                    structures.push(obj);
                    break;
                case ObjectType.Loot:
                    candidates.push(obj);
                    break;
                case ObjectType.Player:
                    if (
                        obj !== viewer
                        && obj.groupId !== viewer.groupId
                        && obj.teamId !== viewer.teamId
                    ) {
                        candidates.push(obj);
                    }
                    break;
            }
        }

        const roofs = this.getHidingRoofs(viewer, buildings, obstacles);
        const hiddenLayer = this.getHiddenLayer(viewer, structures);

        const hiddenNow = this.hiddenNow;
        const seenPlayers = this.seenPlayers;
        hiddenNow.clear();
        seenPlayers.clear();
        for (let i = 0; i < candidates.length; i++) {
            const obj = candidates[i];
            let hidden: boolean;
            if (obj.__type === ObjectType.Loot) {
                hidden = this.isLootHidden(obj, roofs, hiddenLayer);
            } else {
                seenPlayers.add(obj.__id);
                hidden = this.isPlayerHidden(obj, roofs, hiddenLayer)
                    && !this.isAudible(viewer, obj);
            }
            if (!hidden) continue;

            // Give the client time to finish drawing what it already has
            hiddenNow.add(obj.__id);
            if (sent.has(obj)) {
                const since = this.hiddenSince.get(obj.__id) ?? this.time;
                this.hiddenSince.set(obj.__id, since);
                if (this.time - since < NET_SLACK) continue;
            }
            objects.delete(obj);
        }

        for (const id of this.hiddenSince.keys()) {
            if (!hiddenNow.has(id)) this.hiddenSince.delete(id);
        }
        for (const id of this.noise.keys()) {
            if (!seenPlayers.has(id)) this.noise.delete(id);
        }
    }

    /**
     * Roofs currently covering what's under them from the viewer's point of view.
     * Mirrors the ceiling visibility logic in the client's `Building.m_update`.
     */
    private getHidingRoofs(viewer: Player, buildings: Building[], obstacles: Obstacle[]) {
        const roofs: Roof[] = [];

        for (let i = 0; i < buildings.length; i++) {
            const building = buildings[i];
            const info = getRoofInfo(building.type);
            if (!info.mask.length) continue;
            if (building.ceilingDead) continue;
            if (building.ceilingDamaged && info.openWhenDamaged) continue;

            const canSeeInside = collisionHelpers.canSeeUnderCeiling(
                building.zoomRegions,
                building.layer,
                info.vision,
                obstacles,
                viewer.pos,
                viewer.layer,
            );
            if (canSeeInside) {
                this.roofRevealUntil.set(
                    building.__id,
                    this.time + info.vision.linger + 1 / info.vision.fadeRate + NET_SLACK,
                );
            }
            if ((this.roofRevealUntil.get(building.__id) ?? 0) > this.time) continue;

            roofs.push({ layer: building.layer, ...getWorldMask(building, info) });
        }

        return roofs;
    }

    /**
     * The layer the viewer's renderer doesn't draw, or -1.
     * Mirrors the layer alphas in the client's `Renderer.m_update`:
     * on the ground layer 1 is faded out, underground the ground layer is covered.
     * Stairs layers are always drawn.
     */
    private getHiddenLayer(viewer: Player, structures: Structure[]) {
        let hiddenLayer = -1;
        if (viewer.layer === 0) {
            hiddenLayer = 1;
        } else if (viewer.layer === 1 && this.isUnderground(viewer, structures)) {
            hiddenLayer = 0;
        }

        if (hiddenLayer !== this.hiddenLayer) {
            // Let the client fade the old layer out before withholding it
            this.hiddenLayer = hiddenLayer;
            this.layerGraceUntil = this.time + 1 / LAYER_FADE_RATE + NET_SLACK;
        }
        return this.layerGraceUntil > this.time ? -1 : hiddenLayer;
    }

    /**
     * Mirrors the client's `Player.isUnderground`.
     */
    private isUnderground(viewer: Player, structures: Structure[]) {
        for (let i = 0; i < structures.length; i++) {
            const layers = structures[i].layers;
            if (
                layers.length >= 2
                && collider.intersectCircle(layers[1].collision, viewer.pos, viewer.rad)
            ) {
                return layers[1].underground;
            }
        }
        return true;
    }

    private isLootHidden(loot: Loot, roofs: Roof[], hiddenLayer: number) {
        if (loot.layer === hiddenLayer) return true;

        if (!this.isPointUnderRoof(loot.pos, loot.layer, roofs)) return false;

        const points = this.footprint;
        points.length = 0;
        this.addCircle(points, loot.pos, loot.rad * LOOT_VISUAL_SCALE);
        return this.isUnderRoof(points, loot.layer, roofs);
    }

    private isPlayerHidden(player: Player, roofs: Roof[], hiddenLayer: number) {
        if (player.layer === hiddenLayer) return true;
        if (!this.isPointUnderRoof(player.pos, player.layer, roofs)) return false;

        const points = this.footprint;
        points.length = 0;
        this.addCircle(points, player.pos, player.rad * BODY_VISUAL_SCALE);

        // Weapons stick out past the body, and past roof edges
        const weapDef = GameObjectDefs.typeToDefSafe(player.activeWeapon);
        let length = 0;
        let offsets = [0];
        if (weapDef?.type === "gun") {
            const gun = weapDef as GunDef;
            length = gun.barrelLength;
            offsets = gun.isDual ? [gun.dualOffset!, -gun.dualOffset!] : [gun.barrelOffset];
        } else if (weapDef?.type === "melee") {
            const melee = weapDef as MeleeDef;
            length = melee.attack.offset.x + melee.attack.rad;
        }
        const perp = v2.perp(player.dir);
        for (const offset of offsets) {
            const base = v2.add(player.pos, v2.mul(perp, offset * player.scale));
            for (let t = 0; t <= length + WEAPON_SAMPLE_STEP; t += WEAPON_SAMPLE_STEP) {
                points.push(v2.add(base, v2.mul(player.dir, t * player.scale)));
            }
        }

        return this.isUnderRoof(points, player.layer, roofs);
    }

    private addCircle(points: Vec2[], pos: Vec2, rad: number) {
        points.push(pos);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            points.push(v2.add(pos, v2.create(Math.cos(angle) * rad, Math.sin(angle) * rad)));
        }
    }

    /**
     * Whether every point is under an opaque part of some hiding roof.
     * Ceilings are drawn in their own layer's render group, stairs objects render above them.
     */
    private isUnderRoof(points: Vec2[], layer: number, roofs: Roof[]) {
        for (let i = 0; i < points.length; i++) {
            if (!this.isPointUnderRoof(points[i], layer, roofs)) return false;
        }
        return true;
    }

    private isPointUnderRoof(point: Vec2, layer: number, roofs: Roof[]) {
        for (let i = 0; i < roofs.length; i++) {
            const roof = roofs[i];
            if (roof.layer !== layer) continue;
            if (!coldet.testPointAabb(point, roof.bounds.min, roof.bounds.max)) continue;
            for (let j = 0; j < roof.mask.length; j++) {
                const rect = roof.mask[j];
                if (coldet.testPointAabb(point, rect.min, rect.max)) return true;
            }
        }
        return false;
    }

    /**
     * Whether a hidden player is making sounds (or an emote) the viewer's client would play.
     */
    private isAudible(viewer: Player, player: Player) {
        let state = this.noise.get(player.__id);
        const activeWeapon = player.activeWeapon;
        let noisy = false;

        // Emotes are drawn above roofs and layers
        const emotes = this.game.playerBarn.emotes;
        for (let i = 0; i < emotes.length; i++) {
            if (emotes[i].playerId === player.__id && !emotes[i].isPing) {
                noisy = true;
            }
        }

        if (v2.distance(viewer.pos, player.pos) <= AUDIBLE_RANGE) {
            noisy ||= !v2.eq(player.pos, player.posOld)
                || player.actionType !== GameConfig.Action.None
                || player.animType !== GameConfig.Anim.None
                || player.shotSlowdownTimer > 0
                || (state !== undefined && state.activeWeapon !== activeWeapon)
                || this.isNearNewBullet(player);
        }

        if (!state) {
            state = { activeWeapon, lastNoise: -Infinity };
            this.noise.set(player.__id, state);
        }
        state.activeWeapon = activeWeapon;
        if (noisy) state.lastNoise = this.time;

        return this.time - state.lastNoise < NOISE_LINGER;
    }

    private isNearNewBullet(player: Player) {
        const bullets = this.game.bulletBarn.newBullets;
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            if (bullet.playerId === player.__id) continue;
            if (
                coldet.intersectSegmentCircle(
                    bullet.pos,
                    bullet.clientEndPos,
                    player.pos,
                    player.rad + BULLET_NOISE_RAD,
                )
            ) {
                return true;
            }
        }
        return false;
    }
}
