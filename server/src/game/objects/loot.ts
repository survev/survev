import { GameObjectDefs, type LootDef } from "../../../../shared/defs/gameObjectDefs";
import type { MapDef } from "../../../../shared/defs/mapDefs";
import { GameConfig } from "../../../../shared/gameConfig";
import { ObjectType } from "../../../../shared/net/objectSerializeFns";
import { type AABB, type Circle, coldet } from "../../../../shared/utils/coldet";
import { collider } from "../../../../shared/utils/collider";
import { math } from "../../../../shared/utils/math";
import type { River } from "../../../../shared/utils/river";
import { assert, util } from "../../../../shared/utils/util";
import { type Vec2, v2 } from "../../../../shared/utils/v2";
import type { Game } from "../game";
import { HashGrid } from "../grid";
import { BaseGameObject } from "./gameObject";
import type { MapIndicator } from "./mapIndicator";
import type { Structure } from "./structure";

const AMMO_OFFSET_X = 0.75;
const AMMO_OFFSET_Y = -0.1;

type LootTierItem = MapDef["lootTable"][string][number];

export class LootBarn {
    loots: Loot[] = [];
    newLoots: Loot[] = [];

    private _cachedTiers: Record<string, () => LootTierItem> = {};

    grid: HashGrid;

    constructor(public game: Game) {
        this.grid = new HashGrid(this.game.map.width, this.game.map.height, 16);
    }

    update(dt: number) {
        // check for loot to loot collision on the hashgrid
        this.grid.check(
            this.loots,
            (a, b) => {
                return (
                    (util.sameLayer(a.layer, b.layer) as boolean) &&
                    coldet.testCircleCircle(a.pos, a.lootRad, b.pos, b.lootRad)
                );
            },
            (a, b) => {
                const res = coldet.intersectCircleCircle(
                    a.pos,
                    a.lootRad,
                    b.pos,
                    b.lootRad,
                );
                if (!res) return;

                const forceFactor = 2.5;
                const forceA = math.max(res.pen / a.lootRad, 0.1) * forceFactor * dt;
                const forceB = math.max(res.pen / b.lootRad, 0.1) * forceFactor * dt;
                v2.set(a.pos, v2.sub(a.pos, v2.mul(res.dir, forceA)));
                v2.set(b.pos, v2.add(b.pos, v2.mul(res.dir, forceB)));

                a.setPartDirty();
                a.game.grid.updateObject(a);
                a.mapIndicator?.updatePosition(a.pos);
                a.game.map.clampToMapBounds(a.pos, a.rad);

                b.setPartDirty();
                b.game.grid.updateObject(b);
                b.mapIndicator?.updatePosition(b.pos);
                b.game.map.clampToMapBounds(b.pos, b.rad);
            },
        );

        for (let i = 0; i < this.loots.length; i++) {
            const loot = this.loots[i];
            if (loot.destroyed) {
                this.loots.splice(i, 1);
                i--;
                continue;
            }
            loot.update(dt);
        }
    }

    flush() {
        for (let i = 0; i < this.newLoots.length; i++) {
            this.newLoots[i].isOld = true;
            this.newLoots[i].serializeFull();
        }
        this.newLoots.length = 0;
    }

    addLoot(
        type: string,
        pos: Vec2,
        layer: number,
        count: number,
        useCountForAmmo?: boolean,
        pushSpeed?: number,
        dir?: Vec2,
        noSideAmmo?: boolean,
        preloadGun?: boolean,
        source?: "player" | "obstacle" | "map",
        ownerId?: number,
    ) {
        const def = GameObjectDefs[type];

        if (!def || !("lootImg" in def)) {
            this.game.logger.warn("Invalid loot type:", type);
            return;
        }

        const loot = new Loot(
            this.game,
            type,
            pos,
            layer,
            count,
            pushSpeed,
            dir,
            ownerId,
        );
        this._addLoot(loot);

        if (noSideAmmo) return;

        if (
            def.type === "gun" &&
            preloadGun &&
            !def.ammoInfinite &&
            source !== "player"
        ) {
            loot.isPreloadedGun = true;
        }

        if (def.type === "gun" && GameObjectDefs[def.ammo] && !loot.isPreloadedGun) {
            const ammoCount = useCountForAmmo ? count : def.ammoSpawnCount;
            if (ammoCount <= 0) return;
            const halfAmmo = Math.ceil(ammoCount / 2);

            const leftAmmo = new Loot(
                this.game,
                def.ammo,
                v2.add(pos, v2.create(-AMMO_OFFSET_X, AMMO_OFFSET_Y)),
                layer,
                halfAmmo,
                pushSpeed,
                dir,
                ownerId,
            );
            this._addLoot(leftAmmo);

            if (ammoCount - halfAmmo >= 1) {
                const rightAmmo = new Loot(
                    this.game,
                    def.ammo,
                    v2.add(pos, v2.create(AMMO_OFFSET_X, AMMO_OFFSET_Y)),
                    layer,
                    ammoCount - halfAmmo,
                    pushSpeed,
                    dir,
                    ownerId,
                );
                this._addLoot(rightAmmo);
            }
        }
    }

    private _addLoot(loot: Loot) {
        this.game.objectRegister.register(loot);
        this.loots.push(loot);
        this.newLoots.push(loot);
    }

    private _getLootTable(tier: string): LootTierItem {
        if (this._cachedTiers[tier]) {
            return this._cachedTiers[tier]();
        }
        const lootTable = this.game.map.mapDef.lootTable[tier];

        let total = 0.0;
        for (let i = 0; i < lootTable.length; i++) {
            total += lootTable[i].weight;
        }

        function fn() {
            let rng = util.random(0, total);
            let idx = 0;
            while (rng > lootTable[idx].weight) {
                rng -= lootTable[idx].weight;
                idx++;
            }
            return lootTable[idx];
        }
        this._cachedTiers[tier] = fn;
        return fn();
    }

    getLootTable(tier: string): LootTierItem | undefined {
        assert(
            this.game.map.mapDef.lootTable[tier],
            `Unknown loot tier with type ${tier}`,
        );

        let item: LootTierItem | undefined = this._getLootTable(tier);

        if (!item.name) {
            return undefined;
        }

        if (item.name.startsWith("tier_")) {
            item = this.getLootTable(item.name);
        }

        return item;
    }
}

export class Loot extends BaseGameObject {
    override readonly __type = ObjectType.Loot;
    bounds: AABB;

    isPreloadedGun = false;

    get hasOwner() {
        return this.ownerId !== 0;
    }
    ownerId = 0;

    removeOwnerTicker = 0;

    isOld = false;

    forceUpdateTicker = 1;

    layer: number;
    type: string;
    count: number;

    vel = v2.create(0, 0);
    oldPos = v2.create(0, 0);

    collider: Circle;
    rad: number;

    bellowBridge = false;

    mapIndicator?: MapIndicator;

    lootRad: number;

    constructor(
        game: Game,
        type: string,
        pos: Vec2,
        layer: number,
        count: number,
        pushSpeed = 4.75,
        dir?: Vec2,
        ownerId?: number,
    ) {
        super(game, pos);

        const def = GameObjectDefs[type] as LootDef;
        assert("lootImg" in def, `Invalid loot type ${type}`);

        this.layer = layer;
        this.type = type;
        this.count = def.type === "gun" ? 1 : count;
        this.ownerId = ownerId ?? 0;

        this.collider = collider.createCircle(pos, GameConfig.lootRadius[def.type]);
        this.collider.pos = this.pos;

        this.rad = this.collider.rad;
        // apparently original surviv loots had an extended hitbox
        // that was only used for loot to loot collision...
        // this seems to match it from the recorded packets
        this.lootRad = this.rad * 1.25;

        this.bounds = collider.createAabbExtents(
            v2.create(0, 0),
            v2.create(this.rad, this.rad),
        );

        if ("mapIndicator" in def) {
            this.mapIndicator = this.game.mapIndicatorBarn.allocIndicator(
                this.type,
                false,
            );
            this.mapIndicator?.updatePosition(this.pos);
        }

        this.pushLoot(dir ?? v2.randomUnit(), pushSpeed);
    }

    updatePos(newPos: Vec2): void {
        v2.set(this.pos, v2.copy(newPos));
        this.game.map.clampToMapBounds(this.pos, this.rad);
        this.setPartDirty();
    }

    refresh(): void {
        this.collider.pos = this.pos;
        this.game.grid.updateObject(this);
    }

    update(dt: number): void {
        if (this.hasOwner) {
            const owner = this.game.objectRegister.getById(this.ownerId);
            this.removeOwnerTicker += dt;
            if (
                this.removeOwnerTicker > 2 ||
                !owner ||
                (owner.__type === ObjectType.Player && (owner.dead || owner.disconnected))
            ) {
                this.ownerId = 0;
                this.setDirty();
            }
        }

        const shouldUpdate =
            this.forceUpdateTicker > 0.3 ||
            Math.abs(this.vel.x) > 0.001 ||
            Math.abs(this.vel.y) > 0.001 ||
            !v2.eq(this.oldPos, this.pos);

        if (!shouldUpdate) {
            // force a loot update few ms to make sure if e.g an obstacle spawned on top of the loot (airdrop, potato respawning etc)
            // it will still resolve collision instead of sleeping forever
            this.forceUpdateTicker += dt;
            return;
        }
        this.forceUpdateTicker = 0;

        v2.set(this.oldPos, v2.copy(this.pos));

        // cap speed
        const sqrLen = v2.lengthSqr(this.vel);
        const maxVel = 75;
        if (sqrLen > maxVel * maxVel) {
            const len = Math.sqrt(sqrLen);
            const thisDir = v2.div(this.vel, len > 0.000001 ? len : 1);
            v2.set(this.vel, v2.mul(thisDir, maxVel));
        }

        v2.set(this.vel, v2.mul(this.vel, 1 / (1 + dt * 2.5)));
        v2.set(this.pos, v2.add(this.pos, v2.mul(this.vel, dt)));

        const originalLayer = this.layer;

        let finalStair: Structure["stairs"][0] | undefined;

        // find a ground surface
        // used to check if e.g we are above a bridge
        // to ignore rivers
        // most of this logic was copied from map.getGroundSurface
        // but optimized for loot and to only do a single loop
        let surface = {
            type: "",
            zIdx: 0,
        };

        const onStairs = this.layer & 0x2;

        let objs = this.game.grid.intersectGameObject(this);
        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];

            switch (obj.__type) {
                case ObjectType.Obstacle: {
                    if (!obj.collidable) continue;
                    if (!util.sameLayer(obj.layer, this.layer)) continue;
                    if (obj.dead) continue;

                    const collision = collider.intersectCircle(
                        obj.collider,
                        this.pos,
                        this.rad,
                    );
                    if (collision) {
                        v2.set(
                            this.pos,
                            v2.add(
                                this.pos,
                                v2.mul(collision.dir, collision.pen + 0.001),
                            ),
                        );
                    }
                    break;
                }
                case ObjectType.Building: {
                    // if we are bellow a bridge we need to ignore surfaces
                    // so the loot keeps flowing on the river
                    if (this.bellowBridge) continue;
                    // Prioritize layer0 building surfaces when on stairs
                    if (
                        (obj.layer !== this.layer && !onStairs) ||
                        (obj.layer === 1 && onStairs)
                    ) {
                        continue;
                    }
                    if (surface.zIdx > obj.zIdx) continue;

                    for (let j = 0; j < obj.surfaces.length; j++) {
                        const objSurf = obj.surfaces[j];
                        for (let k = 0; k < objSurf.colliders.length; k++) {
                            if (coldet.test(objSurf.colliders[k], this.collider)) {
                                surface = {
                                    type: objSurf.type,
                                    zIdx: obj.zIdx,
                                };
                                break;
                            }
                        }
                    }
                    break;
                }
                case ObjectType.Decal: {
                    if (this.bellowBridge) continue;
                    if (!obj.collider || !obj.surface) continue;
                    if (!util.sameLayer(obj.layer, this.layer)) continue;
                    if (!coldet.test(obj.collider, this.collider)) continue;
                    // decal surfaces have priority
                    surface = {
                        type: obj.surface,
                        zIdx: 9999999,
                    };
                    break;
                }
                case ObjectType.Structure: {
                    finalStair = this.checkStructureStairs(obj, this.rad);
                    break;
                }
            }
        }

        if (this.layer === 0) {
            this.bellowBridge = false;
        }

        if (finalStair?.lootOnly) {
            this.bellowBridge = true;
        }

        let finalRiver: River | undefined;
        // ignore rivers if we are in the ocean
        const beachAABB = this.game.map.beachBounds;
        if (
            !surface.type &&
            coldet.testPointAabb(this.pos, beachAABB.min, beachAABB.max)
        ) {
            const rivers = this.game.map.normalRivers;
            for (let i = 0; i < rivers.length; i++) {
                const river = rivers[i];
                if (
                    coldet.testPointAabb(this.pos, river.aabb.min, river.aabb.max) &&
                    math.pointInsidePolygon(this.pos, river.waterPoly)
                ) {
                    finalRiver = river;
                    break;
                }
            }
        }

        if (finalRiver) {
            const tangent = finalRiver.spline.getTangent(
                finalRiver.spline.getClosestTtoPoint(this.pos),
            );
            this.pushLoot(tangent, 0.5 * dt);
        }

        if (this.layer !== originalLayer) {
            this.setDirty();
        }

        if (!v2.eq(this.oldPos, this.pos)) {
            this.setPartDirty();
            this.game.grid.updateObject(this);
            this.mapIndicator?.updatePosition(this.pos);
        }

        this.game.map.clampToMapBounds(this.pos, this.rad);
    }

    pushLoot(dir: Vec2, velocity: number): void {
        v2.set(this.vel, v2.add(this.vel, v2.mul(dir, velocity)));
    }

    override destroy() {
        super.destroy();
        this.mapIndicator?.kill();
    }
}
