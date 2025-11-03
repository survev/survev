import { GameObjectDefs } from "../../../../shared/defs/gameObjectDefs";
import type { ThrowableDef } from "../../../../shared/defs/gameObjects/throwableDefs";
import type { MapDef } from "../../../../shared/defs/mapDefs";
import { MapObjectDefs } from "../../../../shared/defs/mapObjectDefs";
import type { ObstacleDef } from "../../../../shared/defs/mapObjectsTyping";
import { GameConfig } from "../../../../shared/gameConfig";
import { Constants } from "../../../../shared/net/net";
import { ObjectType } from "../../../../shared/net/objectSerializeFns";
import { type Collider, coldet } from "../../../../shared/utils/coldet";
import { collider } from "../../../../shared/utils/collider";
import { math } from "../../../../shared/utils/math";
import { assert, util } from "../../../../shared/utils/util";
import { type Vec2, v2 } from "../../../../shared/utils/v2";
import type { Game } from "../game";
import type { Player } from "./player";

interface ScheduledAirDrop {
    type: string;
    pos: Vec2;
    collider: Collider;
}

// amount of seconds to travel to target
const AIRDROP_PLANE_SPAWN_DIST = GameConfig.airdrop.planeVel * 15;
const AIRSTRIKE_PLANE_SPAWN_DIST = GameConfig.airstrike.planeVel * 2.5;

type PlaneOptions = MapDef["gameConfig"]["planes"]["timings"][number]["options"];

const MAX_ID = 255;

export class PlaneBarn {
    planes: Plane[] = [];

    freeIds: number[] = [];
    idNext = 1;

    /** bounds where the plane can exist, not the bounds of the plane itself */
    planeBounds = collider.createAabb(v2.create(-512, -512), v2.create(1536, 1536));

    scheduledPlanes: Array<{
        time: number;
        options: PlaneOptions;
    }> = [];

    newAirstrikeZones: {
        pos: Vec2;
        rad: number;
        duration: number;
    }[] = [];
    airstrikeZones: AirstrikeZone[] = [];

    sentHelp = false;

    constructor(readonly game: Game) {}
    update(dt: number) {
        for (let i = 0; i < this.planes.length; i++) {
            const plane = this.planes[i];
            plane.update(dt);

            if (
                !coldet.testPointAabb(
                    plane.pos,
                    this.planeBounds.min,
                    this.planeBounds.max,
                ) &&
                plane.actionComplete
            ) {
                this.planes.splice(i, 1);
                i--;
                this.freeIds.push(plane.id);
            }
        }

        for (let i = 0; i < this.airstrikeZones.length; i++) {
            const zone = this.airstrikeZones[i];
            zone.update(dt);
            if (zone.durationTicker <= 0) {
                this.airstrikeZones.splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < this.scheduledPlanes.length; i++) {
            const scheduledPlane = this.scheduledPlanes[i];
            scheduledPlane.time -= dt;
            if (scheduledPlane.time <= 0) {
                this.scheduledPlanes.splice(i, 1);
                i--;

                const options = scheduledPlane.options;
                switch (options.type) {
                    case GameConfig.Plane.Airdrop: {
                        this.addAirdrop(
                            v2.add(
                                this.game.gas.posNew,
                                util.randomPointInCircle(this.game.gas.radNew),
                            ),
                            options.airdropType,
                        );
                        break;
                    }
                    case GameConfig.Plane.Airstrike: {
                        assert(options.airstrikeZoneRad); // only option that MUST be defined
                        const rad = options.airstrikeZoneRad;
                        const timeBeforeStart = options.wait ?? 1.5;
                        const airstrikeInterval = options.delay ?? 1;
                        const planeCount = options.numPlanes
                            ? util.weightedRandom(options.numPlanes).count
                            : 3;
                        const pos = this.getAirstrikeZonePos(rad);

                        this.addAirstrikeZone(
                            pos,
                            rad,
                            planeCount,
                            timeBeforeStart,
                            airstrikeInterval,
                        );
                        break;
                    }
                }
            }
        }
    }

    getAirstrikeZonePos(rad: number) {
        // airstrike zones should occur over high player density areas
        // will look for the highest density area until an area with at least 1/3 of the players is found
        let pos = v2.copy(this.game.gas.posNew); // defaults to center of safe zone
        let connectedPlayers = this.game.playerBarn.livingPlayers.filter(
            (p) => !p.disconnected,
        );
        util.shuffleArray(connectedPlayers);
        let highestPlayerCount = 0;
        // if this is met, the zone is covering enough players and can break the loop
        const minPlayerCount = Math.floor(connectedPlayers.length / 3);
        for (let i = 0; i < connectedPlayers.length; i++) {
            const testPos = connectedPlayers[i].pos;

            const playerPercentage = this.game.grid
                .intersectCollider(collider.createCircle(testPos, rad))
                .filter(
                    (obj): obj is Player =>
                        obj.__type == ObjectType.Player &&
                        !obj.dead &&
                        obj.layer != 1 &&
                        !obj.disconnected,
                ).length;

            if (highestPlayerCount < playerPercentage) {
                highestPlayerCount = playerPercentage;
                pos = testPos;
                if (highestPlayerCount > minPlayerCount) break;
            }
        }

        pos = v2.add(pos, util.randomPointInCircle(3));
        this.game.map.clampToMapBounds(pos);

        return pos;
    }

    flush() {
        this.newAirstrikeZones.length = 0;
    }

    schedulePlane(time: number, options: PlaneOptions) {
        this.scheduledPlanes.push({
            time,
            options,
        });
    }

    addAirstrikeZone(
        pos: Vec2,
        rad: number,
        planeCount: number,
        timeBeforeStart: number,
        airstrikeInterval: number,
    ) {
        const timeToDropZone = 2.5; // takes 2.5 seconds from when a plane is called to reach its drop zone
        const finishBuffer = 2.5; // 2.5 second buffer after all planes are done
        const duration =
            timeBeforeStart +
            timeToDropZone +
            planeCount * airstrikeInterval +
            finishBuffer;

        assert(rad <= Constants.AirstrikeZoneMaxRad);
        assert(duration <= Constants.AirstrikeZoneMaxDuration);

        this.newAirstrikeZones.push({
            pos,
            rad,
            duration,
        });

        const zone = new AirstrikeZone(
            this.game,
            pos,
            rad,
            duration,
            planeCount,
            timeBeforeStart,
            airstrikeInterval,
        );
        this.airstrikeZones.push(zone);
        this.game.playerBarn.addMapPing("ping_airstrike", pos);
    }

    isOneTeamWinning(): boolean {
        if (this.sentHelp || this.game.gas.circleIdx == 0) return false;

        const redConnectedPlayers = this.game.playerBarn.teams[0].livingPlayers.filter(
            (p) => !p.disconnected,
        );
        const blueConnectedPlayers = this.game.playerBarn.teams[1].livingPlayers.filter(
            (p) => !p.disconnected,
        );

        const redAliveCount = redConnectedPlayers.length;
        const blueAliveCount = blueConnectedPlayers.length;

        const maxAliveCount = math.max(redAliveCount, blueAliveCount);
        const minAliveCount = math.min(redAliveCount, blueAliveCount);

        const threshold =
            (maxAliveCount - minAliveCount) / (maxAliveCount + minAliveCount);
        const difference = maxAliveCount - minAliveCount;
        return threshold >= 0.1 || difference >= 5;
    }

    helpLosingTeam(): void {
        if (!this.game.playerBarn.teams.length) return;

        // Special airdrop
        const losingTeam = this.game.playerBarn.teams.reduce((losingTeam, team) =>
            losingTeam.livingPlayers.length < team.livingPlayers.length
                ? losingTeam
                : team,
        );
        const winningTeam = this.game.playerBarn.teams.reduce((winningTeam, team) =>
            winningTeam.livingPlayers.length > team.livingPlayers.length
                ? winningTeam
                : team,
        );

        const winningTeamMean = v2.create(0, 0);
        for (let i = 0; i < winningTeam.livingPlayers.length; i++) {
            const player = winningTeam.livingPlayers[i];
            if (player.disconnected) continue;
            winningTeamMean.x += player.pos.x;
            winningTeamMean.y += player.pos.y;
        }

        winningTeamMean.x /= winningTeam.livingPlayers.length;
        winningTeamMean.y /= winningTeam.livingPlayers.length;

        const players = losingTeam.livingPlayers.filter(
            (p) => !p.disconnected && !this.game.gas.isInGas(p.pos),
        );
        if (!players.length) return;

        const furthestLosingTeamPlayer = players.reduce((furthest, current) => {
            return v2.distance(winningTeamMean, furthest.pos) >
                v2.distance(winningTeamMean, current.pos)
                ? furthest
                : current;
        }, players[0]);

        const pos = v2.add(furthestLosingTeamPlayer.pos, v2.mul(v2.randomUnit(), 5));
        this.game.planeBarn.addAirdrop(pos, "airdrop_crate_04"); // golden airdrop

        this.sentHelp = true;

        // Special airstrike
        const airstrikeRad = 50;
        const airstrikeTimeBeforeStart = 1.5;
        const airstrikeInterval = 1;
        const airstrikePlaneCount = 5;
        const airstrikePos = this.getAirstrikeZonePos(airstrikeRad);

        this.addAirstrikeZone(
            airstrikePos,
            airstrikeRad,
            airstrikePlaneCount,
            airstrikeTimeBeforeStart,
            airstrikeInterval,
        );
    }

    addAirdrop(pos: Vec2, type?: string) {
        let id = 1;
        if (this.idNext < MAX_ID) {
            id = this.idNext++;
        } else {
            if (this.freeIds.length > 0) {
                id = this.freeIds.shift()!;
            } else {
                assert(false, `Ran out of plane ids`);
            }
        }

        if (!id) {
            this.game.logger.warn("Plane Barn: ran out of IDs");
            return;
        }

        type ||= util.weightedRandom(this.game.map.mapDef.gameConfig.planes.crates).name;

        const def = MapObjectDefs[type] as ObstacleDef;

        let collided = true;
        let airdropPos = v2.copy(pos);

        let attemps = 0;

        while (collided && attemps < 10000) {
            collided = false;
            attemps++;

            let coll = collider.transform(def.collision, airdropPos, 0, 1);
            const objs = this.game.grid.intersectCollider(coll);

            // move airdrop randomly a bit if we are still colliding with something...
            if (attemps % 100 > 75) {
                coll = collider.transform(coll, v2.mul(v2.randomUnit(), 3), 0, 1);
            }

            for (let i = 0; i < objs.length && !collided; i++) {
                const obj = objs[i];
                if (obj.layer !== 0) continue;
                // height check to make it so bombs can still spawn on top of obstacles like the
                // faction mode statues
                if (obj.__type === ObjectType.Obstacle && !obj.destructible) {
                    const intersection = collider.intersect(coll, obj.collider);
                    if (intersection) {
                        coll = collider.transform(
                            coll,
                            v2.mul(intersection.dir, -intersection.pen),
                            0,
                            1,
                        );
                        collided = true;
                        break;
                    }
                } else if (obj.__type === ObjectType.Building) {
                    if (obj.wallsToDestroy < Infinity) continue;
                    for (const zoomRegion of obj.zoomRegions) {
                        if (!zoomRegion.zoomIn) continue;
                        const intersection = collider.intersect(coll, zoomRegion.zoomIn);
                        if (intersection) {
                            coll = collider.transform(
                                coll,
                                v2.mul(intersection.dir, -intersection.pen),
                                0,
                                1,
                            );
                            collided = true;
                            break;
                        }
                    }
                    if (collided) {
                        break;
                    }
                } else if (obj.__type === ObjectType.Airdrop) {
                    const intersection = collider.intersect(coll, obj.crateCollision);
                    if (intersection) {
                        coll = collider.transform(
                            coll,
                            v2.mul(intersection.dir, -intersection.pen),
                            0,
                            1,
                        );
                        collided = true;
                        break;
                    }
                }
            }
            for (let i = 0; i < this.planes.length && !collided; i++) {
                const plane = this.planes[i];
                if (plane.action !== GameConfig.Plane.Airdrop) continue;
                if (plane.actionComplete) continue;
                const airdrop = (plane as AirdropPlane).airDrop;

                const intersection = collider.intersect(coll, airdrop.collider);
                if (intersection) {
                    coll = collider.transform(
                        coll,
                        v2.mul(intersection.dir, -intersection.pen),
                        0,
                        1,
                    );
                    collided = true;
                    break;
                }
            }

            let rad: number;
            switch (coll.type) {
                case collider.Type.Aabb:
                    const width = coll.max.x - coll.min.x;
                    const height = coll.max.y - coll.min.y;
                    airdropPos = v2.create(
                        coll.min.x + width / 2,
                        coll.min.y + height / 2,
                    );
                    rad = math.max(width, height);
                    break;
                case collider.Type.Circle:
                    airdropPos = coll.pos;
                    rad = coll.rad;
                    break;
            }

            this.game.map.clampToMapBounds(airdropPos, rad);
        }

        const airdrop: ScheduledAirDrop = {
            type,
            pos: airdropPos,
            collider: collider.transform(def.collision, airdropPos, 0, 1),
        };

        const planePos = v2.add(pos, v2.mul(v2.randomUnit(), AIRDROP_PLANE_SPAWN_DIST));

        const toPlanePos = v2.sub(airdropPos, planePos);
        let len = v2.length(toPlanePos);
        let dir = len > 0.00001 ? v2.div(toPlanePos, len) : v2.create(1, 0);

        const plane = new AirdropPlane(this.game, id, planePos, dir, airdrop);
        this.planes.push(plane);
    }

    addAirStrike(pos: Vec2, dir: Vec2, playerId?: number) {
        let id = 1;
        if (this.idNext < MAX_ID) {
            id = this.idNext++;
        } else {
            if (this.freeIds.length > 0) {
                id = this.freeIds.shift()!;
            } else {
                assert(false, `Ran out of plane ids`);
            }
        }

        if (!id) {
            this.game.logger.warn("Plane Barn: ran out of IDs");
            return;
        }

        // necessary since something like projectile.pos could get passed in which would keep the reference.
        const posCopy = v2.copy(pos);
        const dirCopy = v2.copy(dir);

        const invertedDir = v2.neg(dirCopy);
        const planePos = v2.add(posCopy, v2.mul(invertedDir, AIRSTRIKE_PLANE_SPAWN_DIST));

        const planeConfig = GameConfig.airstrike;
        const bombPositions: Vec2[] = [];
        for (let i = 0; i < planeConfig.bombCount; i++) {
            let bombPos = v2.add(posCopy, v2.mul(dirCopy, planeConfig.bombOffset * i));
            bombPos = v2.add(bombPos, util.randomPointInCircle(planeConfig.bombJitter));
            bombPositions.push(bombPos);
        }

        const plane = new AirStrikePlane(
            this.game,
            id,
            planePos,
            posCopy,
            dirCopy,
            bombPositions,
            playerId ?? 0,
        );
        this.planes.push(plane);
    }
}

class AirstrikeZone {
    /** time until airstrike zone is completed */
    durationTicker = 0;
    /** time until airstrikes can start dropping in the zone */
    startTicker = 0;
    /** time inbetween airstrikes */
    airstrikeTicker = 0;
    planesLeft: number;

    pos: Vec2;
    rad: number;
    /** all planes for the zone fly in the same randomly chosen direction */
    planeDir: Vec2;

    airstrikeInterval: number;

    constructor(
        public game: Game,
        pos: Vec2,
        rad: number,
        duration: number,
        planeCount: number,
        timeBeforeStart: number,
        airstrikeInterval: number,
    ) {
        this.pos = pos;
        this.rad = rad;
        this.durationTicker = duration;
        this.planesLeft = planeCount;
        this.startTicker = timeBeforeStart;
        this.airstrikeInterval = airstrikeInterval;
        this.planeDir = v2.randomUnit();
    }

    getAirstrikePos(): Vec2 {
        // Random by default
        let pos = v2.add(this.pos, util.randomPointInCircle(this.rad));

        const planeConfig = GameConfig.airstrike;

        // 50% to aim at players above ground in range
        const aimChance = 0.5;
        if (Math.random() < aimChance) {
            let connectedPlayers = this.game.playerBarn.livingPlayers.filter(
                (p) => !p.disconnected,
            );
            util.shuffleArray(connectedPlayers);
            for (let i = 0; i < connectedPlayers.length; i++) {
                // Apply a random offset to the selected position
                const testPos = v2.add(
                    connectedPlayers[i].pos,
                    util.randomPointInCircle(
                        (planeConfig.bombCount * planeConfig.bombOffset) / 4,
                    ),
                );

                // Test if its within the zone
                if (
                    connectedPlayers[i].layer != 1 &&
                    v2.distance(this.pos, testPos) <= this.rad
                ) {
                    pos = testPos;
                    break;
                }
            }
        }

        // Offset the final position to make the bomb line centered
        const negPlaneDir = v2.neg(this.planeDir);
        const bombOffset = v2.mul(
            negPlaneDir,
            ((planeConfig.bombCount + 1.75) * planeConfig.bombOffset) / 2,
        );
        const offsetPos = v2.add(pos, bombOffset);

        return offsetPos;
    }

    update(dt: number) {
        this.durationTicker -= dt;

        if (this.startTicker > 0) {
            this.startTicker -= dt;

            if (this.startTicker <= 0) {
                const planePos = this.getAirstrikePos();
                this.game.planeBarn.addAirStrike(planePos, this.planeDir);
                this.airstrikeTicker = this.airstrikeInterval;
                this.planesLeft--;
            }
        }

        // can't drop airstrikes until start ticker is finished
        if (this.startTicker > 0) return;

        // no more airstrikes left
        if (this.planesLeft <= 0) return;

        if (this.airstrikeTicker > 0) {
            this.airstrikeTicker -= dt;

            if (this.airstrikeTicker <= 0) {
                const planePos = this.getAirstrikePos();
                this.game.planeBarn.addAirStrike(planePos, this.planeDir);
                this.airstrikeTicker = this.airstrikeInterval;
                this.planesLeft--;
            }
        }
    }
}

abstract class Plane {
    game: Game;
    planeBarn: PlaneBarn;
    config: typeof GameConfig.airdrop | typeof GameConfig.airstrike;
    pos: Vec2;
    targetPos: Vec2;
    action: number;
    id: number;
    planeDir: Vec2;
    rad: number;
    actionComplete = false;

    constructor(
        game: Game,
        id: number,
        action: number,
        pos: Vec2,
        targetPos: Vec2,
        dir: Vec2,
    ) {
        this.game = game;
        this.planeBarn = game.planeBarn;
        this.action = action;
        this.pos = pos;
        this.targetPos = targetPos;
        this.id = id;
        this.planeDir = dir;
        this.config =
            this.action == GameConfig.Plane.Airdrop
                ? GameConfig.airdrop
                : GameConfig.airstrike;

        this.rad = this.config.planeRad;
    }

    update(dt: number) {
        this.pos = v2.add(this.pos, v2.mul(this.planeDir, this.config.planeVel * dt));
    }
}

class AirdropPlane extends Plane {
    airDrop: ScheduledAirDrop;

    constructor(game: Game, id: number, pos: Vec2, dir: Vec2, airdrop: ScheduledAirDrop) {
        super(game, id, GameConfig.Plane.Airdrop, pos, airdrop.pos, dir);
        this.airDrop = airdrop;
    }

    update(dt: number): void {
        super.update(dt);
        if (!this.actionComplete && v2.distance(this.pos, this.targetPos) < 5) {
            this.actionComplete = true;
            this.game.airdropBarn.addAirdrop(this.targetPos, this.airDrop.type);
        }
    }
}

class AirStrikePlane extends Plane {
    /** needed for kill credits and friendly fire prevention */
    playerId?: number;
    reachedDropZone = false;
    startPos: Vec2;
    bombCount = 0;
    bombPositions: Vec2[];
    // drop a bomb every 2 ticks
    dropDelayCounter = 2;

    constructor(
        game: Game,
        id: number,
        pos: Vec2,
        targetPos: Vec2,
        dir: Vec2,
        bombPositions: Vec2[],
        playerId?: number,
    ) {
        super(game, id, GameConfig.Plane.Airstrike, pos, targetPos, dir);
        this.playerId = playerId;
        this.startPos = v2.copy(pos);
        this.bombPositions = bombPositions;
    }

    dropBomb(pos: Vec2): void {
        const config = this.config as typeof GameConfig.airstrike;
        if (this.bombCount >= config.bombCount) return;

        this.bombCount++;
        const bombDef = GameObjectDefs["bomb_iron"] as ThrowableDef;
        this.game.projectileBarn.addProjectile(
            this.playerId ?? 0, //0 means the projectile comes from the "game" itself not a player
            "bomb_iron",
            pos,
            5,
            0,
            v2.mul(this.planeDir, config.bombVel),
            bombDef.fuseTime,
            GameConfig.DamageType.Airstrike,
            undefined,
            "strobe", // for potato mode weapon swap
        );
    }

    update(dt: number) {
        super.update(dt);

        const startDir = v2.directionNormalized(this.targetPos, this.startPos);
        const currentDir = v2.directionNormalized(this.targetPos, this.pos);
        // if dot product is -1, that means the direction vectors are pointing opposite to each other
        // this can only happen if the plane has passed the targetPos meaning the drop zone has been reached
        if (!this.reachedDropZone && math.eqAbs(v2.dot(startDir, currentDir), -1)) {
            this.reachedDropZone = true;
        }

        if (!this.reachedDropZone) return;

        if (this.bombPositions.length == 0) {
            this.actionComplete = true;
            return;
        }

        if (this.dropDelayCounter % 2 == 0) {
            const pos = this.bombPositions.shift()!;
            this.dropBomb(pos);
            this.dropDelayCounter = 0;
        }
        this.dropDelayCounter++;
    }
}
