import { type GameObjectDef, type LootDef, WeaponTypeToDefs } from "../../../../shared/defs/gameObjectDefs.ts";
import { EmotesDefs } from "../../../../shared/defs/gameObjects/emoteDefs.ts";
import {
    type BackpackDef,
    type BoostDef,
    type ChestDef,
    GEAR_TYPES,
    type HealDef,
    type HelmetDef,
    SCOPE_LEVELS,
} from "../../../../shared/defs/gameObjects/gearDefs.ts";
import type { GunDef } from "../../../../shared/defs/gameObjects/gunDefs.ts";
import type { MeleeDef } from "../../../../shared/defs/gameObjects/meleeDefs.ts";
import { PerkProperties } from "../../../../shared/defs/gameObjects/perkDefs.ts";
import type { ThrowableDef } from "../../../../shared/defs/gameObjects/throwableDefs.ts";
import { UnlockDefs } from "../../../../shared/defs/gameObjects/unlockDefs.ts";
import { GameObjectDefs, MapObjectDefs } from "../../../../shared/defs/register.ts";
import {
    type Action,
    type Anim,
    EmoteSlot,
    GameConfig,
    type HasteType,
    type Input,
    type InventoryItem,
} from "../../../../shared/gameConfig.ts";
import * as net from "../../../../shared/net/net.ts";
import { ObjectType } from "../../../../shared/net/objectSerializeFns.ts";
import { type Circle, coldet } from "../../../../shared/utils/coldet.ts";
import { collider } from "../../../../shared/utils/collider.ts";
import { math } from "../../../../shared/utils/math.ts";
import { assert, util } from "../../../../shared/utils/util.ts";
import { v2, type Vec2 } from "../../../../shared/utils/v2.ts";
import { Config } from "../../config.ts";
import { validateUserName } from "../../utils/badWords.ts";
import { IDAllocator } from "../../utils/IDAllocator.ts";
import { Client } from "../client.ts";
import type { Game, JoinTokenData } from "../game.ts";
import { Group, Team } from "../group.ts";
import { InventoryManager } from "../inventoryManager.ts";
import { QuestManager } from "../questManager.ts";
import { NoOpSocket } from "../socket.ts";
import { WeaponManager } from "../weaponManager.ts";
import type { Building } from "./building.ts";
import { BaseGameObject, type DamageParams, type GameObject } from "./gameObject.ts";
import type { Loot } from "./loot.ts";
import type { MapIndicator } from "./mapIndicator.ts";
import type { Obstacle } from "./obstacle.ts";

type MoveObjsMode = {
    enabled: boolean;
    selectedObj?: Loot | Obstacle | Building;
    originalPos?: Vec2;
    selectPos?: Vec2;
};

interface Emote {
    playerId: number;
    pos: Vec2;
    type: string;
    isPing: boolean;
    /**
     * if type is "emote_loot", typestring of item goes here
     * "m870", "mosin", "1xscope", "762mm", etc
     */
    itemType: string;
}

type FabricateThrowable = keyof typeof PerkProperties["fabricate"]["weights"];

const boostHeals: Array<{ maxBoost: number; heal: number }> = [];
{
    const boostBreakPoints = GameConfig.player.boostBreakpoints;
    const max = GameConfig.player.boostBreakpoints.reduce((a, b) => a + b, 0);

    for (let i = 0, boost = 0; i < boostBreakPoints.length; i++) {
        boost += (boostBreakPoints[i] / max) * 100;
        boostHeals.push({
            maxBoost: boost,
            heal: GameConfig.player.boostHealAmounts[i],
        });
    }
}

export class PlayerBarn {
    players: Player[] = [];
    livingPlayers: Player[] = [];
    newPlayers: Player[] = [];
    deletedPlayers: number[] = [];
    killedPlayers: Player[] = [];
    groupIdAllocator = new IDAllocator(255);
    aliveCountDirty = false;

    emotes: Emote[] = [];

    killLeaderDirty = false;
    killLeader?: Player;

    aoeHealPlayers: Player[] = [];

    scheduledRoles: Array<{
        role: string;
        time: number;
    }> = [];

    sendWinEmoteTicker = 0;
    sentWinEmotes = false;

    teams: Team[] = [];
    groups: Group[] = [];
    groupsByHash = new Map<string, Group>();

    playerStatusTicker = 0;
    playerStatusRate = 0;

    defaultItems = util.mergeDeep(
        {},
        GameConfig.player.defaultItems,
        Config.defaultItems,
    );

    bagSizes: (typeof GameConfig)["bagSizes"];

    nextMatchDataId = 1;

    nextKilledNumber = 0;

    constructor(readonly game: Game) {
        this.bagSizes = util.mergeDeep(
            {},
            GameConfig.bagSizes,
            this.game.map.mapDef.gameConfig.bagSizes,
        );

        this.playerStatusRate = net.getPlayerStatusUpdateRate(this.game.map.factionMode);
    }

    randomPlayer(player?: Player) {
        const livingPlayers = player
            ? this.livingPlayers.filter((p) => p != player)
            : this.livingPlayers;
        return livingPlayers[util.randomInt(0, livingPlayers.length - 1)];
    }

    addPlayer(
        client: Client,
        joinMsg: net.JoinMsg,
        joinData: JoinTokenData,
    ) {
        const result = this.getGroupAndTeam(joinData.groupData);
        const group = result?.group;
        // solo 50v50 just chooses the smallest team everytime no matter what
        const team = this.game.map.factionMode && !this.game.isTeamMode
            ? this.getSmallestTeam()
            : result?.team;

        let pos: Vec2;
        let layer: number;
        if (this.game.map.perkMode && this.game.map.perkModeTwinsBunker) {
            // intermediate spawn point while the player chooses a role before theyre moved to their real spawn point
            const spawnBuilding = this.game.map.perkModeTwinsBunker;
            pos = spawnBuilding.pos;
            layer = spawnBuilding.layer;
        } else {
            pos = this.game.map.getSpawnPos(group, team);
            if (group && !group.spawnPosition) {
                group.spawnPosition = v2.copy(pos);
            }
            layer = 0;
        }

        const originalName = validateUserName(joinMsg.name).validName;
        let finalName = originalName;

        if (Config.uniqueInGameNames) {
            let count = 0;
            const loggedOutPlayers = this.game.playerBarn.players.filter(
                (p) => !p.client.userId,
            );
            while (loggedOutPlayers.find((p) => p.name === finalName)) {
                const postFix = `-${++count}`;
                const trimmed = originalName.substring(
                    0,
                    net.Constants.PlayerNameMaxLen - postFix.length,
                );
                finalName = trimmed + postFix;
            }
        }

        const player = new Player(
            this.game,
            pos,
            layer,
            client,
            finalName,
            joinMsg.bot,
            joinMsg.isMobile,
            joinData.quests,
        );

        this.activatePlayer(player, group, team);
        player.setLoadout(
            joinData.loadout ? joinData.loadout : joinMsg.loadout,
            !joinData.loadout,
        );

        return player;
    }

    activatePlayer(player: Player, group?: Group, team?: Team) {
        if (team && group) {
            team.addPlayer(player);
            group.addPlayer(player);
            player.setGroupStatuses();
        } else if (!team && group) {
            group.addPlayer(player);
            player.teamId = player.groupId;
            player.setGroupStatuses();
        } else if (team && !group) {
            team.addPlayer(player);
            player.groupId = this.groupIdAllocator.getNextId();
        } else {
            player.groupId = player.teamId = this.groupIdAllocator.getNextId();
        }

        if (player.game.map.perkMode) {
            /*
             * +5 because the client has its own timer
             * this timer is only a safety net in case a player modifies the client code
             * if this timer reaches 0, we know for a fact the client timer didn't end when it should've
             */
            player.roleMenuTicker = GameConfig.player.perkModeRoleSelectDuration + 5;
        }

        this.game.logger.info(`Player ${player.name} joined`);

        this.newPlayers.push(player);
        this.game.objectRegister.register(player);
        this.players.push(player);
        this.livingPlayers.push(player);
        this.livingPlayers.sort((a, b) => a.teamId - b.teamId);

        this.aliveCountDirty = true;

        this.game.updateData();
    }

    testPlayerCount = 0;
    addTestPlayer(params: {
        group?: Group;
        team?: Team;
        pos?: Vec2;
        name?: string;
        userId?: string;
    }): Player {
        let group = params.group;
        let team = params.team;

        if (!group && this.game.isTeamMode) {
            group = this.addGroup(false);
        }

        if (!team && this.game.map.factionMode) {
            team = this.getSmallestTeam();
        }

        const client = new Client(this.game, new NoOpSocket(), params.userId || null, "");
        this.game.clientBarn.clients.push(client);

        const player = new Player(
            this.game,
            params.pos ?? v2.create(this.game.map.width / 2, this.game.map.height / 2),
            0,
            client,
            params.name ?? `TEST-${String.fromCharCode(65 + this.testPlayerCount++)}`,
            false,
            false,
        );
        client.player = player;

        this.activatePlayer(player, group, team);

        return player;
    }

    update(dt: number) {
        let sendWinEmotes = false;
        if (this.game.over && !this.sentWinEmotes) {
            this.sendWinEmoteTicker -= dt;
            if (this.sendWinEmoteTicker <= 0) {
                sendWinEmotes = true;
                this.sentWinEmotes = true;
            }
        }

        if (this.game.isTeamMode || this.game.map.factionMode) {
            this.playerStatusTicker += dt;
        }

        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            player.update(dt);

            if (!player.dead && sendWinEmotes) {
                player.emoteFromSlot(EmoteSlot.Win);
            }
        }

        // doing this after updates ensures that gameover msgs sent are always accurate
        // if this was done in netsync, players could die while waiting for the next netsync call
        // then the gameover msgs would be inaccurate since theyre based on the current alive count
        for (let i = 0; i < this.killedPlayers.length; i++) {
            this.killedPlayers[i].addGameOverMsg();
        }
        this.killedPlayers.length = 0;

        // update scheduled roles
        for (let i = this.scheduledRoles.length - 1; i >= 0; i--) {
            const scheduledRole = this.scheduledRoles[i];
            scheduledRole.time -= dt;
            if (scheduledRole.time <= 0) {
                this.scheduledRoles.splice(i, 1);

                const fullAliveContext = this.game.modeManager.getAlivePlayersContext();
                for (let i = 0; i < fullAliveContext.length; i++) {
                    const promotablePlayers = fullAliveContext[i].filter(
                        (p) => !p.disconnected && !p.downed && !p.role,
                    );
                    if (promotablePlayers.length == 0) continue;

                    // logic to combat people joining with multiple tabs to role farm
                    const activePromotablePlayers = promotablePlayers.filter((player) => {
                        const total = player.movingTicker + player.stayingStillTicker;
                        if (total > 5) {
                            // for players alive for more than 5 seconds, filter out the ones that have stayed still
                            // for over 50% of the time
                            const timeAfk = player.stayingStillTicker / total;
                            if (timeAfk > 0.5) {
                                return false;
                            }
                        }
                        // also filter out players that haven't moved for the last 5 seconds
                        if (player.timeWithoutMoving > 5) {
                            return false;
                        }

                        // for people joining with the same account
                        // only count their first join thats still connected
                        if (player.userId) {
                            const playersWithThisAccount = this.livingPlayers.filter(otherPlayer => {
                                return !otherPlayer.disconnected && otherPlayer.userId === player.userId;
                            });
                            const thisIdx = playersWithThisAccount.indexOf(player);
                            if (thisIdx !== 0) return false;
                        }

                        return true;
                    });

                    // if we don't have any active player to be promoted
                    // then no harm in promoting possibly AFK players...
                    const finalPlayers = activePromotablePlayers.length === 0
                        ? promotablePlayers
                        : activePromotablePlayers;

                    if (!finalPlayers.length) continue;

                    const randomPlayer = util.randomItem(finalPlayers);
                    randomPlayer.promoteToRole(scheduledRole.role);
                }
            }
        }
    }

    removePlayer(player: Player) {
        util.removeFrom(this.players, player);

        if (util.removeFrom(this.livingPlayers, player)) {
            this.aliveCountDirty = true;
        }

        this.deletedPlayers.push(player.__id);
        player.destroy();
        if (player.team) {
            player.team.removePlayer(player);
        }
        if (player.group) {
            player.group.removePlayer(player);

            if (player.group.players.length <= 0) {
                util.removeFrom(this.groups, player.group);
                this.groupsByHash.delete(player.group.hash);
            }
        }
        if (this.game.isTeamMode) {
            this.livingPlayers.sort((a, b) => a.teamId - b.teamId);
        }

        for (const spectator of player.spectators) {
            spectator.spectating = spectator.getNewPlayerToSpectate();
        }

        player.obstacleOutfit?.destroy();

        this.game.checkGameOver();
        this.game.updateData();
    }

    flush() {
        this.newPlayers.length = 0;
        this.deletedPlayers.length = 0;
        this.emotes.length = 0;
        this.aliveCountDirty = false;
        this.killLeaderDirty = false;

        const flushPlayerStatus = this.playerStatusTicker > this.playerStatusRate;
        if (flushPlayerStatus) {
            this.playerStatusTicker = 0;
        }

        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            player.healthDirty = false;
            player.boostDirty = false;
            player.zoomDirty = false;
            player.actionDirty = false;
            player.inventoryDirty = false;
            player.weapsDirty = false;
            player.spectatorCountDirty = false;
            player.groupStatusDirty = false;
            if (flushPlayerStatus) {
                player.playerStatusDirty = false;
            }
        }
    }

    /**
     * called everytime gas.circleIdx is incremented for efficiency purposes
     * schedules all roles that need to be assigned for the respective circleIdx
     */
    scheduleRoleAssignments(): void {
        const roles = this.game.map.mapDef.gameConfig.roles;
        assert(
            roles,
            "\"roles\" property is undefined in chosen map definition, cannot call this function",
        );

        const rolesToSchedule = roles.timings.filter(
            (timing) => this.game.gas.circleIdx == timing.circleIdx,
        );

        for (let i = 0; i < rolesToSchedule.length; i++) {
            const roleObj = rolesToSchedule[i];
            const roleStr = roleObj.role instanceof Function ? roleObj.role() : roleObj.role;
            this.scheduledRoles.push({
                role: roleStr,
                time: roleObj.wait,
            });
        }
    }

    isTeamGameOver(): boolean {
        const groupAlives = [...this.groups.values()].filter(
            (group) => !group.allDeadOrDisconnected,
        );

        if (groupAlives.length <= 1) {
            return true;
        }

        return false;
    }

    getAliveGroups(): Group[] {
        return [...this.groups.values()].filter(
            (group) => group.livingPlayers.length > 0,
        );
    }

    getAliveTeams(): Team[] {
        return this.teams.filter((team) => team.livingPlayers.length > 0);
    }

    getSmallestTeam() {
        return this.teams.reduce((smallest, current) => {
            if (current.livingPlayers.length < smallest.livingPlayers.length) {
                return current;
            }
            return smallest;
        }, this.teams[0]);
    }

    addTeam(teamId: number) {
        const team = new Team(this.game, teamId);
        this.teams.push(team);
        return team;
    }

    getGroupAndTeam(groupData: JoinTokenData["groupData"]):
        | {
            group?: Group;
            team?: Team;
        }
        | undefined
    {
        if (!this.game.isTeamMode) return undefined;

        let group = this.groupsByHash.get(groupData.groupHashToJoin);
        let team = this.game.map.factionMode ? this.getSmallestTeam() : undefined;

        if (!group && groupData.autoFill) {
            const groups = team ? team.getGroups() : this.groups;
            group = groups.find((group) => {
                return group.autoFill && group.canJoin(groupData.playerCount);
            });
        }

        // second condition should never happen
        // but keeping it just in case
        // since more than 4 players in a group crashes the client
        if (!group || group.players.length >= this.game.teamMode) {
            group = this.addGroup(groupData.autoFill);
        }

        // only reserve slots on the first time this join token is used
        // since the playerCount counts for other people from the team menu
        // using the same token
        if (group.hash !== groupData.groupHashToJoin) {
            group.reservedSlots += groupData.playerCount;
        }

        groupData.groupHashToJoin = group.hash;

        // pre-existing group not created during this function call
        // players who join from the same group need the same team
        if (this.game.map.factionMode && group.players.length > 0) {
            team = group.players[0].team;
        }

        return { group, team };
    }

    addGroup(autoFill: boolean) {
        // not using nodejs crypto because i want it to run in the browser too
        // and doesn't need to be cryptographically secure lol
        const hash = Math.random().toString(16).slice(2);
        const groupId = this.groupIdAllocator.getNextId();
        const group = new Group(hash, groupId, autoFill, this.game.teamMode);
        this.groups.push(group);
        this.groupsByHash.set(hash, group);
        return group;
    }

    nextTeam(currentTeam: Group) {
        const aliveTeams = Array.from(this.groups.values()).filter(
            (t) => !t.allDeadOrDisconnected,
        );
        const currentTeamIndex = aliveTeams.indexOf(currentTeam);
        const newIndex = (currentTeamIndex + 1) % aliveTeams.length;
        return aliveTeams[newIndex];
    }

    prevTeam(currentTeam: Group) {
        const aliveTeams = Array.from(this.groups.values()).filter(
            (t) => !t.allDeadOrDisconnected,
        );
        const currentTeamIndex = aliveTeams.indexOf(currentTeam);
        return aliveTeams.at(currentTeamIndex - 1) ?? currentTeam;
    }

    getPlayerWithHighestKills(): Player | undefined {
        return this.game.playerBarn.livingPlayers
            .filter((p) => p.kills >= GameConfig.player.killLeaderMinKills)
            .sort((a, b) => b.kills - a.kills)[0];
    }

    addEmote(type: string, playerId: number, itemType = "") {
        this.emotes.push({
            isPing: false,
            playerId,
            pos: v2.create(0, 0),
            type,
            itemType,
        });
    }

    addMapPing(type: string, pos: Vec2, playerId = 0) {
        this.emotes.push({
            isPing: true,
            type,
            pos,
            playerId,
            itemType: "",
        });
    }
}

export class Player extends BaseGameObject {
    override readonly __type = ObjectType.Player;

    bounds = collider.createAabbExtents(
        v2.create(0, 0),
        v2.create(GameConfig.player.maxVisualRadius, GameConfig.player.maxVisualRadius),
    );

    scale = 1;

    get rad(): number {
        return GameConfig.player.radius * this.scale;
    }

    set rad(rad: number) {
        this.collider.rad = rad;
        this.rad = rad;
    }

    get playerId() {
        return this.__id;
    }

    dir = v2.create(1, 0);
    dirOld = v2.create(1, 0);
    // direction received from the last inputMsg
    dirNew = v2.create(1, 0);

    posOld = v2.create(0, 0);

    vel = v2.mul(v2.create(1, 0), 0);

    collider: Circle;

    healthDirty = true;
    boostDirty = true;
    zoomDirty = true;
    actionDirty = false;
    inventoryDirty = true;
    weapsDirty = true;
    spectatorCountDirty = false;
    hasFiredFlare = false;
    flareTimer = 0;

    sendDeathEmoteTicker = 0;
    sentDeathEmote = false;

    team: Team | undefined = undefined;
    group: Group | undefined = undefined;

    /**
     * set true if any member on the team changes health or disconnects
     */
    groupStatusDirty = false;

    setGroupStatuses() {
        if (!this.game.isTeamMode) return;

        const teammates = this.group!.players;
        for (const t of teammates) {
            t.groupStatusDirty = true;
        }
    }

    /**
     * for updating player and teammate locations in the minimap client UI
     */
    playerStatusDirty = false;

    private _health: number = GameConfig.player.health;

    get health(): number {
        return this._health;
    }

    set health(health: number) {
        health = math.clamp(health, 0, GameConfig.player.health);
        if (this._health === health) return;
        this._health = health;
        this.healthDirty = true;
        this.setGroupStatuses();

        if (this.obstacleOutfit) {
            const healthT = math.clamp(this._health / 100, 0, 1);

            if (!math.eqAbs(this.obstacleOutfit.healthT, healthT, 0.01)) {
                this.obstacleOutfit.healthT = healthT;
                this.obstacleOutfit.setDirty();
            }
        }
    }

    minBoost = 0;
    lastBoost = 0;

    private _boost = 0;
    get boost() {
        return this._boost;
    }
    set boost(boost: number) {
        this._boost = math.clamp(boost, 0, 100);
    }

    speed: number = 0;
    moveVel = v2.create(0, 0);

    // used to filter out AFK players on 50v50 role promotions
    movingTicker = 0;
    stayingStillTicker = 0;
    timeWithoutMoving = 0;

    shotSlowdownTimer: number = 0;

    freeSwitchTimer: number = 0;

    indoors = false;
    insideZoomRegion = false;

    _zoom: number = 0;

    get zoom(): number {
        return this._zoom;
    }

    set zoom(zoom: number) {
        if (zoom === this._zoom) return;
        assert(zoom !== 0);
        this._zoom = zoom;
        this.zoomDirty = true;
    }

    scopeZoomRadius: Record<string, number>;

    scope = "1xscope";

    get inventory() {
        return this.invManager.items;
    }
    invManager = new InventoryManager(this);

    get curWeapIdx() {
        return this.weaponManager.curWeapIdx;
    }

    weapons: WeaponManager["weapons"];

    get activeWeapon() {
        return this.weaponManager.activeWeapon;
    }

    private _spectatorCount = 0;

    recalculateSpectatorCount() {
        const newCount = [...this.spectators].filter(c => !c.specAnon).length;
        if (this._spectatorCount !== newCount) {
            this._spectatorCount = newCount;
            this.spectatorCountDirty = true;
        }
    }

    get spectatorCount(): number {
        return this._spectatorCount;
    }

    spectators = new Set<Client>();

    outfit = "outfitBase";

    setOutfit(outfit: string) {
        if (this.outfit === outfit) return;
        const def = GameObjectDefs.typeToDef(outfit, "outfit");
        if (this.game.map.factionMode) {
            if (def.teamId && this.teamId !== def.teamId) {
                return;
            }
        }
        this.outfit = outfit;

        this.obstacleOutfit?.destroy();
        this.obstacleOutfit = undefined;

        if (def.obstacleType) {
            this.obstacleOutfit = this.game.map.genOutfitObstacle(def.obstacleType, this);
        }
        this.setDirty();
    }

    /** "backpack00" is no backpack, "backpack03" is the max level backpack */
    backpack: string;
    /** "" is no helmet, "helmet03" is the max level helmet */
    helmet: string;
    /** "" is no chest, "chest03" is the max level chest */
    chest: string;

    getGearLevel(type: string): number {
        if (!type) {
            // not wearing any armor, level 0
            return 0;
        }
        return (GameObjectDefs.typeToDef(type) as BackpackDef | HelmetDef | ChestDef).level;
    }

    layer: number;
    aimLayer = 0;
    dead = false;
    downed = false;

    downedCount = 0;
    /**
     * players have a buffer where they can't take damage immediately after being downed
     * this is mostly so players dont get knocked AND killed by the same airstrike
     */
    downedDamageTicker = 0;
    bleedTicker = 0;
    playerBeingRevived: Player | undefined;
    revivedBy: Player | undefined;

    animType: Anim = GameConfig.Anim.None;
    animSeq = 0;
    private _animTicker = 0;

    distSinceLastCrawl = 0;

    actionType: Action = GameConfig.Action.None;
    actionSeq = 0;
    action = { time: 0, duration: 0, targetId: 0 };

    timeUntilHidden = -1; // for showing on enemy minimap in 50v50

    /**
     * specifically for reloading single shot guns to keep reloading until maxClip is reached
     */
    reloadAgain = false;

    visionObscured = false;
    visionRecoveryTicker = 0;
    wearingPan = false;
    healEffect = false;
    healEffectTicker = 0;

    lastStandEffect = false;
    lastStandEffectTicker = 0;

    // if hit by snowball, potato, or coconut: slowed down for "x" seconds
    frozenTicker = 0;
    frozen = false;
    frozenOri = 0;
    frozenType = "";

    private _hasteTicker = 0;
    hasteType: HasteType = GameConfig.HasteType.None;
    hasteSeq = 0;

    actionItem = "";

    hasRoleHelmet = false;
    role = "";
    isKillLeader = false;

    /** for cobalt mode role menu, will spawn the player by force if timer runs out */
    roleMenuTicker = 0;

    /** for the perk fabricate, fills inventory with frags every 12 seconds */
    fabricateRefillTicker = 0;
    fabricateGiveTicker = 0;
    fabricateThrowablesLeft: Array<FabricateThrowable> = [];

    // "Gabby Ghost" perk random emojis
    chattyTicker = 0;

    mapIndicator?: MapIndicator;

    // spud gun variables

    fatModifier = 0;
    fatTicker = 0;

    viewDistModifier = 0;
    viewDistTicker = 0;

    timeInsideGas = 0;

    promoteToRole(role: string) {
        let roleDef = GameObjectDefs.typeToDef(role, "role");

        const roleOverride = this.game.map.mapDef.gameConfig.roles?.roleOverrides?.[role];
        if (roleOverride) {
            roleDef = util.mergeDeep({}, roleDef, roleOverride);
        }

        if (role === "leader") {
            this.hasFiredFlare = false;
            this.flareTimer = 15;
        }

        if (this.role === role) return;

        // switching from one role to another
        // need to delete any non-droppables so they can be overwritten
        if (this.role) {
            if (this.helmet && GameObjectDefs.typeToDef(this.helmet, "helmet").noDrop) {
                this.helmet = "";
            }
            if (this.chest && GameObjectDefs.typeToDef(this.chest, "chest").noDrop) {
                this.chest = "";
            }
        }

        this.role = role;
        this.inventoryDirty = true;
        this.setDirty();

        // for savannah the hunted indicator
        if (roleDef.mapIndicator) {
            this.mapIndicator?.kill();
            this.mapIndicator = this.game.mapIndicatorBarn.allocIndicator(role, true);
        }

        const msg = new net.RoleAnnouncementMsg();
        msg.role = role;
        msg.assigned = true;
        msg.playerId = this.__id;
        this.game.clientBarn.broadcastMsg(net.MsgType.RoleAnnouncement, msg);

        switch (role) {
            case "leader":
                if (this.game.map.factionMode && !this.team!.leader) {
                    this.team!.leader = this;
                }
                break;
            case "last_man":
                this.health = 100;
                this.boost = 100;
                this.giveHaste(GameConfig.HasteType.Windwalk, 5);
                break;
        }

        // A list of the new perks to add must be built first
        const newPerks = new Set<string>();

        // Random perk addition logiic
        if (role === "classless") {
            const perkPool = PerkProperties.classless.perkPool;
            const candidatePerks = perkPool.filter((perk) => !this.hasPerk(perk));
            const newPerk = util.randomItem(candidatePerks);

            if (newPerk) {
                newPerks.add(newPerk);
            }
        } else if (roleDef.perks) {
            // client can only show 4 perks in the UI
            // if this role has 4 or more perks, drop all our droppable perks
            if (roleDef.perks.length >= 4) {
                for (const perk of this.perks) {
                    if (perk.droppable) {
                        this.dropLoot(perk.type);
                        this.removePerk(perk.type);
                    }
                }
            }
            for (let i = 0; i < roleDef.perks.length; i++) {
                const perkOrPerkFunc = roleDef.perks[i];
                const perkType = typeof perkOrPerkFunc === "string"
                    ? perkOrPerkFunc
                    : perkOrPerkFunc();

                newPerks.add(perkType);
            }
        }
        // Then, remove perks from the old role
        // But skip perks that are going to be readded to avoid double adding them or removing / readding pointlessly.
        for (let i = 0; i < this.perks.length; i++) {
            const perkType = this.perks[i].type;
            if (this.perks[i].isFromRole) {
                if (role != "classless" && !newPerks.has(perkType)) {
                    this.removePerk(perkType);
                    i--;
                } else {
                    newPerks.delete(perkType);
                }
            } else if (this.perks[i].droppable && newPerks.has(perkType)) {
                this.dropLoot(perkType);
                this.removePerk(perkType);
                i--;
            }
        }

        for (const perk of newPerks) {
            this.addPerk(perk, false, undefined, true);
        }

        if (roleDef.defaultItems) {
            // for non faction modes where teamId > 2, just cycles between blue and red teamId
            const clampedTeamId = ((this.teamId - 1) % 2) + 1;

            // give backpack before heals/ammos
            if (roleDef.defaultItems.backpack) {
                if (this.backpack) {
                    this.dropBackPackCopy(this.backpack);
                }
                this.backpack = roleDef.defaultItems.backpack;
            }

            // inventory and scope
            for (const [key, value] of Object.entries(roleDef.defaultItems.inventory)) {
                this.invManager.giveAndDrop(key as InventoryItem, value);
            }

            // outfit
            const oldOutfit = GameObjectDefs.typeToDef(this.outfit, "outfit");
            let newOutfit = roleDef.defaultItems.outfit;

            if (newOutfit instanceof Function) {
                newOutfit = newOutfit(clampedTeamId);
            }
            if (newOutfit) {
                if (!oldOutfit.noDropOnDeath && !oldOutfit.noDrop) {
                    this.dropLoot(this.outfit);
                }
                this.setOutfit(newOutfit);
            }

            const roleHelmet = roleDef.defaultItems.helmet instanceof Function
                ? roleDef.defaultItems.helmet(clampedTeamId)
                : roleDef.defaultItems.helmet;

            if (roleHelmet) {
                // armor
                if (this.helmet && !this.hasRoleHelmet) {
                    this.dropArmor(this.helmet);
                }

                this.helmet = roleHelmet;
                this.hasRoleHelmet = true;
            }

            if (roleDef.defaultItems.chest) {
                if (this.chest) {
                    this.dropArmor(this.chest);
                }
                this.chest = roleDef.defaultItems.chest;
            }

            // weapons
            for (let i = 0; i < roleDef.defaultItems.weapons.length; i++) {
                const weaponOrWeaponFunc = roleDef.defaultItems.weapons[i];
                const trueWeapon = weaponOrWeaponFunc instanceof Function
                    ? weaponOrWeaponFunc(clampedTeamId)
                    : weaponOrWeaponFunc;

                if (!trueWeapon.type) {
                    // prevents overwriting existing weapons
                    if (!this.weapons[i].type) {
                        continue;
                    }

                    const curWeapDef = GameObjectDefs.typeToDef(this.weapons[i].type);
                    if (curWeapDef.type == "gun") {
                        // refills the ammo of the existing weapon
                        this.weaponManager.reload(i, true);
                    }
                    continue;
                }

                const trueWeapDef = GameObjectDefs.typeToDefSafe(trueWeapon.type);
                if (trueWeapDef && trueWeapDef.type == "gun") {
                    if (this.weapons[i].type) this.weaponManager.dropGun(i);

                    if (trueWeapon.fillInv) {
                        const ammoType = trueWeapDef.ammo as InventoryItem;
                        const maxSize = this.invManager.getMaxCapacity(ammoType);
                        this.invManager.set(ammoType, maxSize);
                    }
                } else if (trueWeapDef && trueWeapDef.type == "melee") {
                    if (this.weapons[i].type) {
                        const curMelee = GameObjectDefs.typeToDef(this.weapons[i].type, "melee");
                        if (!curMelee.noDropOnDeath) {
                            this.weaponManager.dropMelee();
                        }
                    }
                }
                this.weaponManager.setWeapon(i, trueWeapon.type, trueWeapon.ammo);
            }
        }
    }

    roleSelect(role: string): void {
        if (!this.game.map.perkModeTwinsBunker || this.role) return;

        // so the client can't be manipulated to send lone survivr or something
        if (!this.game.map.mapDef.gameMode.perkModeRoles!.includes(role)) return;

        this.roleMenuTicker = 0;
        this.promoteToRole(role);
        // v2.set() necessary since this.collider.pos is linked to this.pos by reference
        v2.set(this.pos, this.game.map.getSpawnPos(this.group, this.team));
        if (this.group && !this.group.spawnPosition) {
            this.group.spawnPosition = v2.copy(this.pos);
        }
        this.layer = 0; // player was underground before this

        this.game.grid.updateObject(this);
        this.setDirty();
    }

    removeRole(): void {
        if (!this.role) return;
        this.role = "";

        this.mapIndicator?.kill();
        for (let i = 0; i < this.perks.length; i++) {
            const perk = this.perks[i];
            if (perk.isFromRole) {
                this.removePerk(perk.type);
                i--;
            }
        }
        this.setDirty();
    }

    promoteToKillLeader() {
        if (this.isKillLeader) return;

        this.isKillLeader = true;
        if (this.game.playerBarn.killLeader) {
            this.game.playerBarn.killLeader.isKillLeader = false;
        }

        this.game.playerBarn.killLeader = this;
        this.game.playerBarn.killLeaderDirty = true;

        if (this.game.map.sniperMode) {
            // promote to the role on savannah
            this.promoteToRole("the_hunted");
        } else {
            // else just send a RoleAnnouncementMsg
            const msg = new net.RoleAnnouncementMsg();
            msg.role = "kill_leader";
            msg.assigned = true;
            msg.playerId = this.__id;
            this.game.clientBarn.broadcastMsg(net.MsgType.RoleAnnouncement, msg);
        }
    }

    combatStimsActive = false;
    private _combatStimsTicker = 0;

    lastBreathActive = false;
    private _lastBreathTicker = 0;

    bugleTickerActive = false;
    private _bugleTicker = 0;

    private _perks: Array<{
        type: string;
        droppable: boolean;
        replaceOnDeath?: string;
        isFromRole?: boolean;
    }> = [];

    get perks(): ReadonlyArray<Player["_perks"][0]> {
        return this._perks;
    }

    private _perkTypes: string[] = [];

    addPerk(
        type: string,
        droppable = false,
        replaceOnDeath?: string,
        isFromRole?: boolean,
    ) {
        this._perks.push({
            type,
            droppable,
            replaceOnDeath,
            isFromRole,
        });
        this._perkTypes.push(type);

        switch (type) {
            case "trick_m9": {
                const ammo = this.weaponManager.getAmmoStats(
                    GameObjectDefs.typeToDef("m9_cursed", "gun"),
                );
                this.weaponManager.setWeapon(
                    GameConfig.WeaponSlot.Secondary,
                    "m9_cursed",
                    ammo.maxClip,
                );
                break;
            }
            case "fabricate":
                this.fabricateRefillTicker = PerkProperties.fabricate.refillInterval;
                break;
            case "aoe_heal":
                this.game.playerBarn.aoeHealPlayers.push(this);
                break;
        }

        this.recalculateScale();
        this.recalculateMinBoost();
    }

    removePerk(type: string): void {
        const idx = this._perks.findIndex((perk) => perk.type === type);
        if (idx === -1) return;
        this._perks.splice(idx, 1);
        this._perkTypes.splice(this._perkTypes.indexOf(type), 1);

        switch (type) {
            case "trick_m9": {
                const slot = this.weapons.findIndex((weap) => {
                    return weap.type === "m9_cursed";
                });
                if (slot !== -1) {
                    this.weaponManager.setWeapon(slot, "", 0);
                }
                break;
            }
            case "inspiration": {
                const slot = this.weapons.findIndex((weap) => {
                    return weap.type === "bugle";
                });
                if (slot !== -1) {
                    this.weaponManager.setWeapon(slot, "", 0);
                }
                break;
            }
            case "fabricate":
                this.fabricateRefillTicker = 0;
                this.fabricateThrowablesLeft = [];
                break;
            case "firepower":
                this.weaponManager.clampGunsAmmo();
                break;
            case "aoe_heal": {
                util.removeFrom(this.game.playerBarn.aoeHealPlayers, this);
                break;
            }
            case "flak_jacket": {
                this.invManager.enforceMaxCapacity("frag");
                this.invManager.enforceMaxCapacity("mirv");
            }
        }

        this.recalculateScale();
        this.recalculateMinBoost();
    }

    hasPerk(type: string) {
        return this._perkTypes.includes(type);
    }

    hasActivePan() {
        return (
            this.wearingPan
            || (this.activeWeapon == "pan" && this.animType !== GameConfig.Anim.Melee)
        );
    }

    getPanSegment() {
        const panSurface = this.wearingPan ? "unequipped" : "equipped";
        let surface = GameObjectDefs.typeToDef("pan", "melee").reflectSurface![panSurface];

        const scale = this.scale;

        if (scale !== 1) {
            if (panSurface === "unequipped") {
                surface = {
                    p0: v2.mul(surface.p0, scale),
                    p1: v2.mul(surface.p1, scale),
                };
            } else {
                const s = (scale - 1) * 0.75;
                const off = v2.create(s, -s);
                surface = {
                    p0: v2.add(surface.p0, off),
                    p1: v2.add(surface.p1, off),
                };
            }
        }

        return surface;
    }

    client: Client;

    get userId() {
        return this.client.userId;
    }
    get disconnected() {
        return this.client.disconnected;
    }

    name: string;
    isMobile: boolean;

    bot: boolean;

    debug = {
        zoomEnabled: false,
        zoom: 1,

        speedEnabled: false,
        speed: 1,

        noClip: false,
        teleportToPings: false,
        godMode: false,

        /** drag and drop loot, obstacles, and buildings */
        moveObjMode: <MoveObjsMode> {
            enabled: false,
            /** object you're currently dragging */
            selectedObj: undefined,
            /** original position of the selected obj */
            originalPos: undefined,
            /** mouse position when obj first selected */
            selectPos: undefined,
        },
    };

    teamId = 1;
    groupId = 0;

    loadout = {
        outfit: "outfitBase",
        heal: "heal_basic",
        boost: "boost_basic",
        emotes: [...GameConfig.defaultEmoteLoadout],
    };

    emoteSoftTicker = 0;
    emoteHardTicker = 0;
    emoteCounter = 0;

    damageTaken = 0;
    damageDealt = 0;
    currentBuildingType = "";
    questManager = new QuestManager(this);

    // infinity since we aren't dead yet ;)
    // this is used for sorting and getting player ranks
    // first player to die is 0, second is 1 etc
    killedIndex = Infinity;

    kills = 0;
    timeAlive = 0;

    weaponManager = new WeaponManager(this);
    recoilTicker = 0;

    // to disable auto pickup for some seconds after dropping something
    mobileDropTicker = 0;

    obstacleOutfit?: Obstacle;

    /**
     * Only used for match data saving!
     * __id is for the game itself, __id can be reused when a player despawns
     * which can break the matchData
     */
    matchDataId: number;

    constructor(
        game: Game,
        pos: Vec2,
        layer: number,
        client: Client,
        name: string,
        isBot: boolean,
        isMobile: boolean,
        questIds?: string[],
    ) {
        super(game, pos);

        this.layer = layer;
        this.name = name;
        this.client = client;
        this.isMobile = isMobile;
        this.bot = Config.debug.allowBots && isBot;

        this.questManager.quests = (questIds ?? []).map((id) => ({
            id,
            delta: 0,
            totalDelta: 0,
        }));

        this.matchDataId = game.playerBarn.nextMatchDataId++;

        this.weapons = this.weaponManager.weapons;

        let defaultItems = GameConfig.player.defaultItems;

        if (!this.bot) {
            defaultItems = this.game.playerBarn.defaultItems;
        }

        // createCircle clones the position
        // so set it manually to link both
        this.collider = collider.createCircle(this.pos, this.rad);
        this.collider.pos = this.pos;

        this.scopeZoomRadius = GameConfig.scopeZoomRadius[this.isMobile ? "mobile" : "desktop"];

        this.zoom = this.scopeZoomRadius[this.scope];

        function assertType(type: string, category: GameObjectDef["type"], acceptNoItem: boolean) {
            if (!type && acceptNoItem) return;
            GameObjectDefs.typeToDef(type, category);
        }

        for (let i = 0; i < GameConfig.WeaponSlot.Count; i++) {
            const weap = defaultItems.weapons[i];
            let type = weap.type || this.weapons[i].type;
            if (!type) continue;
            assertType(type, GameConfig.WeaponType[i], true);
            this.weaponManager.setWeapon(i, type, weap.ammo ?? 0);
        }

        this.chest = defaultItems.chest;
        assertType(this.chest, "chest", true);

        this.scope = defaultItems.scope;
        assertType(this.scope, "scope", false);
        this.invManager.set(this.scope as InventoryItem, 1);

        this.helmet = defaultItems.helmet;
        assertType(this.helmet, "helmet", true);

        this.backpack = defaultItems.backpack;
        assertType(this.backpack, "backpack", false);

        this.outfit = defaultItems.outfit;
        assertType(this.outfit, "outfit", false);

        for (const perk of defaultItems.perks) {
            assertType(perk.type, "perk", false);
            this.addPerk(perk.type, perk.droppable);
        }

        for (const [item, amount] of Object.entries(defaultItems.inventory)) {
            this.invManager.set(item as InventoryItem, amount);
        }

        if (this.game.map.sniperMode) {
            this.invManager.give("2xscope", 1);
        }

        this.weaponManager.showNextThrowable();
        this.recalculateScale();
    }

    update(dt: number): void {
        if (this.dead) {
            if (!this.sentDeathEmote) {
                this.sendDeathEmoteTicker -= dt;
                if (this.sendDeathEmoteTicker <= 0) {
                    this.emoteFromSlot(EmoteSlot.Death);
                    this.sentDeathEmote = true;
                }
            }
            return;
        }

        this.timeAlive += dt;

        if (this.game.map.factionMode && this.timeUntilHidden > 0) {
            this.timeUntilHidden -= dt;
            if (this.timeUntilHidden < 0) {
                this.playerStatusDirty = true;
            }
        }

        if (this.role === "leader" && !this.hasFiredFlare && this.flareTimer > 0) {
            this.flareTimer -= dt;
            if (this.flareTimer <= 0) {
                const flareGunIndex = this.weapons.findIndex(
                    (w) => w.type === "flare_gun" || w.type === "flare_gun_dual",
                );
                this.hasFiredFlare = true;
                this.flareTimer = 0;
                if (flareGunIndex !== -1) {
                    this.weaponManager.setCurWeapIndex(flareGunIndex);
                    this.weaponManager.fireWeapon(false, true);
                    // go back to melee if we fired while downed lol
                    if (this.downed) {
                        this.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Melee);
                    }
                }
            }
        }

        if (this.roleMenuTicker > 0) {
            this.roleMenuTicker -= dt;
            if (this.roleMenuTicker <= 0) {
                this.roleMenuTicker = 0;
                const roleChoices = this.game.map.mapDef.gameMode.perkModeRoles!;
                this.roleSelect(util.randomItem(roleChoices));
            }
        }

        // players are still choosing a perk from the perk select menu
        if (this.game.map.perkMode && !this.role) return;

        //
        // Direction
        //
        this.dirOld = v2.copy(this.dir);

        if (!v2.eq(this.dir, this.dirNew)) {
            this.dir = this.dirNew;
            this.setPartDirty();
        }
        this.mousePos = v2.add(this.pos, v2.mul(this.dir, this.toMouseLen));

        //
        // Boost logic
        //
        if (!this.downed) {
            this.boost = math.clamp(this.boost, this.minBoost, 100);

            if (this.boost > 0) {
                let healAmount = boostHeals.findLast((b, i) => {
                    const prev = boostHeals[i - 1]?.maxBoost ?? 0;
                    return this.boost >= prev && this.boost <= b.maxBoost;
                });

                this.health += healAmount!.heal * dt;

                if (this.boost > this.minBoost) {
                    if (this.hasPerk("lifeline")) {
                        this.boost -= GameConfig.player.boostDecay
                            * PerkProperties.lifeline.decayMult
                            * dt;
                    } else {
                        this.boost -= GameConfig.player.boostDecay * dt;
                    }
                }
            }
        } else {
            this.boost = 0;
        }

        // only set to dirty if it changed enough from last time we sent it
        // since it only uses 8 bits the precision is really low and sending it every tick is a waste
        if (!math.eqAbs(this.lastBoost, this.boost, 0.1)) {
            this.lastBoost = this.boost;
            this.boostDirty = true;
        }

        if (this.hasPerk("gotw")) {
            this.health += PerkProperties.gotw.healthRegen * dt;
        }

        //
        // Action logic
        //
        if (this.isReviving() || this.isBeingRevived()) {
            // cancel revive if either player goes out of range or if player being revived dies
            if (
                this.playerBeingRevived
                && (v2.distance(this.pos, this.playerBeingRevived.pos)
                        > GameConfig.player.reviveRange
                    || this.playerBeingRevived.dead)
            ) {
                this.cancelAction();
            }
        }

        if (this.downedDamageTicker > 0) {
            this.downedDamageTicker -= dt;

            if (this.downedDamageTicker <= 0) {
                this.downedDamageTicker = 0;
            }
        }

        //
        // Emote cooldown
        //

        this.emoteSoftTicker -= dt;
        if (
            this.emoteCounter >= GameConfig.player.emoteThreshold
            && this.emoteHardTicker > 0.0
        ) {
            this.emoteHardTicker -= dt;
            if (this.emoteHardTicker < 0.0) {
                this.emoteCounter = 0;
            }
        } else if (this.emoteSoftTicker < 0.0 && this.emoteCounter > 0) {
            this.emoteCounter--;
            this.emoteSoftTicker = GameConfig.player.emoteSoftCooldown * 1.5;
        }

        // Take bleeding damage
        this.bleedTicker -= dt;
        if (
            ((this.downed && this.actionType == GameConfig.Action.None)
                || this.hasPerk("trick_drain"))
            && this.bleedTicker < 0
        ) {
            const hasDrain = this.hasPerk("trick_drain");
            this.bleedTicker = hasDrain
                ? GameConfig.player.bleedTickRate * 3
                : GameConfig.player.bleedTickRate;

            const mapConfig = this.game.map.mapDef.gameConfig;

            const bleedDamageMult = mapConfig.bleedDamageMult;

            const multiplier = bleedDamageMult != 1 ? this.downedCount * bleedDamageMult : 1;

            let damage = hasDrain ? 1 : mapConfig.bleedDamage * multiplier;
            this.damage({
                amount: damage,
                damageType: GameConfig.DamageType.Bleeding,
                dir: this.dir,
            });
            // don't continue the update if we died
            if (this.dead) {
                return;
            }
        }

        this.chattyTicker -= dt;

        if (this.hasPerk("trick_chatty") && this.chattyTicker < 0) {
            this.chattyTicker = util.random(5, 15);

            const emotes = Object.keys(EmotesDefs);

            this.game.playerBarn.addEmote(
                util.randomItem(emotes),
                this.__id,
            );
        }

        if (this.game.gas.isInGas(this.pos)) {
            if (this.game.gas.circleIdx > 2) {
                this.timeInsideGas += dt;
            }

            if (this.game.gas.doDamage) {
                let damage = this.disconnected ? 22 : this.game.gas.damage;
                const damageMulti = 1 + this.timeInsideGas * 0.025;

                this.damage({
                    amount: damage * damageMulti,
                    damageType: GameConfig.DamageType.Gas,
                    dir: this.dir,
                });
                // don't continue the update if we died
                if (this.dead) {
                    return;
                }
            }
        } else {
            this.timeInsideGas = 0;
        }

        if (this.reloadAgain && this.actionType !== GameConfig.Action.Revive) {
            this.reloadAgain = false;
            this.weaponManager.scheduledReload = true;
        }

        // handle heal and boost actions

        if (this.actionType !== GameConfig.Action.None) {
            this.action.time += dt;
            this.action.time = math.clamp(
                this.action.time,
                0,
                net.Constants.ActionMaxDuration,
            );

            if (this.action.time >= this.action.duration) {
                if (this.actionType === GameConfig.Action.UseItem) {
                    const itemDef = GameObjectDefs.typeToDef(this.actionItem) as HealDef | BoostDef;
                    if ("heal" in itemDef) {
                        this.applyActionFunc((target: Player) => {
                            target.health += itemDef.heal;
                            if (this.hasPerk("combat_stims")) {
                                this.combatStimsActive = true;
                                this._combatStimsTicker = 5;
                            }
                        });
                    }
                    if ("boost" in itemDef) {
                        this.applyActionFunc((target: Player) => {
                            target.boost += itemDef.boost;
                            if (this.hasPerk("combat_stims")) {
                                this.combatStimsActive = true;
                                this._combatStimsTicker = 5;
                            }
                        });
                    }
                    this.invManager.take(this.actionItem as InventoryItem, 1);
                    this.questManager.trackEvent("item_used", {
                        itemType: this.actionItem,
                    });
                } else if (this.isReloading()) {
                    this.weaponManager.reload();
                } else if (
                    this.actionType === GameConfig.Action.Revive
                    && this.playerBeingRevived
                ) {
                    this.applyActionFunc((target: Player) => {
                        if (!target.downed) return;
                        target.downed = false;
                        target.downedBy = undefined;
                        target.downedDamageTicker = 0;
                        target.health = GameConfig.player.reviveHealth;

                        // checks 2 conditions in one, player has pan AND has it selected
                        if (target.weapons[target.curWeapIdx].type === "pan") {
                            target.wearingPan = false;
                        }

                        target.setDirty();
                        target.setGroupStatuses();
                    });
                }

                // Prevent cancelAction from being called by revived players at the end of revive
                if (!this.revivedBy || this.playerBeingRevived == this.revivedBy) {
                    this.cancelAction();
                }

                if (
                    (this.curWeapIdx == GameConfig.WeaponSlot.Primary
                        || this.curWeapIdx == GameConfig.WeaponSlot.Secondary)
                    && this.weapons[this.curWeapIdx].ammo == 0
                    && this.actionType !== GameConfig.Action.Revive
                ) {
                    this.weaponManager.scheduledReload = true;
                }
            }
        }

        //
        // Animation logic
        //
        if (this.animType !== GameConfig.Anim.None) {
            this._animTicker -= dt;

            if (this._animTicker <= 0) {
                this.animType = GameConfig.Anim.None;
                this._animTicker = 0;
                this.animSeq++;
                this.setDirty();
            }
        }

        //
        // Projectile slowdown logic
        //
        if (this.frozen) {
            this.frozenTicker -= dt;

            if (this.frozenTicker <= 0) {
                this.frozenTicker = 0;
                this.frozen = false;
                this.setDirty();
            }
        }

        //
        // Haste logic
        //
        if (this.hasteType != GameConfig.HasteType.None) {
            this._hasteTicker -= dt;

            if (this._hasteTicker <= 0) {
                this.hasteType = GameConfig.HasteType.None;
                this._hasteTicker = 0;
                this.hasteSeq++;
                this.setDirty();
            }
        }

        //
        // Combat Stimulants Logic
        //
        if (this.combatStimsActive) {
            this._combatStimsTicker -= dt;

            if (this._combatStimsTicker <= 0) {
                this.combatStimsActive = false;
                this._lastBreathTicker = 0;
            }
        }

        //
        // Last breath logic
        //
        if (this.lastBreathActive) {
            this._lastBreathTicker -= dt;

            if (this._lastBreathTicker <= 0) {
                this.lastBreathActive = false;
                this._lastBreathTicker = 0;

                this.recalculateScale();
            }
        }

        //
        // Bugler logic
        //
        if (this.bugleTickerActive) {
            this._bugleTicker -= dt;

            if (this._bugleTicker <= 0) {
                this.bugleTickerActive = false;
                this._bugleTicker = 0;

                const bugle = this.weapons.find((w) => w.type == "bugle");
                if (bugle) {
                    bugle.ammo++;
                    if (
                        bugle.ammo
                            < this.weaponManager.getAmmoStats(GameObjectDefs.typeToDef("bugle", "gun"))
                                .maxClip
                    ) {
                        this.bugleTickerActive = true;
                        this._bugleTicker = 8;
                    }
                }
                this.weapsDirty = true;
            }
        }

        if (this.hasPerk("fabricate")) {
            if (this.fabricateThrowablesLeft.length > 0) {
                this.fabricateGiveTicker -= dt;
                if (this.fabricateGiveTicker < 0) {
                    this.fabricateGiveTicker = PerkProperties.fabricate.giveInterval;

                    const item = this.fabricateThrowablesLeft.shift()!;
                    this.invManager.give(item, 1);

                    const msg = new net.PickupMsg();
                    msg.type = net.PickupMsgType.Success;
                    msg.item = item;
                    msg.count = 1;
                    if (
                        !this.weaponManager.weapons[GameConfig.WeaponSlot.Throwable].type
                    ) {
                        this.weaponManager.showNextThrowable();
                    }

                    this.client.sendMsg(net.MsgType.Pickup, msg);
                }
            }

            this.fabricateRefillTicker -= dt;
            if (this.fabricateRefillTicker <= 0) {
                const counts: Record<FabricateThrowable, number> = {
                    frag: 0,
                    mirv: 0,
                    strobe: 0,
                };

                let remaining = 8;
                while (remaining > 0) {
                    const item = util.weightedRandomObject(PerkProperties.fabricate.weights) as FabricateThrowable;
                    counts[item]++;
                    remaining--;
                }

                const nextQueue: Array<FabricateThrowable> = [];
                for (const item of Object.keys(PerkProperties.fabricate.weights) as FabricateThrowable[]) {
                    const canGive = math.max(
                        this.invManager.getMaxCapacity(item) - this.invManager.get(item),
                        0,
                    );
                    const giveCount = math.min(counts[item], canGive);
                    for (let i = 0; i < giveCount; i++) {
                        nextQueue.push(item);
                    }
                }

                this.fabricateThrowablesLeft = nextQueue;
                this.fabricateGiveTicker = PerkProperties.fabricate.giveInterval;
                this.fabricateRefillTicker = PerkProperties.fabricate.refillInterval;
            }
        }

        if (this.fatModifier > 0) {
            this.fatTicker -= dt;
            if (this.fatTicker < 0) {
                this.fatModifier -= 0.2 * dt;
                this.fatModifier = math.max(0, this.fatModifier);
                this.recalculateScale();
            }
        }

        if (this.viewDistModifier > 0) {
            this.viewDistTicker -= dt;
            if (this.viewDistTicker <= 0) {
                this.viewDistModifier = 0;
                this.viewDistTicker = 0;
                this.zoomDirty = true;
            }
        }

        //
        // Calculate new speed, position and check for collision with obstacles
        //
        const movement = v2.create(0, 0);

        if (this.touchMoveActive && this.touchMoveLen) {
            movement.x = this.touchMoveDir.x;
            movement.y = this.touchMoveDir.y;
        } else {
            if (this.moveUp) movement.y++;
            if (this.moveDown) movement.y--;
            if (this.moveLeft) movement.x--;
            if (this.moveRight) movement.x++;

            if (movement.x * movement.y !== 0) {
                // If the product is non-zero, then both of the components must be non-zero
                movement.x *= Math.SQRT1_2;
                movement.y *= Math.SQRT1_2;
            }
        }

        v2.set(this.posOld, this.pos);

        if (!v2.eq(this.vel, v2.create(0, 0), 0.01)) {
            v2.set(this.vel, v2.mul(this.vel, 1 / (1 + dt * 4)));
            v2.set(this.pos, v2.add(this.pos, v2.mul(this.vel, dt)));
        }

        const hasTreeClimbing = this.hasPerk("tree_climbing");

        let steps: number;

        if (!v2.eq(movement, v2.create(0, 0))) {
            this.recalculateSpeed(hasTreeClimbing);
            steps = Math.round(math.max(this.speed * dt + 5, 5));

            this.movingTicker += dt;
            this.timeWithoutMoving = 0;
        } else {
            this.timeWithoutMoving += dt;
            this.stayingStillTicker += dt;

            this.speed = 0;
            steps = 1;
        }
        v2.set(this.moveVel, v2.mul(movement, this.speed));

        const speedToAdd = (this.speed / steps) * dt;

        const circle = collider.createCircle(
            this.pos,
            GameConfig.player.maxVisualRadius * this.scale + this.speed * dt,
        );

        const objs = this.game.grid.intersectCollider(circle);

        for (let i = 0; i < steps; i++) {
            v2.set(this.pos, v2.add(this.pos, v2.mul(movement, speedToAdd)));

            for (let j = 0; j < objs.length && !this.debug.noClip; j++) {
                const obj = objs[j];
                if (obj.__type !== ObjectType.Obstacle) continue;
                if (!obj.collidable) continue;
                if (obj.dead) continue;
                if (!util.sameLayer(obj.layer, this.layer)) continue;
                if (obj.isTree && hasTreeClimbing) continue;

                const collision = collider.intersectCircle(
                    obj.collider,
                    this.pos,
                    this.rad,
                );
                if (collision) {
                    v2.set(
                        this.pos,
                        v2.add(this.pos, v2.mul(collision.dir, collision.pen + 0.001)),
                    );
                }
            }
        }

        this.mapIndicator?.updatePosition(this.pos);

        // if we are the group leader and new players can still join the group
        // update the group spawn position to our current position every 1 second
        // if we are in a valid spawn position (not on water, inside a building, etc)
        if (
            this.group?.players[0] === this
            && this.game.canJoin
            && this.group.players.length < this.group.maxPlayers
        ) {
            this.group.spawnPositionTicker -= dt;

            if (this.group.spawnPositionTicker <= 0) {
                this.group.spawnPositionTicker = 1;

                if (this.game.map.canPlayerSpawn(this.pos)) {
                    this.group.spawnPosition = v2.copy(this.pos);
                }
            }
        }

        this.pickupTicker -= dt;

        //
        // Mobile auto interaction
        //
        this.mobileDropTicker -= dt;
        if (this.isMobile && this.mobileDropTicker <= 0 && !this.downed && !this.dead) {
            const closestLoot = this.getClosestLoot();

            if (closestLoot) {
                const itemDef = GameObjectDefs.typeToDef(closestLoot.type);
                switch (itemDef.type) {
                    case "gun":
                        const freeSlot = this.getFreeGunSlot(closestLoot);
                        if (
                            freeSlot.slot
                            && freeSlot.slot !== this.curWeapIdx
                            && !this.weapons[freeSlot.slot].type
                        ) {
                            this.pickupLoot(closestLoot);
                        }
                        break;
                    case "melee": {
                        if (this.weapons[GameConfig.WeaponSlot.Melee].type === "fists") {
                            this.pickupLoot(closestLoot);
                        }
                        break;
                    }
                    case "perk": {
                        /**
                         * Prevents mobile players from automatically picking up
                         * halloween perks. Additionally prevents them from auto-picking
                         * up perks if they already have a droppable perk.
                         *
                         * NOTE: This is a poor solution (idString checking) and should
                         * not be used as a precedent to allow more idString checking.
                         */
                        if (
                            closestLoot.type !== "halloween_mystery"
                            && !this.perks.find((perk) => perk.droppable)
                        ) {
                            this.pickupLoot(closestLoot);
                        }
                        break;
                    }
                    case "outfit": {
                        break;
                    }
                    case "helmet":
                    case "chest":
                    case "backpack": {
                        const thisLevel = this.getGearLevel(this[itemDef.type]);
                        const thatLevel = this.getGearLevel(closestLoot.type);
                        if (thisLevel < thatLevel) {
                            this.pickupLoot(closestLoot);
                        }
                        break;
                    }
                    default:
                        if (
                            this.invManager.isValid(closestLoot.type)
                            && this.invManager.get(closestLoot.type)
                                >= this.invManager.getMaxCapacity(closestLoot.type)
                        ) {
                            break;
                        }
                        this.pickupLoot(closestLoot);
                        break;
                }
            }

            const obstacles = this.getInteractableObstacles();
            for (let i = 0; i < obstacles.length; i++) {
                const obstacle = obstacles[i];
                if (obstacle.isDoor && obstacle.door && !obstacle.door.open) {
                    obstacle.interact(this);
                }
            }
        }

        //
        // Scope zoom, heal regions and and auto open doors logic
        //

        let finalZoom = this.scopeZoomRadius[this.scope];
        const lowestZoom = this.scopeZoomRadius["1xscope"];
        finalZoom -= this.viewDistModifier;
        finalZoom = math.max(lowestZoom, finalZoom);

        this.indoors = false;

        /*
         * checking when a player leaves a heal region is a pain,
         * so we just set healEffect to false by default and set it to true when theyre inside a heal region
         */
        const oldHealEffect = this.healEffect;
        this.healEffect = false;

        // Special handling for short ticker for throwable healing
        this.healEffectTicker -= dt;
        if (this.healEffectTicker > 0) {
            this.healEffect = true;
        }

        const oldLastStandEffect = this.lastStandEffect;

        if (this.lastStandEffectTicker > 0) {
            this.lastStandEffect = true;
            this.lastStandEffectTicker -= dt;
        } else {
            this.lastStandEffect = false;
        }

        let zoomRegionZoom = lowestZoom;
        let insideNoZoomRegion = true;
        let insideSmoke = false;
        // building player is currently inside of
        let occupiedBuilding: Building | undefined;

        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            if (obj.__type === ObjectType.Building) {
                if (
                    !this.downed
                    && obj.healRegions
                    && util.sameLayer(this.layer, obj.layer)
                    && !this.game.gas.isInGas(this.pos) // heal regions don't work in gas
                ) {
                    let totalHeal = 0;
                    const c = collider.createCircle(this.pos, 0.1);

                    for (let j = 0; j < obj.healRegions.length; j++) {
                        const hr = obj.healRegions[j];
                        if (coldet.test(c, hr.collision)) {
                            totalHeal += hr.healRate;
                        }
                    }

                    if (totalHeal) {
                        this.health += totalHeal * dt;
                        this.healEffect = true;
                    }
                }

                if (obj.ceilingDead) continue;

                // only check if layer is the same when not on stairs!
                if (this.layer < 2 && this.layer !== obj.layer) continue;

                for (let i = 0; i < obj.zoomRegions.length; i++) {
                    const zoomRegion = obj.zoomRegions[i];

                    if (
                        zoomRegion.zoomIn
                        && coldet.testCircleAabb(
                            this.collider.pos,
                            this.collider.rad,
                            zoomRegion.zoomIn.min,
                            zoomRegion.zoomIn.max,
                        )
                    ) {
                        this.indoors = true;
                        this.insideZoomRegion = !zoomRegion.noZoom;
                        occupiedBuilding = obj;
                        insideNoZoomRegion = false;
                        if (zoomRegion.zoom) {
                            zoomRegionZoom = zoomRegion.zoom;
                        }
                    }

                    if (
                        zoomRegion.zoomOut
                        && coldet.testCircleAabb(
                            this.collider.pos,
                            this.collider.rad,
                            zoomRegion.zoomOut.min,
                            zoomRegion.zoomOut.max,
                        )
                    ) {
                        insideNoZoomRegion = false;
                        if (this.insideZoomRegion) {
                            if (zoomRegion.zoom) {
                                zoomRegionZoom = zoomRegion.zoom;
                            }
                        }
                    }
                }
            } else if (obj.__type === ObjectType.Obstacle) {
                if (!util.sameLayer(this.layer, obj.layer)) continue;
                if (!obj.door || !obj.isDoor) continue;
                if (obj.door.locked) continue;
                if (!obj.door.autoOpen) continue;
                if (obj.door.open) continue;
                if (
                    obj.door.openOneWay
                    && obj.getPlayerSide(this) !== obj.door.openOneWay
                ) {
                    continue;
                }

                const res = collider.intersectCircle(
                    obj.collider,
                    this.pos,
                    this.rad + obj.interactionRad,
                );
                if (res) {
                    obj.interact(this, true);
                }
            } else if (obj.__type === ObjectType.Smoke) {
                if (!util.sameLayer(this.layer, obj.layer)) continue;
                if (coldet.testCircleCircle(this.pos, this.rad, obj.pos, obj.rad)) {
                    this.visionObscured = true;
                    this.visionRecoveryTicker = 0;
                    insideSmoke = true;
                }
            }
        }

        // guh, works for the club, might need testing for other buildings idk
        const parentStructureType = occupiedBuilding?.parentStructure
            ? (MapObjectDefs.typeToDef(occupiedBuilding.parentStructure.type, "structure"))
                .structureType
            : undefined;
        this.currentBuildingType = parentStructureType ?? occupiedBuilding?.type ?? "";

        // only dirty if healEffect changed from last tick to current tick (leaving or entering a heal region)
        if (oldHealEffect != this.healEffect) {
            this.setDirty();
        }

        if (oldLastStandEffect != this.lastStandEffect) {
            this.setDirty();
        }

        if (!insideSmoke) {
            this.visionRecoveryTicker += dt;
            if (this.visionRecoveryTicker >= 0.5) {
                this.visionObscured = false;
            }
        }

        if (this.insideZoomRegion) {
            finalZoom = zoomRegionZoom;
        }
        if (this.visionObscured || this.downed) {
            finalZoom = lowestZoom;
        }

        if (this.debug.zoomEnabled) {
            this.zoom = this.debug.zoom;
        } else {
            this.zoom = finalZoom;
        }

        if (insideNoZoomRegion) {
            this.insideZoomRegion = false;
        }

        //
        // Calculate layer
        //
        const originalLayer = this.layer;
        const rot = Math.atan2(this.dir.y, this.dir.x);
        const ori = math.radToOri(rot);
        const stair = this.checkStairs(objs!, this.rad);
        if (stair) {
            if (ori === stair.downOri) {
                this.aimLayer = 3;
            } else if (ori === stair.upOri) {
                this.aimLayer = 2;
            } else {
                this.aimLayer = this.layer;
            }
        } else {
            this.aimLayer = this.layer;
        }
        if (this.layer !== originalLayer) {
            this.setDirty();

            if (this.obstacleOutfit) {
                this.obstacleOutfit.layer = this.layer;
                this.obstacleOutfit.setDirty();
            }
        }

        //
        // Final position calculation: clamp to map bounds and set dirty if changed
        //
        this.game.map.clampToMapBounds(this.pos, this.rad);

        if (!v2.eq(this.pos, this.posOld)) {
            this.setPartDirty();
            this.game.grid.updateObject(this);

            //
            // Halloween obstacle skin
            //
            if (this.obstacleOutfit) {
                this.obstacleOutfit.pos = v2.copy(this.pos);
                this.obstacleOutfit.updateCollider();
                this.obstacleOutfit.setPartDirty();
            }
        }

        //
        // Downed logic
        //
        if (this.downed) {
            this.distSinceLastCrawl += v2.distance(this.posOld, this.pos);

            if (this.animType === GameConfig.Anim.None && this.distSinceLastCrawl > 3) {
                let anim: number = GameConfig.Anim.CrawlForward;

                if (!v2.eq(this.dir, movement, 1)) {
                    anim = GameConfig.Anim.CrawlBackward;
                }

                this.playAnim(anim, GameConfig.player.crawlTime);
                this.distSinceLastCrawl = 0;
            }
        }

        if (this.debug.moveObjMode.enabled) this.moveObjUpdate(occupiedBuilding);

        //
        // Weapon stuff
        //
        this.weaponManager.update(dt);

        this.shotSlowdownTimer -= dt;
        if (this.shotSlowdownTimer <= 0) {
            this.shotSlowdownTimer = 0;
        }
    }

    moveObjUpdate(occupiedBuilding?: Building): void {
        if (!this.debug.moveObjMode.enabled) return;
        const mouseCollider = collider.createCircle(this.mousePos, 1);
        const childIds = occupiedBuilding
            ? new Set(occupiedBuilding.childObjects.map((o) => o.__id))
            : undefined;
        const hoveredObj = this.game.grid
            .intersectCollider(mouseCollider)
            .filter((o): o is Loot | Obstacle | Building => {
                if (
                    o.__type != ObjectType.Loot
                    && o.__type != ObjectType.Obstacle
                    && o.__type != ObjectType.Building
                ) {
                    return false;
                }

                if (!util.sameLayer(o.layer, this.layer)) return false;
                if (o.__type == ObjectType.Obstacle && o.dead) return false;
                // if inside building, can only select one of its children
                if (this.indoors && !childIds?.has(o.__id)) return false;
                return true;
            })
            .find((o) => {
                const transformedBounds = collider.transform(o.bounds, o.pos, 0, 1);
                const aabb = collider.toAabb(transformedBounds);
                return coldet.testPointAabb(this.mousePos, aabb.min, aabb.max);
            });

        if (hoveredObj && this.shootStart) {
            this.debug.moveObjMode.selectedObj = hoveredObj;
            this.debug.moveObjMode.originalPos = v2.copy(
                this.debug.moveObjMode.selectedObj.pos,
            );
            this.debug.moveObjMode.selectPos = v2.copy(this.mousePos);
        }

        if (
            this.debug.moveObjMode.selectedObj
            && this.debug.moveObjMode.selectPos
            && this.debug.moveObjMode.originalPos
        ) {
            if (this.shootHold) {
                const deltaPos = v2.sub(this.mousePos, this.debug.moveObjMode.selectPos);
                const newPos = v2.add(this.debug.moveObjMode.originalPos, deltaPos);
                this.debug.moveObjMode.selectedObj.updatePos(newPos);
            } else {
                this.debug.moveObjMode.selectedObj.refresh();
                this.debug.moveObjMode.selectedObj = undefined;
                this.debug.moveObjMode.selectPos = undefined;
                this.debug.moveObjMode.originalPos = undefined;
            }
        }
    }

    /**
     * doesn't care about kill credit or anything, simply the last player to damage you (excludes yourself)
     */
    lastDamagedBy: Player | undefined;

    damage(params: DamageParams) {
        if (this.debug.godMode) return;
        if (this._health < 0) this._health = 0;
        if (this.dead) return;
        if (this.downed && this.downedDamageTicker > 0) return;
        // cobalt players on role picker menu
        if (this.game.map.perkMode && !this.role) return;

        const playerSource = params.source?.__type === ObjectType.Player
            ? (params.source as Player)
            : undefined;

        // teammates can't deal damage to each other
        if (playerSource && params.source !== this) {
            if (playerSource.teamId === this.teamId && !this.disconnected) {
                // Combat Stimulants Healing
                const gameSourceDef = GameObjectDefs.typeToDefSafe(params.gameSourceType ?? "");
                if (
                    playerSource._combatStimsTicker > 0
                    && gameSourceDef?.type === "gun"
                ) {
                    const healAmount = params.amount! * PerkProperties.combat_stims.healPercent;
                    if (healAmount > 0) {
                        this.health = math.min(
                            this.health + healAmount,
                            GameConfig.player.health,
                        );
                        this.healEffectTicker = 0.5;
                        this.setDirty();
                    }
                }
                return;
            }
        }

        let finalDamage = params.amount!;

        const reduceDamage = (multi: number) => {
            if (params.armorPenetration !== undefined) {
                multi *= params.armorPenetration;
            }
            finalDamage -= finalDamage * multi;
        };

        // ignore armor for gas and bleeding damage
        if (
            params.damageType !== GameConfig.DamageType.Gas
            && params.damageType !== GameConfig.DamageType.Bleeding
        ) {
            const gameSourceDef = GameObjectDefs.typeToDefSafe(params.gameSourceType ?? "");
            let isHeadShot = false;

            if (gameSourceDef && "headshotMult" in gameSourceDef && !params.isExplosion) {
                isHeadShot = Math.random() < GameConfig.player.headshotChance;

                if (isHeadShot) {
                    finalDamage *= gameSourceDef.headshotMult;
                }
            }

            if (this.hasPerk("flak_jacket")) {
                reduceDamage(
                    params.isExplosion
                        ? PerkProperties.flak_jacket.explosionDamageReduction
                        : PerkProperties.flak_jacket.damageReduction,
                );
            }

            if (this.hasPerk("steelskin")) {
                reduceDamage(PerkProperties.steelskin.damageReduction);
            }

            const chest = GameObjectDefs.typeToDefSafe(this.chest) as ChestDef | undefined;
            if (chest && !isHeadShot) {
                reduceDamage(chest.damageReduction);
            }

            const helmet = GameObjectDefs.typeToDefSafe(this.helmet) as HelmetDef | undefined;
            if (helmet) {
                reduceDamage(helmet.damageReduction * (isHeadShot ? 1 : 0.3));
            }
        }

        if (this._health - finalDamage < 0) {
            if (this.hasPerk("lifeline")) {
                // Checks to see if the perk can mitigate the damage
                const excessDamage = finalDamage - this._health + 1; // Amount to mitigate to survive on 1 health.
                if (this.boost / PerkProperties.lifeline.conversionRate >= excessDamage) {
                    this.boost -= excessDamage * PerkProperties.lifeline.conversionRate;
                    finalDamage = this._health - 1;
                    this.lastStandEffect = true;
                    this.lastStandEffectTicker = 1;
                    this.setDirty();
                } else {
                    // If the perk cannot mitigate, kill the player
                    finalDamage = this.health;
                }
            } else {
                // If the player lacks the perk, kill the player
                finalDamage = this.health;
            }
        }

        this.damageTaken += finalDamage;
        if (playerSource && params.source !== this) {
            if (playerSource.groupId !== this.groupId) {
                playerSource.damageDealt += finalDamage;
                playerSource.questManager.trackEvent("damage", {
                    amount: finalDamage,
                    weaponType: params.gameSourceType ?? "",
                });
            }
            this.lastDamagedBy = playerSource;
        }

        this.health -= finalDamage;

        if (this.game.isTeamMode) {
            this.setGroupStatuses();
        }

        if (this._health === 0) {
            if (!this.downed && this.hasPerk("self_revive")) {
                this.down(params);
            } else {
                this.game.modeManager.handlePlayerDeath(this, params);
            }
        }
    }

    /**
     * adds gameover message to "this.msgsToSend" for the player and all their spectators
     */
    addGameOverMsg(winningTeamId: number = 0): void {
        this.questManager.flushProgress(winningTeamId);

        const aliveCount = this.game.modeManager.aliveCount();
        const teamRank = winningTeamId == this.teamId ? 1 : aliveCount + 1;

        if (this.game.modeManager.showStatsMsg(this)) {
            const statsMsg = new net.PlayerStatsMsg();
            statsMsg.playerStats = this;
            this.client.sendMsg(net.MsgType.PlayerStats, statsMsg);
        } else {
            const gameOverMsg = new net.GameOverMsg();

            const statsArr: net.PlayerStatsMsg["playerStats"][] = this.game.modeManager.getGameoverPlayers(this);
            gameOverMsg.playerStats = statsArr;
            gameOverMsg.teamRank = teamRank; // gameover msg sent after alive count updated
            gameOverMsg.teamId = this.teamId;
            gameOverMsg.winningTeamId = winningTeamId;
            gameOverMsg.gameOver = !!winningTeamId;
            this.client.sendMsg(net.MsgType.GameOver, gameOverMsg);

            for (const spectator of this.spectators) {
                spectator.sendMsg(net.MsgType.GameOver, gameOverMsg);
            }
        }
    }

    downedBy: Player | undefined;
    /** downs a player */
    down(params: DamageParams): void {
        this.downed = true;
        this.downedCount++;
        this.downedDamageTicker = GameConfig.player.downedDamageBuffer;
        this.boost = 0;
        this.health = 100;

        v2.set(this.vel, v2.mul(params.dir, 10));

        if (this.game.gas.currentRad <= 0.1) {
            this.health = 50;
        }

        if (this.weaponManager.cookingThrowable) {
            this.weaponManager.throwThrowable(true);
        }

        this.animType = GameConfig.Anim.None;
        this.setDirty();

        this.shootStart = false;
        this.shootHold = false;
        this.cancelAction();

        this.weaponManager.throwThrowable();
        this.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Melee, true);

        if (this.weapons[GameConfig.WeaponSlot.Melee].type === "pan") {
            this.wearingPan = true;
        }

        //
        // Send downed msg
        //
        const downedMsg = new net.KillMsg();
        downedMsg.damageType = params.damageType;
        downedMsg.itemSourceType = params.gameSourceType ?? "";
        downedMsg.mapSourceType = params.mapSourceType ?? "";
        downedMsg.targetId = this.__id;
        downedMsg.downed = true;

        if (params.source?.__type === ObjectType.Player) {
            this.downedBy = params.source;
            downedMsg.killerId = params.source.__id;
            downedMsg.killCreditId = params.source.__id;
        }

        this.game.clientBarn.broadcastMsg(net.MsgType.Kill, downedMsg);

        // lone survivr can be given on knock or kill
        if (this.game.map.factionMode) {
            this.team!.checkAndApplyLastMan();
            this.team!.checkAndApplyCaptain();
        }
    }

    killedBy: Player | undefined;
    killedIds: number[] = [];

    kill(params: DamageParams): void {
        if (this.dead) return;
        if (this.downed) this.downed = false;
        this.dead = true;
        this.killedIndex = this.game.playerBarn.nextKilledNumber++;
        this.boost = 0;
        this.actionType = GameConfig.Action.None;
        this.actionSeq++;
        this.hasteType = GameConfig.HasteType.None;
        this.hasteSeq++;

        if (this.weaponManager.cookingThrowable) {
            this.weaponManager.throwThrowable(true);
        }
        this.animType = GameConfig.Anim.None;
        this.animSeq++;

        this.healEffect = false;
        this.lastStandEffect = false;
        this.boostDirty = true;
        this.inventoryDirty = true;
        this.setDirty();

        this.shootHold = false;

        this.mapIndicator?.kill();

        this.game.playerBarn.aliveCountDirty = true;

        util.removeFrom(this.game.playerBarn.livingPlayers, this);

        this.game.playerBarn.killedPlayers.push(this);

        this.group?.checkPlayers();

        if (this.team) {
            util.removeFrom(this.team.livingPlayers, this);
        }

        if (this.weaponManager.cookingThrowable) {
            this.weaponManager.throwThrowable(true);
        }

        //
        // Send kill msg
        //
        const killMsg = new net.KillMsg();
        killMsg.damageType = params.damageType;
        killMsg.itemSourceType = params.gameSourceType ?? "";
        killMsg.mapSourceType = params.mapSourceType ?? "";
        killMsg.targetId = this.__id;
        killMsg.killed = true;

        const killCreditSource = params.killCreditSource
            ? params.killCreditSource
            : params.source;
        if (killCreditSource?.__type === ObjectType.Player) {
            this.killedBy = killCreditSource;

            if (killCreditSource !== this && killCreditSource.teamId !== this.teamId) {
                killCreditSource.killedIds.push(this.matchDataId);
                killCreditSource.kills++;
                killCreditSource.questManager.trackEvent("kill", {
                    weaponType: params.gameSourceType ?? "",
                    buildingType: killCreditSource.currentBuildingType,
                });

                if (killCreditSource.isKillLeader) {
                    this.game.playerBarn.killLeaderDirty = true;
                }

                if (killCreditSource.hasPerk("takedown")) {
                    killCreditSource.health += 25;
                    killCreditSource.boost += 25;
                    killCreditSource.giveHaste(GameConfig.HasteType.Takedown, 3);
                }

                // Pirate's Bounty (Cutlass-specific)
                const weaponDef = GameObjectDefs.typeToDefSafe(params.gameSourceType || "");
                if (killCreditSource.hasPerk("pirate") && weaponDef?.type == "melee") {
                    const count = util.randomInt(3, 4);
                    for (let i = 0; i < count; i++) {
                        const item = this.game.lootBarn.getLootTable("tier_pirate");
                        if (!item) continue;

                        this.game.lootBarn.addLoot(
                            item.name,
                            this.pos,
                            this.layer,
                            item.count,
                            {
                                pushSpeed: util.random(7.5, 11),
                                dir: v2.randomUnit(),
                            },
                        );
                    }

                    // rare gun
                    if (Math.random() < 0.12) {
                        const item = this.game.lootBarn.getLootTable("tier_pirate_rare");
                        if (item) {
                            this.game.lootBarn.addLoot(
                                item.name,
                                this.pos,
                                this.layer,
                                item.count,
                                {
                                    pushSpeed: util.random(7.5, 11),
                                    dir: v2.randomUnit(),
                                },
                            );
                        }
                    }
                }

                if (killCreditSource.role === "woods_king") {
                    this.game.playerBarn.addMapPing("ping_woodsking", this.pos);
                }
            }

            // "secret" interaction: when all 4 lone perks are equipped, don't swap anymore
            const lonePerks = killCreditSource.hasPerk("takedown")
                && killCreditSource.hasPerk("steelskin")
                && killCreditSource.hasPerk("field_medic")
                && killCreditSource.hasPerk("splinter");

            if (killCreditSource.role === "classless") {
                const rolePerks = killCreditSource.perks.filter(
                    (perk) => perk.isFromRole,
                );
                const perkPool = PerkProperties.classless.perkPool;

                if (!lonePerks) {
                    if (rolePerks.length > 0 && perkPool.length > 0) {
                        const perkToReplace = util.randomItem(rolePerks).type;
                        const candidatePerks = perkPool.filter(
                            (p) => !killCreditSource.hasPerk(p),
                        );
                        const newPerk = util.randomItem(candidatePerks);

                        if (newPerk) {
                            killCreditSource.removePerk(perkToReplace);
                            killCreditSource.addPerk(newPerk, false, undefined, true);
                            killCreditSource.setDirty();
                        }
                    }
                }
            }
            killMsg.killCreditId = killCreditSource.__id;
            killMsg.killerKills = killCreditSource.kills;
        }

        if (params.source?.__type === ObjectType.Player) {
            killMsg.killerId = params.source.__id;
        }

        if (this.hasPerk("final_bugle")) {
            this.initLastBreath();
        }

        if (
            this.hasPerk("martyrdom")
            || this.role == "grenadier"
            || this.role == "demo"
        ) {
            this.game.projectileBarn.addSplitProjectiles(
                this.__id,
                "martyr_nade",
                this.pos,
                this.layer,
                v2.create(0, 0),
                12,
                5,
            );
        }

        if (this.game.map.factionMode) {
            // lone survivr can be given on knock or kill
            this.team!.checkAndApplyLastMan();
            this.team!.checkAndApplyCaptain();

            // golden airdrops depend on alive counts, so we only do this logic on kill
            if (this.game.planeBarn.isOneTeamWinning()) {
                this.game.planeBarn.helpLosingTeam();
            }
        }

        // params.gameSourceType check ensures player didnt die by bleeding out
        if (
            this.game.map.potatoMode
            && this.lastDamagedBy
            && params.damageType === GameConfig.DamageType.Player
            && params.source !== this
        ) {
            this.lastDamagedBy.randomWeaponSwap(params);
        }

        this.game.clientBarn.broadcastMsg(net.MsgType.Kill, killMsg);

        if (this.role) {
            const roleMsg = new net.RoleAnnouncementMsg();
            roleMsg.role = this.role;
            roleMsg.assigned = false;
            roleMsg.killed = true;
            roleMsg.playerId = this.__id;
            roleMsg.killerId = params.source?.__id ?? 0;
            this.game.clientBarn.broadcastMsg(net.MsgType.RoleAnnouncement, roleMsg);
        }

        if (this.isKillLeader && this.role !== "the_hunted") {
            const roleMsg = new net.RoleAnnouncementMsg();
            roleMsg.role = "kill_leader";
            roleMsg.assigned = false;
            roleMsg.killed = true;
            roleMsg.playerId = this.__id;
            roleMsg.killerId = params.source?.__id ?? 0;
            this.game.clientBarn.broadcastMsg(net.MsgType.RoleAnnouncement, roleMsg);
        }

        if (this.game.map.mapDef.gameMode.killLeaderEnabled) {
            const killLeader = this.game.playerBarn.killLeader;

            let killLeaderKills = 0;

            if (killLeader && !killLeader.dead) {
                killLeaderKills = killLeader.kills;
            }

            const newKillLeader = this.game.playerBarn.getPlayerWithHighestKills();
            if (
                killLeader !== newKillLeader
                && killCreditSource
                && newKillLeader === killCreditSource
                && newKillLeader.kills > killLeaderKills
            ) {
                if (killLeader && killLeader.role === "the_hunted") {
                    killLeader.removeRole();
                }

                killCreditSource.promoteToKillLeader();
            }
        }

        if (this.isKillLeader) {
            this.game.playerBarn.killLeader = undefined;
            this.game.playerBarn.killLeaderDirty = true;
            this.isKillLeader = false;

            // remove the role on savannah
            if (this.role === "the_hunted") {
                this.removeRole();
            }
        }

        this.game.deadBodyBarn.addDeadBody(this.pos, this.__id, this.layer, params.dir);

        //
        // Kill outfit obstacle
        //
        if (this.obstacleOutfit) {
            this.obstacleOutfit.kill(params);
        }

        //
        // drop loot
        //

        for (let i = 0; i < GameConfig.WeaponSlot.Count; i++) {
            const weap = this.weapons[i];
            if (!weap.type) continue;
            const def = GameObjectDefs.typeToDef(weap.type);
            switch (def.type) {
                case "gun":
                    this.weaponManager.dropGun(i);
                    weap.type = "";
                    break;
                case "melee":
                    if (def.noDropOnDeath || weap.type === "fists") break;
                    this.game.lootBarn.addLoot(weap.type, this.pos, this.layer, 1, {
                        pushSpeed: util.random(7.5, 11),
                        dir: v2.randomUnit(),
                    });
                    weap.type = "fists";
                    break;
                case "throwable":
                    weap.type = "";
                    break;
            }
        }
        this.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Melee);

        for (const item of Object.keys(this.invManager.items) as InventoryItem[]) {
            // const def = GameObjectDefs[item] as AmmoDef | HealDef;
            if (item == "1xscope") {
                continue;
            }

            const amount = this.invManager.get(item);
            if (amount > 0) {
                this.game.lootBarn.addLoot(item, this.pos, this.layer, amount, {
                    pushSpeed: util.random(7.5, 11),
                    dir: v2.randomUnit(),
                });
            }
        }

        for (const item of GEAR_TYPES) {
            const type = this[item];
            if (!type) continue;
            const def = GameObjectDefs.typeToDef(type) as HelmetDef | ChestDef | BackpackDef;
            if (!!(def as ChestDef).noDrop || def.level < 1) continue;
            this.game.lootBarn.addLoot(type, this.pos, this.layer, 1, {
                pushSpeed: util.random(7.5, 11),
                dir: v2.randomUnit(),
            });
        }

        if (this.outfit) {
            const def = GameObjectDefs.typeToDef(this.outfit, "outfit");
            if (!def.noDropOnDeath && !def.noDrop && this.outfit !== this.loadout.outfit) {
                this.game.lootBarn.addLoot(this.outfit, this.pos, this.layer, 1, {
                    pushSpeed: util.random(7.5, 11),
                    dir: v2.randomUnit(),
                });
            }
        }

        for (let i = this.perks.length - 1; i >= 0; i--) {
            const perk = this.perks[i];
            if (perk.droppable || perk.replaceOnDeath) {
                this.game.lootBarn.addLoot(
                    perk.replaceOnDeath || perk.type,
                    this.pos,
                    this.layer,
                    1,
                    {
                        pushSpeed: util.random(7.5, 11),
                        dir: v2.randomUnit(),
                    },
                );
            }
        }
        this._perks.length = 0;
        this._perkTypes.length = 0;

        // Wipe inventory
        this.invManager.wipeInventory();
        this.chest = "";
        this.helmet = "";
        this.backpack = "backpack00";
        this.weaponManager.showNextThrowable();

        // death emote
        this.sendDeathEmoteTicker = 0.3;

        // Building gore region (club pool)
        const objs = this.game.grid.intersectGameObject(this);
        for (const obj of objs) {
            if (
                obj.__type === ObjectType.Building
                && obj.goreRegion
                && util.sameLayer(this.layer, obj.layer)
                && coldet.testCircleAabb(
                    this.pos,
                    this.rad,
                    obj.goreRegion.min,
                    obj.goreRegion.max,
                )
            ) {
                obj.onGoreRegionKill();
            }
        }

        // Check for game over
        this.game.checkGameOver();

        // send data to parent process
        this.game.updateData();

        this.questManager.flushProgress();
    }

    getAliveKiller(): Player | undefined {
        let aliveKiller: Player | undefined = this.killedBy;
        const checkedPlayers = new Set<Player>();

        for (let i = 0; i < 80; i++) {
            if (!aliveKiller) return undefined;
            if (aliveKiller === this) return undefined;
            if (aliveKiller.killedBy === aliveKiller) return undefined;
            if (checkedPlayers.has(aliveKiller)) return undefined;

            if (!aliveKiller.dead) return aliveKiller;
            checkedPlayers.add(aliveKiller);

            aliveKiller = aliveKiller.killedBy;
        }
    }

    canDespawn() {
        // special check for 50v50
        // we dont want eg leaders to despawn a second after being promoted :p
        if (this.game.map.factionMode && this.role) return false;

        return (
            this.timeAlive < GameConfig.player.minActiveTime && !this.dead && !this.downed
        );
    }

    isReloading() {
        return (
            this.actionType == GameConfig.Action.Reload
            || this.actionType == GameConfig.Action.ReloadAlt
        );
    }

    isReviving() {
        return this.actionType == GameConfig.Action.Revive && !!this.action.targetId;
    }

    isBeingRevived() {
        if (!this.downed) return false;

        const normalRevive = this.actionType == GameConfig.Action.Revive && this.action.targetId == 0;
        if (normalRevive) return true;

        const numMedics = this.game.playerBarn.aoeHealPlayers.length;
        if (numMedics) {
            return this.game.playerBarn.aoeHealPlayers.some((medic) => {
                return medic != this && medic.isReviving() && this.isAffectedByAOE(medic);
            });
        }
        return false;
    }

    /** returns player to revive if can revive */
    getPlayerToRevive(): Player | undefined {
        if (this.actionType != GameConfig.Action.None) return undefined; // action in progress already

        if (this.downed && this.hasPerk("self_revive")) return this;

        if (!this.game.isTeamMode) return undefined; // no revives in solos
        if (this.downed) return undefined; // can't revive players while downed

        const nearbyDownedTeammates = this.game.grid
            .intersectCollider(
                collider.createCircle(this.pos, GameConfig.player.reviveRange),
            )
            .filter(
                (obj): obj is Player =>
                    obj.__type == ObjectType.Player
                    && obj.teamId == this.teamId
                    && obj.downed
                    // can't revive someone already being revived or self reviving (medic)
                    && obj.actionType != GameConfig.Action.Revive,
            );

        let playerToRevive: Player | undefined;
        let closestDist = Number.MAX_VALUE;
        for (const teammate of nearbyDownedTeammates) {
            if (!util.sameLayer(this.layer, teammate.layer)) {
                continue;
            }
            const dist = v2.distance(this.pos, teammate.pos);
            if (dist <= GameConfig.player.reviveRange && dist < closestDist) {
                playerToRevive = teammate;
                closestDist = dist;
            }
        }

        return playerToRevive;
    }

    revive(playerToRevive: Player | undefined) {
        if (!playerToRevive) return;

        this.playerBeingRevived = playerToRevive;
        playerToRevive.revivedBy = this;
        if (this.downed && this.hasPerk("self_revive")) {
            this.doAction(
                "",
                GameConfig.Action.Revive,
                GameConfig.player.reviveDuration,
                this.__id,
            );
        } else {
            playerToRevive.doAction(
                "",
                GameConfig.Action.Revive,
                GameConfig.player.reviveDuration,
            );
            this.doAction(
                "",
                GameConfig.Action.Revive,
                GameConfig.player.reviveDuration,
                playerToRevive.__id,
            );

            if (this.weaponManager.cookingThrowable) {
                this.weaponManager.throwThrowable(true);
            }
            this.playAnim(GameConfig.Anim.Revive, GameConfig.player.reviveDuration);
        }
    }

    isAffectedByAOE(medic: Player): boolean {
        const effectRange = medic.actionType == GameConfig.Action.Revive
            ? GameConfig.player.medicReviveRange
            : GameConfig.player.medicHealRange;

        return (
            medic.teamId == this.teamId
            && !!util.sameLayer(medic.layer, this.layer)
            && v2.lengthSqr(v2.sub(medic.pos, this.pos)) <= effectRange * effectRange
        );
    }

    /** for the medic role in 50v50 */
    getAOEPlayers(): Player[] {
        const effectRange = this.actionType == GameConfig.Action.Revive
            ? GameConfig.player.medicReviveRange
            : GameConfig.player.medicHealRange;

        return this.game.grid
            .intersectCollider(
                // includes self
                collider.createCircle(this.pos, effectRange),
            )
            .filter(
                (obj): obj is Player => obj.__type == ObjectType.Player && obj.isAffectedByAOE(this),
            );
    }

    useHealingItem(item: InventoryItem): void {
        const itemDef = GameObjectDefs.typeToDef(item, "heal");

        const hasAoeHeal = this.hasPerk("aoe_heal");
        if (
            (!hasAoeHeal && this.health == itemDef.maxHeal)
            || this.actionType == GameConfig.Action.UseItem
            || this.actionType == GameConfig.Action.Revive
            || this.weaponManager.cookingThrowable
        ) {
            return;
        }
        if (!this.invManager.has(item)) {
            return;
        }

        // medics always emote the healing/boost item they're using
        if (hasAoeHeal) {
            this.game.playerBarn.addEmote("emote_loot", this.__id, item);
        }

        this.cancelAction();
        this.doAction(
            item,
            GameConfig.Action.UseItem,
            (hasAoeHeal ? 0.75 : 1) * itemDef.useTime,
        );
    }

    applyActionFunc(actionFunc: (target: Player) => void): void {
        const hasAoeHeal = this.hasPerk("aoe_heal");

        if (hasAoeHeal) {
            let aoePlayers = this.getAOEPlayers();

            // aoe doesnt heal/give boost to downed players
            if (this.actionType == GameConfig.Action.UseItem) {
                aoePlayers = aoePlayers.filter((p) => !p.downed);
            }

            for (let i = 0; i < aoePlayers.length; i++) {
                const aoePlayer = aoePlayers[i];
                actionFunc(aoePlayer);
            }
        } else {
            const target = this.actionType === GameConfig.Action.Revive && this.playerBeingRevived
                ? this.playerBeingRevived
                : this;
            actionFunc(target);
        }
    }

    useBoostItem(item: InventoryItem): void {
        const itemDef = GameObjectDefs.typeToDef(item, "boost");

        if (
            this.actionType == GameConfig.Action.UseItem
            || this.actionType == GameConfig.Action.Revive
            || this.weaponManager.cookingThrowable
        ) {
            return;
        }
        if (!this.invManager.has(item)) {
            return;
        }
        const hasAoeHeal = this.hasPerk("aoe_heal");

        // medics always emote the healing/boost item they're using
        if (hasAoeHeal) {
            this.game.playerBarn.addEmote("emote_loot", this.__id, item);
        }

        this.cancelAction();
        this.doAction(
            item,
            GameConfig.Action.UseItem,
            (hasAoeHeal ? 0.75 : 1) * itemDef.useTime,
        );
    }

    moveLeft = false;
    moveRight = false;
    moveUp = false;
    moveDown = false;
    shootStart = false;
    shootHold = false;
    portrait = false;

    touchMoveActive = false;
    touchMoveDir = v2.create(1, 0);
    touchMoveLen = 255;
    toMouseDir = v2.create(1, 0);
    toMouseLen = 0;
    mousePos = v2.create(1, 0);

    shouldAcceptInput(input: Input): boolean {
        return (
            !this.downed
            || input === GameConfig.Input.Interact // Players can interact with obstacles while downed.
            || input === GameConfig.Input.Use // Players can interact with doors while downed.
            || (input === GameConfig.Input.Revive && this.hasPerk("self_revive")) // Players can revive themselves if they have the self-revive perk.
            || (input === GameConfig.Input.Cancel
                && (!this.revivedBy?.hasPerk("aoe_heal") // Players can cancel their own revives if they are not revived by aoe heal.
                    || this.revivedBy === this.playerBeingRevived)) // Players can cancel their own revives if they are reviving themselves.
        );
    }

    handleInput(msg: net.InputMsg): void {
        if (this.dead) return;
        if (this.game.map.perkMode && !this.role) return;

        this.dirNew = v2.normalizeSafe(msg.toMouseDir);

        this.moveLeft = msg.moveLeft;
        this.moveRight = msg.moveRight;
        this.moveUp = msg.moveUp;
        this.moveDown = msg.moveDown;

        this.touchMoveActive = msg.touchMoveActive;
        this.touchMoveDir = v2.normalizeSafe(msg.touchMoveDir);
        this.touchMoveLen = msg.touchMoveLen;
        this.toMouseLen = msg.toMouseLen;

        this.shootHold = msg.shootHold;

        if (msg.shootStart) {
            this.shootStart = true;
        }

        // HACK? client for some reason sends Interact followed by Cancel on mobile
        // so we ignore the cancel request when reviving a player
        let ignoreCancel = false;

        for (let i = 0; i < msg.inputs.length; i++) {
            const input = msg.inputs[i];
            if (!this.shouldAcceptInput(input)) continue;
            switch (input) {
                case GameConfig.Input.StowWeapons:
                case GameConfig.Input.EquipMelee:
                    this.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Melee);
                    break;
                case GameConfig.Input.EquipPrimary:
                    this.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Primary);
                    break;
                case GameConfig.Input.EquipSecondary:
                    this.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Secondary);
                    break;
                case GameConfig.Input.EquipThrowable:
                    if (this.curWeapIdx === GameConfig.WeaponSlot.Throwable) {
                        this.weaponManager.throwThrowable(true);
                        if (this.animType === GameConfig.Anim.Cook) {
                            this.cancelAnim();
                        }
                        this.weaponManager.showNextThrowable();
                    } else {
                        this.weaponManager.setCurWeapIndex(
                            GameConfig.WeaponSlot.Throwable,
                        );
                    }
                    break;
                case GameConfig.Input.EquipPrevWeap:
                case GameConfig.Input.EquipNextWeap:
                    {
                        function absMod(a: number, n: number): number {
                            return a >= 0 ? a % n : ((a % n) + n) % n;
                        }

                        const toAdd = input === GameConfig.Input.EquipNextWeap ? 1 : -1;

                        let iterations = 0;
                        let idx = this.curWeapIdx;
                        while (iterations < GameConfig.WeaponSlot.Count * 2) {
                            idx = absMod(idx + toAdd, GameConfig.WeaponSlot.Count);
                            if (this.weapons[idx].type) {
                                break;
                            }
                        }
                        this.weaponManager.setCurWeapIndex(idx);
                    }
                    break;
                case GameConfig.Input.EquipLastWeap:
                    this.weaponManager.setCurWeapIndex(this.weaponManager.lastWeaponIdx);
                    break;
                case GameConfig.Input.EquipOtherGun:
                    // priority list of slots to swap to
                    const slotTargets = [
                        GameConfig.WeaponSlot.Primary,
                        GameConfig.WeaponSlot.Secondary,
                        GameConfig.WeaponSlot.Melee,
                    ];

                    util.removeFrom(slotTargets, this.curWeapIdx);

                    for (let i = 0; i < slotTargets.length; i++) {
                        const slot = slotTargets[i];
                        if (this.weapons[slot].type) {
                            this.weaponManager.setCurWeapIndex(slot);
                            break;
                        }
                    }
                    break;
                case GameConfig.Input.Interact: {
                    const loot = this.getClosestLoot();
                    const obstacles = this.getInteractableObstacles();
                    const playerToRevive = this.getPlayerToRevive();

                    const canRevive = !this.downed || (this.downed && this.hasPerk("self_revive"));

                    const interactables = [
                        playerToRevive,
                        !this.downed && loot,
                        ...obstacles,
                    ];

                    for (let i = 0; i < interactables.length; i++) {
                        const interactable = interactables[i];
                        if (!interactable) continue;
                        if (interactable.__type === ObjectType.Player && canRevive) {
                            this.revive(playerToRevive);
                            ignoreCancel = true;
                        } else if (
                            interactable.__type === ObjectType.Loot
                            && !this.downed
                        ) {
                            this.interactWith(interactable);
                        } else {
                            this.interactWith(interactable);
                        }
                    }
                    break;
                }
                case GameConfig.Input.Revive: {
                    const playerToRevive = this.getPlayerToRevive();
                    this.revive(playerToRevive);
                    break;
                }
                case GameConfig.Input.Loot: {
                    const loot = this.getClosestLoot();
                    if (loot) {
                        this.interactWith(loot);
                    }
                    break;
                }
                case GameConfig.Input.Use: {
                    const obstacles = this.getInteractableObstacles();
                    for (let i = 0; i < obstacles.length; i++) {
                        obstacles[i].interact(this);
                    }
                    break;
                }
                case GameConfig.Input.Reload:
                    if (this.actionType !== GameConfig.Action.Revive) {
                        this.weaponManager.scheduledReload = true;
                    }
                    break;
                case GameConfig.Input.Cancel:
                    if (ignoreCancel) {
                        break;
                    }
                    this.cancelAction();
                    break;
                case GameConfig.Input.EquipNextScope: {
                    const scopeIdx = SCOPE_LEVELS.indexOf(this.scope);

                    for (let i = scopeIdx + 1; i < SCOPE_LEVELS.length; i++) {
                        const nextScope = SCOPE_LEVELS[i];

                        if (!this.invManager.has(nextScope as InventoryItem)) continue;
                        this.scope = nextScope;
                        this.inventoryDirty = true;
                        break;
                    }
                    break;
                }
                case GameConfig.Input.EquipPrevScope: {
                    const scopeIdx = SCOPE_LEVELS.indexOf(this.scope);

                    for (let i = scopeIdx - 1; i >= 0; i--) {
                        const prevScope = SCOPE_LEVELS[i];

                        if (!this.invManager.has(prevScope as InventoryItem)) continue;
                        this.scope = prevScope;
                        this.inventoryDirty = true;
                        break;
                    }
                    break;
                }
                case GameConfig.Input.SwapWeapSlots: {
                    this.weaponManager.swapWeaponSlots();
                    break;
                }
            }
        }

        // no exceptions for any perks or roles
        if (this.downed) return;

        if (!this.invManager.isValid(msg.useItem) || !this.invManager.has(msg.useItem)) {
            return;
        }
        const def = GameObjectDefs.typeToDef(msg.useItem);
        switch (def.type) {
            case "heal":
                this.useHealingItem(msg.useItem);
                break;
            case "boost":
                this.useBoostItem(msg.useItem);
                break;
            case "scope":
                if (this.invManager.has(msg.useItem)) {
                    this.scope = msg.useItem;
                    this.inventoryDirty = true;
                }
                break;
        }
    }

    getClosestLoot(): Loot | undefined {
        const objs = this.game.grid.intersectCollider(
            collider.createCircle(this.pos, this.rad + 5),
        );

        let closestLoot: Loot | undefined;
        let closestDist = Number.MAX_VALUE;

        for (let i = 0; i < objs.length; i++) {
            const loot = objs[i];
            if (loot.__type !== ObjectType.Loot) continue;
            if (loot.destroyed) continue;
            if (
                util.sameLayer(loot.layer, this.layer)
                && (loot.ownerId == 0 || loot.ownerId == this.__id)
            ) {
                const pos = loot.pos;
                const rad = this.isMobile
                    ? this.rad + loot.rad * GameConfig.player.touchLootRadMult
                    : this.rad + loot.rad;
                const toPlayer = v2.sub(this.pos, pos);
                const distSq = v2.lengthSqr(toPlayer);
                if (distSq < rad * rad && distSq < closestDist) {
                    closestDist = distSq;
                    closestLoot = loot;
                }
            }
        }

        return closestLoot;
    }

    getInteractableObstacles(): Obstacle[] {
        const objs = this.game.grid.intersectCollider(
            collider.createCircle(this.pos, this.rad + 5),
        );

        let obstacles: Array<{ pen: number; obstacle: Obstacle }> = [];

        for (let i = 0; i < objs.length; i++) {
            const obstacle = objs[i];
            if (obstacle.__type !== ObjectType.Obstacle) continue;
            if (!obstacle.dead && util.sameLayer(obstacle.layer, this.layer)) {
                if (obstacle.isButton && obstacle.button.isVat) {
                    const distance = v2.distance(this.pos, obstacle.pos);
                    if (distance + this.rad < obstacle.interactionRad * obstacle.scale) {
                        obstacles.push({
                            pen: 0,
                            obstacle,
                        });
                    }
                    continue;
                }

                if (obstacle.interactionRad > 0) {
                    const res = collider.intersectCircle(
                        obstacle.collider,
                        this.pos,
                        obstacle.interactionRad + this.rad,
                    );
                    if (res) {
                        obstacles.push({
                            pen: res.pen,
                            obstacle,
                        });
                    }
                }
            }
        }
        return obstacles.sort((a, b) => a.pen - b.pen).map((o) => o.obstacle);
    }

    interactWith(obj: GameObject): void {
        switch (obj.__type) {
            case ObjectType.Loot:
                this.pickupLoot(obj);
                break;
            case ObjectType.Obstacle:
                obj.interact(this);
                break;
        }
    }

    getPlayerStatus() {
        const players: Player[] = this.game.modeManager.getPlayerStatusPlayers(this)!;
        return players.map((p) => {
            const visible = p.teamId === this.teamId || p.timeUntilHidden > 0;
            return {
                hasData: visible || p.playerStatusDirty,
                pos: p.pos,
                visible,
                dead: p.dead,
                downed: p.downed,
                role: p.role,
            };
        });
    }

    getFreeGunSlot(obj: Loot) {
        const gunSlots = [GameConfig.WeaponSlot.Primary, GameConfig.WeaponSlot.Secondary];

        // first loop to find dual wieldable guns
        for (const slot of gunSlots) {
            const slotDef = GameObjectDefs.typeToDefSafe(this.weapons[slot].type) as GunDef | undefined;

            if (slotDef?.dualWieldType && obj.type === this.weapons[slot].type) {
                return {
                    slot,
                    isDual: true,
                    cause: net.PickupMsgType.Success,
                };
            }
        }

        // second loop to find empty slots
        for (const slot of gunSlots) {
            if (this.weapons[slot].type === "") {
                return {
                    slot,
                    isDual: false,
                    cause: net.PickupMsgType.Success,
                };
            }
        }

        // if none are found use active weapon if its a gun
        if (GameConfig.WeaponType[this.curWeapIdx] === "gun") {
            const newGunDef = GameObjectDefs.typeToDef(obj.type, "gun");
            return {
                slot: this.curWeapIdx,
                isDual: false,
                cause: this.activeWeapon === obj.type
                        || newGunDef.dualWieldType === this.weapons[this.curWeapIdx].type
                    ? net.PickupMsgType.AlreadyOwned
                    : net.PickupMsgType.Success,
            };
        }

        return {
            slot: null,
            isDual: false,
            cause: net.PickupMsgType.Full,
        };
    }

    pickupTicker = 0;
    pickupLoot(obj: Loot) {
        if (obj.destroyed) return;

        const def = GameObjectDefs.typeToDef(obj.type);
        if (
            (this.actionType == GameConfig.Action.UseItem && def.type != "gun")
            || this.actionType == GameConfig.Action.Revive
        ) {
            return;
        }

        if (this.pickupTicker > 0) return;
        this.pickupTicker = 0.1;
        let amountLeft = 0;
        let lootToAdd = obj.type;
        const pickupMsg = new net.PickupMsg();
        pickupMsg.item = obj.type;
        pickupMsg.type = net.PickupMsgType.Success;

        switch (def.type) {
            case "ammo":
            case "scope":
            case "heal":
            case "boost":
            case "throwable":
                {
                    const itemType = obj.type;
                    if (!this.invManager.isValid(itemType)) break;

                    const result = this.invManager.give(itemType, obj.count);

                    if (result.added <= 0) {
                        if (def.type === "scope") {
                            pickupMsg.type = net.PickupMsgType.AlreadyOwned;
                        } else {
                            pickupMsg.type = net.PickupMsgType.Full;
                        }
                    }

                    amountLeft = result.remaining;
                }
                break;
            case "melee":
                if (this.weapons[GameConfig.WeaponSlot.Melee].type === obj.type) {
                    pickupMsg.type = net.PickupMsgType.AlreadyEquipped;
                    amountLeft = 1;
                    break;
                }
                this.weaponManager.dropMelee();
                this.weaponManager.setWeapon(GameConfig.WeaponSlot.Melee, obj.type, 0);
                break;
            case "gun":
                {
                    amountLeft = 0;

                    const freeGunSlot = this.getFreeGunSlot(obj);
                    pickupMsg.type = freeGunSlot.cause;
                    let newGunIdx = freeGunSlot.slot;

                    if (newGunIdx === null) {
                        this.pickupTicker = 0;
                        return;
                    }

                    const oldWeapDef = GameObjectDefs.typeToDefSafe(this.weapons[newGunIdx].type) as
                        | GunDef
                        | undefined;
                    if (
                        oldWeapDef
                        && (oldWeapDef.noDrop || !this.weaponManager.canDropFlare(newGunIdx))
                    ) {
                        this.pickupTicker = 0;
                        return;
                    }

                    // if "preloaded" gun add ammo to inventory
                    if (obj.isPreloadedGun) {
                        this.invManager.giveAndDrop(
                            def.ammo as InventoryItem,
                            def.ammoSpawnCount,
                        );
                    }

                    if (freeGunSlot.cause === net.PickupMsgType.AlreadyOwned) {
                        amountLeft = 1;
                        break;
                    }

                    this.pickupTicker = 0.2;

                    let gunType = obj.type;

                    if (def.dualWieldType && freeGunSlot.isDual) {
                        gunType = def.dualWieldType;

                        // cancel reload when going from single to dual
                        if (this.curWeapIdx === newGunIdx && this.isReloading()) {
                            this.cancelAction();

                            if (this.weapons[newGunIdx].ammo <= 0) {
                                this.weaponManager.scheduledReload = true;
                            }
                        }
                    }

                    // replaces the gun

                    let newAmmo = 0;

                    if (oldWeapDef) {
                        newAmmo = oldWeapDef.dualWieldType === gunType
                            ? this.weapons[newGunIdx].ammo
                            : 0;

                        // inverted logic, there is only 1 case where the old gun should not drop
                        // when youre holding a pistol, and you pick up the same single pistol from the ground
                        // it should turn it into its dual pistol version and drop nothing
                        const shouldDrop = !(
                            oldWeapDef.dualWieldType // verifies it's a dual wieldable pistol
                            && this.weapons[newGunIdx].type == obj.type // verifies the old gun and new gun are the same
                        );
                        if (shouldDrop) {
                            this.weaponManager.dropGun(newGunIdx);
                        }
                    }

                    this.weaponManager.setWeapon(newGunIdx, gunType, newAmmo);

                    // always select primary slot if melee is selected
                    if (
                        !freeGunSlot.isDual
                        && this.curWeapIdx === GameConfig.WeaponSlot.Melee
                    ) {
                        this.weaponManager.setCurWeapIndex(newGunIdx); // primary
                    }
                }
                break;
            case "helmet":
            case "chest":
            case "backpack":
                {
                    const objLevel = this.getGearLevel(obj.type);
                    const thisType = this[def.type];
                    const thisDef = GameObjectDefs.typeToDefSafe(thisType);
                    const thisLevel = this.getGearLevel(thisType);
                    amountLeft = 1;

                    // role helmets and perk helmets can't be dropped in favor of another helmet, they're the "highest" tier
                    if (
                        def.type == "helmet"
                        && (this.hasRoleHelmet
                            || (thisDef && (thisDef as HelmetDef).perk)
                            || (thisDef && (thisDef as HelmetDef).role))
                    ) {
                        amountLeft = 1;
                        lootToAdd = obj.type;
                        pickupMsg.type = net.PickupMsgType.BetterItemEquipped;
                        break;
                    }

                    if (thisType === obj.type) {
                        lootToAdd = obj.type;
                        pickupMsg.type = net.PickupMsgType.AlreadyEquipped;
                    } else if (thisLevel <= objLevel) {
                        lootToAdd = thisType;
                        this[def.type] = obj.type;
                        pickupMsg.type = net.PickupMsgType.Success;

                        // removes roles/perks associated with the dropped role/perk helmet
                        if (thisDef && thisDef.type == "helmet" && thisDef.perk) {
                            this.removePerk(thisDef.perk);
                        }

                        if (thisDef && thisDef.type == "helmet" && thisDef.role) {
                            this.removeRole();
                        }

                        // adds roles/perks associated with the picked up role/perk helmet
                        if (def.type == "helmet" && def.role) {
                            this.promoteToRole(def.role);
                        }

                        if (def.type == "helmet" && def.perk) {
                            this.addPerk(def.perk);
                        }

                        this.setDirty();
                    } else {
                        lootToAdd = obj.type;
                        pickupMsg.type = net.PickupMsgType.BetterItemEquipped;
                    }
                    if (this.getGearLevel(lootToAdd) === 0) lootToAdd = "";
                }
                break;
            case "outfit":
                if (this.game.map.factionMode) {
                    if (def.teamId && this.teamId !== def.teamId) {
                        return;
                    }
                }
                if (this.role) {
                    const roleDef = GameObjectDefs.typeToDef(this.role, "role");
                    if (roleDef.defaultItems?.noDropOutfit) {
                        amountLeft = 1;
                        pickupMsg.type = net.PickupMsgType.BetterItemEquipped;
                        break;
                    }
                }

                if (this.outfit === obj.type) {
                    pickupMsg.type = net.PickupMsgType.AlreadyEquipped;
                    amountLeft = 1;
                    break;
                }

                amountLeft = 1;
                lootToAdd = this.outfit;
                pickupMsg.type = net.PickupMsgType.Success;
                this.setOutfit(obj.type);
                break;
            case "perk":
                let type = obj.type;

                const isMistery = type === "halloween_mystery";

                if (isMistery) {
                    type = this.game.lootBarn.getLootTable("tier_halloween_mystery_perks")
                        ?.name || type;
                }

                pickupMsg.item = type;

                if (this.hasPerk(obj.type)) {
                    amountLeft = 1;
                    pickupMsg.type = net.PickupMsgType.AlreadyEquipped;
                    break;
                }

                const emoteType = `emote_${type}`;
                if (GameObjectDefs.typeExists(`emote_${type}`)) {
                    this.game.playerBarn.addEmote(emoteType, this.__id);
                }

                const perkSlotType = this.perks.find(
                    (p) => p.droppable || p.replaceOnDeath === "halloween_mystery",
                )?.type;

                // The client can only show 4 perks in the UI.
                // If the player already has 4 or more perks, they cannot pick up a new one.
                if (!perkSlotType && this.perks.length >= 4) {
                    amountLeft = 1;
                    pickupMsg.type = net.PickupMsgType.MaxPerks;
                    break;
                }
                if (perkSlotType) {
                    amountLeft = 1;
                    lootToAdd = isMistery ? "" : perkSlotType;
                    this.removePerk(perkSlotType);
                    this.addPerk(
                        type,
                        !isMistery,
                        isMistery ? "halloween_mystery" : undefined,
                    );
                } else {
                    this.addPerk(
                        type,
                        !isMistery,
                        isMistery ? "halloween_mystery" : undefined,
                    );
                }
                this.setDirty();
                break;
        }

        const lootToAddDef = GameObjectDefs.typeToDefSafe(lootToAdd) as LootDef;
        if (
            amountLeft > 0
            && lootToAdd !== ""
            // if obj you tried picking up can't be picked up and needs to be dropped, "noDrop" is irrelevant
            && (obj.type == lootToAdd || !(lootToAddDef as ChestDef).noDrop)
        ) {
            this.game.lootBarn.addLoot(lootToAdd, obj.pos, obj.layer, amountLeft, {
                pushSpeed: util.random(4, 4.5),
                dir: v2.neg(this.dir),
                noSideAmmo: true,
            });
        }

        obj.destroy();
        this.client.sendMsg(net.MsgType.Pickup, pickupMsg);
    }

    // in original game, only called on snowball or potato collision
    dropRandomLoot(): void {
        // all possible droppable loot held by the player
        // 4 categories: inventory, weapons, armor, perks
        const playerLootTypes: string[] = [];

        for (const [type, count] of Object.entries(this.inventory)) {
            if (count == 0) continue;
            if (type == "1xscope") continue;
            playerLootTypes.push(type);
        }

        for (let i = 0; i < this.weapons.length; i++) {
            if (GameConfig.WeaponType[i] == "throwable") continue;
            const weapon = this.weapons[i];
            if (!weapon.type) continue;
            if (weapon.type == "fists") continue;
            const def = GameObjectDefs.typeToDef(weapon.type) as GunDef;
            if (def.noDrop) continue;
            playerLootTypes.push(weapon.type);
        }

        for (let i = 0; i < this.perks.length; i++) {
            const perk = this.perks[i];
            if (!perk.droppable) continue;
            playerLootTypes.push(perk.type);
        }

        for (const armor of [this.helmet, this.chest] as const) {
            if (!armor) continue;
            if ((GameObjectDefs.typeToDef(armor) as ChestDef | HelmetDef).noDrop) continue;
            playerLootTypes.push(armor);
        }

        if (playerLootTypes.length == 0) return;

        const item = util.randomItem(playerLootTypes);
        const weapIdx = this.weapons.findIndex((w) => w.type == item);

        const dropMsg = new net.DropItemMsg();
        dropMsg.item = item;
        dropMsg.weapIdx = weapIdx;
        this.dropItem(dropMsg);
    }

    /** just used in potato mode, swaps oldWeapon with a random weapon of the same type (mosin -> m9) */
    randomWeaponSwap(params: DamageParams): void {
        if (this.dead) return;
        if (this.role === "last_man") return;
        const oldWeapon = params.weaponSourceType || params.gameSourceType;
        if (!oldWeapon) return;

        const oldWeaponDef = GameObjectDefs.typeToDef(oldWeapon) as
            | GunDef
            | ThrowableDef
            | MeleeDef;

        if (oldWeaponDef.noPotatoSwap) return;
        const weaponDefs = WeaponTypeToDefs[oldWeaponDef.type];
        // necessary for type safety since Object.entries() is not type safe and just returns "any"
        const enumerableDefs = Object.entries(weaponDefs) as [
            string,
            GunDef | ThrowableDef | MeleeDef,
        ][];

        const filterCb: ([_type, def]: [
            string,
            GunDef | ThrowableDef | MeleeDef,
        ]) => boolean = this.hasPerk("rare_potato")
            ? ([_type, def]) => !def.noPotatoSwap && def.quality == PerkProperties.rare_potato.quality
            : ([_type, def]) => !def.noPotatoSwap;

        const weaponChoices = enumerableDefs.filter(filterCb);
        const [chosenWeaponType, chosenWeaponDef] = util.randomItem(weaponChoices);

        let index;
        if (this.activeWeapon === oldWeapon) {
            index = this.curWeapIdx;
        } else {
            index = this.weaponManager.weapons.findIndex((w) => w.type == oldWeapon);
        }

        if (index == -1) {
            // defaults if we can't figure out what slot was used to "trigger" the weapon swap
            switch (oldWeaponDef.type) {
                case "gun":
                    // arbitrary choice
                    index = GameConfig.WeaponSlot.Primary;
                    break;
                case "melee":
                    index = GameConfig.WeaponSlot.Melee;
                    break;
                case "throwable":
                    index = GameConfig.WeaponSlot.Throwable;
                    break;
            }
        }

        const slotDef = GameObjectDefs.typeToDefSafe(this.weapons[index].type) as
            | GunDef
            | MeleeDef
            | ThrowableDef;
        if (slotDef && slotDef.noPotatoSwap) return;

        if (index === this.curWeapIdx && this.isReloading()) {
            this.cancelAction();
        }

        switch (chosenWeaponDef.type) {
            case "gun":
                this.weaponManager.setWeapon(
                    index,
                    chosenWeaponType,
                    this.weaponManager.getAmmoStats(chosenWeaponDef).maxClip,
                );
                break;
            case "melee":
                this.weaponManager.setWeapon(index, chosenWeaponType, 0);
                break;
            case "throwable":
                if (!this.weaponManager.cookingThrowable) {
                    this.weaponManager.setWeapon(index, chosenWeaponType, 0);
                }
                break;
        }

        if ("switchDelay" in chosenWeaponDef) {
            this.weaponManager.weapons[index].cooldown = chosenWeaponDef.switchDelay;
        }

        if (chosenWeaponDef.type == "gun") {
            const ammo = math.max(
                chosenWeaponDef.ammoSpawnCount - chosenWeaponDef.maxClip,
                0,
            );

            this.invManager.give(chosenWeaponDef.ammo as InventoryItem, ammo);

            if (index === this.curWeapIdx) {
                this.shotSlowdownTimer = 0;
            }
        } else if (
            chosenWeaponDef.type == "throwable"
            && this.invManager.isValid(chosenWeaponType)
        ) {
            const bagSpace = this.invManager.getMaxCapacity(chosenWeaponType) ?? 0;

            this.invManager.give(chosenWeaponType, math.max(Math.floor(bagSpace / 3), 1));
            this.inventoryDirty = true;
        }

        this.setDirty();

        this.game.playerBarn.addEmote("emote_loot", this.__id, chosenWeaponType);
    }

    dropLoot(type: string, count = 1, useCountForAmmo?: boolean) {
        this.mobileDropTicker = 3;
        this.game.lootBarn.addLoot(type, this.pos, this.layer, count, {
            useCountForAmmo,
            pushSpeed: util.random(7.5, 11),
            dir: v2.neg(this.dir),
            source: "player",
        });
    }

    dropArmor(item: string): boolean {
        const armorDef = GameObjectDefs.typeToDef(item);
        if (armorDef.type != "chest" && armorDef.type != "helmet") return false;
        if (this[armorDef.type] !== item) return false;
        if (armorDef.noDrop) return false;

        if (armorDef.type == "helmet" && armorDef.role && this.role == armorDef.role) {
            this.removeRole();
            this.hasRoleHelmet = false;
        }

        if (armorDef.type == "helmet" && armorDef.perk && this.hasPerk(armorDef.perk)) {
            this.removePerk(armorDef.perk);
        }

        this.dropLoot(item, 1);
        this[armorDef.type] = "";
        this.setDirty();
        return true;
    }

    dropBackPackCopy(item: string): boolean {
        const armorDef = GameObjectDefs.typeToDef(item);
        if (armorDef.type != "backpack") return false;
        if (this[armorDef.type] !== item) return false;
        if (armorDef.level == 0) return false;

        this.dropLoot(item, 1);
        return true;
    }

    splitUpLoot(item: string, amount: number) {
        const dropCount = Math.floor(amount / 60);
        for (let i = 0; i < dropCount; i++) {
            this.dropLoot(item, 60);
        }
        if (amount % 60 !== 0) {
            this.dropLoot(item, amount % 60);
        }
    }

    dropItem(dropMsg: net.DropItemMsg): void {
        if (this.dead) return;
        if (this.game.map.perkMode && !this.role) return;

        const itemDef = GameObjectDefs.typeToDefSafe(dropMsg.item) as LootDef | undefined;
        if (!itemDef) return;

        dropMsg.weapIdx = math.clamp(dropMsg.weapIdx, 0, GameConfig.WeaponSlot.Count - 1);

        switch (itemDef.type) {
            case "chest":
            case "helmet": {
                this.dropArmor(dropMsg.item);
                break;
            }
            case "gun":
                if (this.weaponManager.canDropFlare(dropMsg.weapIdx)) {
                    this.weaponManager.dropGun(dropMsg.weapIdx);
                }
                break;
            case "melee":
                this.weaponManager.dropMelee();
                break;
            case "perk": {
                const perkSlotType = this.perks.find(
                    (p) => p.droppable && p.type === dropMsg.item,
                )?.type;
                if (perkSlotType && perkSlotType === dropMsg.item) {
                    this.dropLoot(dropMsg.item);
                    this.removePerk(dropMsg.item);
                    this.setDirty();
                }
                break;
            }
        }

        if (this.invManager.isValid(dropMsg.item)) {
            this.dropInventoryItem(dropMsg.item);
        }

        const reloading = this.isReloading();
        this.cancelAction();

        if (reloading && this.weapons[this.curWeapIdx].ammo === 0) {
            this.weaponManager.scheduledReload = true;
        }
    }

    dropInventoryItem(item: InventoryItem) {
        if (!this.invManager.has(item)) return;
        const inventoryCount = this.invManager.get(item);

        const itemDef = GameObjectDefs.typeToDef(item);
        switch (itemDef.type) {
            case "ammo": {
                let amountToDrop = math.max(1, Math.floor(inventoryCount / 2));

                if (itemDef.minStackSize && inventoryCount <= itemDef.minStackSize) {
                    amountToDrop = math.min(itemDef.minStackSize, inventoryCount);
                } else if (inventoryCount <= 5) {
                    amountToDrop = math.min(5, inventoryCount);
                }

                this.splitUpLoot(item, amountToDrop);
                this.invManager.take(item, amountToDrop);
                break;
            }
            case "scope": {
                this.dropLoot(item, 1);
                this.invManager.take(item, 1);
                break;
            }
            case "heal":
            case "boost": {
                let amountToDrop = math.max(1, Math.floor(inventoryCount / 2));

                this.invManager.take(item, amountToDrop);

                this.dropLoot(item, amountToDrop);
                break;
            }
            case "throwable": {
                if (this.weaponManager.cookingThrowable) break;

                const amountToDrop = Math.max(1, Math.floor(inventoryCount / 2));
                this.splitUpLoot(item, amountToDrop);

                this.invManager.take(item, amountToDrop);
                break;
            }
        }
    }

    setLoadout(loadout: net.JoinMsg["loadout"], useDefaultUnlocks?: boolean) {
        const defaltUnlocks = UnlockDefs.unlock_default.unlocks;
        /**
         * Checks if an item is present in the player's loadout
         */
        const isItemInLoadout = (item: string, category: string) => {
            if (useDefaultUnlocks && !defaltUnlocks.includes(item)) return false;

            const def = GameObjectDefs.typeToDefSafe(item);
            if (!def || def.type !== category) return false;

            return true;
        };

        if (
            isItemInLoadout(loadout.outfit, "outfit")
            && loadout.outfit !== "outfitBase"
        ) {
            this.setOutfit(loadout.outfit);
            this.loadout.outfit = this.outfit;
        }

        if (isItemInLoadout(loadout.melee, "melee") && loadout.melee != "fists") {
            this.weapons[GameConfig.WeaponSlot.Melee].type = loadout.melee;
        }

        if (isItemInLoadout(loadout.heal, "heal_effect")) {
            this.loadout.heal = loadout.heal;
        }
        if (isItemInLoadout(loadout.boost, "boost_effect")) {
            this.loadout.boost = loadout.boost;
        }

        const emotes = loadout.emotes;
        for (let i = 0; i < emotes.length; i++) {
            const emote = emotes[i];
            if (i > GameConfig.EmoteSlot.Count) break;

            if (emote === "" || !isItemInLoadout(emote, "emote")) {
                continue;
            }

            this.loadout.emotes[i] = emote;
        }
    }

    emoteFromMsg(msg: net.EmoteMsg) {
        if (this.dead) return;
        if (this.game.map.perkMode && !this.role) return;
        if (this.emoteHardTicker > 0) return;

        const emoteMsg = msg as net.EmoteMsg;

        const emoteIdx = this.loadout.emotes.indexOf(emoteMsg.type);
        const emoteDef = GameObjectDefs.typeToDefSafe(emoteMsg.type);
        if (!emoteDef) return;

        if (emoteMsg.isPing) {
            if (this.debug.teleportToPings) {
                v2.set(this.pos, msg.pos);
                this.setPartDirty();
                this.game.grid.updateObject(this);
            }

            if (emoteDef.type !== "ping") {
                return;
            }
            if (emoteDef.mapEvent) {
                return;
            }

            this.game.playerBarn.addMapPing(emoteMsg.type, emoteMsg.pos, this.__id);
        } else {
            if (emoteDef.type !== "emote") {
                return;
            }

            if (!emoteDef.teamOnly && (emoteIdx < 0 || emoteIdx > 3)) {
                return;
            }

            if (emoteDef.teamOnly) {
                this.game.playerBarn.addEmote(emoteMsg.type, this.__id);
            } else {
                this.emoteFromSlot(emoteIdx);
            }
        }

        this.emoteCounter++;
        if (this.emoteCounter >= GameConfig.player.emoteThreshold) {
            this.emoteHardTicker = this.emoteHardTicker > 0
                ? this.emoteHardTicker
                : GameConfig.player.emoteHardCooldown * 1.5;
        }
    }

    processEditMsg(msg: net.EditMsg) {
        if (!Config.debug.allowEditMsg) return;

        if (msg.loadNewMap) {
            this.game.map.regenerate(msg.newMapSeed);
        }

        this.debug.zoomEnabled = msg.zoomEnabled;

        this.debug.zoom = msg.zoom;

        this.debug.speedEnabled = msg.speedEnabled;
        this.debug.speed = math.clamp(msg.speed, 1, 10000);

        this.game.debugSpeedMulti = msg.gameSpeedEnabled ? msg.gameSpeed : 1;

        // only accept ground or underground
        if (msg.toggleLayer) {
            this.layer = this.layer > 0 ? 0 : 1;
            this.setDirty();
        }

        this.debug.noClip = msg.noClip;
        this.debug.teleportToPings = msg.teleportToPings;
        this.debug.godMode = msg.godMode;

        this.debug.moveObjMode.enabled = msg.moveObjs;

        this.game.preventStart = msg.preventGameStart;

        if (msg.spawnLootType) {
            const def = GameObjectDefs.typeToDefSafe(msg.spawnLootType);
            if (def && "lootImg" in def) {
                let count = 1;
                if (this.invManager.isValid(msg.spawnLootType)) {
                    count = this.invManager.getMaxCapacity(msg.spawnLootType);
                }
                this.game.lootBarn.addLoot(
                    msg.spawnLootType,
                    this.pos,
                    this.layer,
                    count,
                    {
                        useCountForAmmo: false,
                        pushSpeed: 0,
                    },
                );
            }
        }

        if (msg.promoteToRole) {
            if (msg.promoteToRoleType) {
                const def = GameObjectDefs.typeToDefSafe(msg.promoteToRoleType);
                if (def?.type === "role") {
                    this.promoteToRole(msg.promoteToRoleType);
                }
            } else if (this.role) {
                this.removeRole();
            }
        }

        if (msg.godMode) {
            this.health = 100;
            this.setDirty();
        }
    }

    doAction(
        actionItem: string,
        actionType: number,
        duration: number,
        targetId: number = 0,
    ) {
        if (this.actionDirty) {
            // action already in progress
            return;
        }

        this.action.targetId = targetId;
        this.action.duration = duration;
        this.action.time = 0;

        this.actionDirty = true;
        this.actionItem = actionItem;
        this.actionType = actionType;
        this.actionSeq++;
        this.setDirty();
    }

    cancelAction(): void {
        if (this.actionType === GameConfig.Action.None) {
            return;
        }

        // If player is reviving a player and this is called, cancel their action
        if (this.playerBeingRevived) {
            const revivedPlayer = this.playerBeingRevived;
            this.playerBeingRevived = undefined;
            if (revivedPlayer == this.revivedBy) {
                this.revivedBy = undefined;
            } else {
                revivedPlayer.revivedBy = undefined;
                revivedPlayer.cancelAction();
                this.cancelAnim();
            }
        }

        // If player is being revived and this is called, cancel the reviver's action
        if (this.revivedBy) {
            const revivingPlayer = this.revivedBy;
            this.revivedBy = undefined;
            if (revivingPlayer.playerBeingRevived) {
                revivingPlayer.playerBeingRevived = undefined;
                revivingPlayer.cancelAction();
                revivingPlayer.cancelAnim();
            }
        }

        this.action.duration = 0;
        this.action.targetId = 0;
        this.action.time = 0;

        this.actionItem = "";
        this.actionType = GameConfig.Action.None;
        this.actionSeq++;
        this.actionDirty = false;
        this.setDirty();
    }

    freeze(type: string, frozenOri: number, duration: number): void {
        this.frozenTicker = duration;
        this.frozen = true;
        this.frozenType = type;
        this.frozenOri = frozenOri;
        this.setDirty();
    }

    initLastBreath(): void {
        this.game.bulletBarn.fireBullet({
            dir: this.dir,
            pos: this.pos,
            bulletType: "bullet_invis",
            gameSourceType: "bugle",
            layer: this.layer,
            damageMult: 1,
            damageType: GameConfig.DamageType.Player,
            playerId: this.__id,
            shotAlt: true,
            shotFx: true,
        });

        const affectedPlayers = this.game.modeManager.getNearbyAlivePlayersContext(
            this,
            60,
        );

        for (const player of affectedPlayers) {
            player.lastBreathActive = true;
            player._lastBreathTicker = 5;

            player.giveHaste(GameConfig.HasteType.Inspire, 5);
            if (player.teamId == GameConfig.FactionTeam.Red && player.__id != this.__id) {
                this.game.playerBarn.addEmote("emote_bugle_final_red", player.__id);
            }
            if (player.teamId == GameConfig.FactionTeam.Blue && player.__id != this.__id) {
                this.game.playerBarn.addEmote("emote_bugle_final_blue", player.__id);
            }
            player.recalculateScale();
        }
    }

    playBugle(): void {
        this.bugleTickerActive = true;
        this._bugleTicker = 8;

        const affectedPlayers = this.game.modeManager.getNearbyAlivePlayersContext(
            this,
            30,
        );

        for (const player of affectedPlayers) {
            player.giveHaste(GameConfig.HasteType.Inspire, 3);
            if (player.teamId == GameConfig.FactionTeam.Red && player.__id != this.__id) {
                this.game.playerBarn.addEmote("emote_bugle_inspiration_red", player.__id);
            }
            if (player.teamId == GameConfig.FactionTeam.Blue && player.__id != this.__id) {
                this.game.playerBarn.addEmote(
                    "emote_bugle_inspiration_blue",
                    player.__id,
                );
            }
        }
    }

    incrementFat() {
        this.fatTicker = 2.5;
        if (this.fatModifier > 0.6) return;
        this.fatModifier += 0.06;
        this.recalculateScale();
    }

    decrementViewDistance() {
        this.viewDistModifier += 1.5;
        this.viewDistModifier = math.min(this.viewDistModifier, 32);
        this.viewDistTicker = 2.5;
        this.zoomDirty = true;
    }

    giveHaste(type: HasteType, duration: number): void {
        this.hasteType = type;
        this.hasteSeq++;
        this._hasteTicker = duration;
        this.setDirty();
    }

    playAnim(type: Anim, duration: number): void {
        this.animType = type;
        this.animSeq++;
        this.setDirty();
        this._animTicker = duration;
    }

    cancelAnim(): void {
        this.animType = GameConfig.Anim.None;
        this.animSeq++;
        this._animTicker = 0;
        this.setDirty();
    }

    emoteFromSlot(slot: EmoteSlot) {
        let emote = this.loadout.emotes[slot];

        if (!emote) return;

        if (this.game.map.potatoMode) {
            emote = "emote_potato";
        }

        if (this.game.map.potatoMode && this.game.map.factionMode) {
            if (this.teamId === GameConfig.FactionTeam.Red) {
                emote = "emote_tomato";
            } else if (this.teamId === GameConfig.FactionTeam.Blue) {
                emote = "emote_potato";
            }
        }

        this.game.playerBarn.addEmote(emote, this.__id);
    }

    recalculateScale() {
        let scale = 1;
        for (let i = 0; i < this.perks.length; i++) {
            const perk = this.perks[i].type;
            const perkProps = PerkProperties[perk as keyof typeof PerkProperties];
            if (typeof perkProps === "object" && "scale" in perkProps) {
                scale += perkProps.scale as number;
            }
        }

        if (this.lastBreathActive) {
            scale += PerkProperties.final_bugle.scaleOnDeath;
        }

        scale += this.fatModifier;

        scale = math.clamp(
            scale,
            net.Constants.PlayerMinScale,
            net.Constants.PlayerMaxScale,
        );

        if (scale === this.scale) return;

        this.scale = scale;

        this.collider.rad = this.rad;

        this.bounds = collider.createAabbExtents(
            v2.create(0, 0),
            v2.create(
                GameConfig.player.maxVisualRadius * this.scale,
                GameConfig.player.maxVisualRadius * this.scale,
            ),
        );

        this.setDirty();
    }

    recalculateMinBoost() {
        this.minBoost = 0;
        for (let i = 0; i < this.perks.length; i++) {
            const perk = this.perks[i].type;
            const perkProps = PerkProperties[perk as keyof typeof PerkProperties];
            if (typeof perkProps === "object" && "minBoost" in perkProps) {
                this.minBoost = math.max(perkProps.minBoost as number, this.minBoost);
            }
        }
    }

    recalculateSpeed(hasTreeClimbing: boolean): void {
        if (this.debug.speedEnabled) {
            this.speed = this.debug.speed;
        } else if (this.actionType == GameConfig.Action.Revive) {
            // prevents self reviving players from getting an unnecessary speed boost
            if (this.action.targetId && !(this.downed && this.hasPerk("self_revive"))) {
                // player reviving
                this.speed = GameConfig.player.downedMoveSpeed + 2; // not specified in game config so i just estimated
            } else {
                // player being revived
                this.speed = GameConfig.player.downedRezMoveSpeed;
            }
        } else if (this.downed) {
            this.speed = GameConfig.player.downedMoveSpeed;
        } else {
            this.speed = GameConfig.player.moveSpeed;
        }

        // if melee is selected increase speed
        const weaponDef = GameObjectDefs.typeToDef(this.activeWeapon) as
            | GunDef
            | MeleeDef
            | ThrowableDef;
        if (this.weaponManager.meleeAttacks.length == 0) {
            let equipSpeed = weaponDef.speed.equip;
            if (this.hasPerk("small_arms") && weaponDef.type == "gun") {
                equipSpeed = 1;
            }

            this.speed += equipSpeed;
        }

        if (this.shotSlowdownTimer > 0 && weaponDef.speed.attack !== undefined) {
            this.speed += weaponDef.speed.attack;
        }

        // if player is on water decrease speed
        const isOnWater = this.game.map.isOnWater(this.pos, this.layer);
        if (isOnWater) {
            this.speed -= hasTreeClimbing
                ? -PerkProperties.tree_climbing.waterSpeedBoost
                : GameConfig.player.waterSpeedPenalty;
        }

        // increase speed when adrenaline is above 50%
        if (this.boost >= 50) {
            this.speed += GameConfig.player.boostMoveSpeed;
        }

        if (this.animType === GameConfig.Anim.Cook) {
            this.speed -= GameConfig.player.cookSpeedPenalty;
        }

        if (this.hasteType != GameConfig.HasteType.None) {
            this.speed += GameConfig.player.hasteSpeedBonus;
        }

        if (this.frozen) {
            this.speed -= GameConfig.player.frozenSpeedPenalty;
        }

        const hasFieldMedic = this.hasPerk("field_medic");
        // decrease speed if shooting or popping adren or heals
        // field_medic perk doesn't slow you down while you heal
        if (
            this.shotSlowdownTimer > 0
            || (!hasFieldMedic && this.actionType == GameConfig.Action.UseItem)
        ) {
            this.speed *= 0.5;
        }

        if (hasFieldMedic && this.actionType == GameConfig.Action.UseItem) {
            this.speed += PerkProperties.field_medic.speedBoost;
        }

        this.speed = math.clamp(this.speed, 1, 10000);
    }
}
