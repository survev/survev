import {
    GameObjectDefs,
    type LootDef,
    WeaponTypeToDefs,
} from "../../../../shared/defs/gameObjectDefs";
import { type EmoteDef, EmotesDefs } from "../../../../shared/defs/gameObjects/emoteDefs";
import {
    type BackpackDef,
    type BoostDef,
    type ChestDef,
    GEAR_TYPES,
    type HealDef,
    type HelmetDef,
    SCOPE_LEVELS,
    type ScopeDef,
} from "../../../../shared/defs/gameObjects/gearDefs";
import type { GunDef } from "../../../../shared/defs/gameObjects/gunDefs";
import type { MeleeDef } from "../../../../shared/defs/gameObjects/meleeDefs";
import type { OutfitDef } from "../../../../shared/defs/gameObjects/outfitDefs";
import { PerkProperties } from "../../../../shared/defs/gameObjects/perkDefs";
import type { RoleDef } from "../../../../shared/defs/gameObjects/roleDefs";
import type { ThrowableDef } from "../../../../shared/defs/gameObjects/throwableDefs";
import { UnlockDefs } from "../../../../shared/defs/gameObjects/unlockDefs";
import {
    type Action,
    type Anim,
    EmoteSlot,
    GameConfig,
    type HasteType,
} from "../../../../shared/gameConfig";
import * as net from "../../../../shared/net/net";
import { ObjectType } from "../../../../shared/net/objectSerializeFns";
import type { GroupStatus } from "../../../../shared/net/updateMsg";
import { type Circle, coldet } from "../../../../shared/utils/coldet";
import { collider } from "../../../../shared/utils/collider";
import type { Loadout } from "../../../../shared/utils/loadout";
import { math } from "../../../../shared/utils/math";
import { assert, util } from "../../../../shared/utils/util";
import { type Vec2, v2 } from "../../../../shared/utils/v2";
import { Config } from "../../config";
import { IDAllocator } from "../../utils/IDAllocator";
import { validateUserName } from "../../utils/serverHelpers";
import type { Game, JoinTokenData } from "../game";
import { Group } from "../group";
import { Team } from "../team";
import { throwableList, WeaponManager } from "../weaponManager";
import type { Building } from "./building";
import { BaseGameObject, type DamageParams, type GameObject } from "./gameObject";
import type { Loot } from "./loot";
import type { MapIndicator } from "./mapIndicator";
import type { Obstacle } from "./obstacle";
import type { Structure } from "./structure";

type GodMode = {
    isGodMode: boolean;
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

export class PlayerBarn {
    players: Player[] = [];
    livingPlayers: Player[] = [];
    newPlayers: Player[] = [];
    deletedPlayers: number[] = [];
    killedPlayers: Player[] = [];
    groupIdAllocator = new IDAllocator(8);
    aliveCountDirty = false;

    socketIdToPlayer = new Map<string, Player>();

    emotes: Emote[] = [];

    killLeaderDirty = false;
    killLeader?: Player;

    medics: Player[] = [];

    scheduledRoles: Array<{
        role: string;
        time: number;
    }> = [];

    sendWinEmoteTicker = 0;
    sentWinEmotes = false;

    teams: Team[] = [];
    groups: Group[] = [];
    groupsByHash = new Map<string, Group>();

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
    }

    randomPlayer(player?: Player) {
        const livingPlayers = player
            ? this.livingPlayers.filter((p) => p != player)
            : this.livingPlayers;
        return livingPlayers[util.randomInt(0, livingPlayers.length - 1)];
    }

    addPlayer(socketId: string, joinMsg: net.JoinMsg, ip: string) {
        const joinData = this.game.joinTokens.get(joinMsg.matchPriv);

        if (!joinData || joinData.expiresAt < Date.now()) {
            this.game.closeSocket(socketId);
            if (joinData) {
                this.game.joinTokens.delete(joinMsg.matchPriv);
            }
            return;
        }
        this.game.joinTokens.delete(joinMsg.matchPriv);

        if (Config.rateLimitsEnabled) {
            const count = this.livingPlayers.filter(
                (p) =>
                    p.ip === ip ||
                    p.findGameIp == joinData.findGameIp ||
                    (joinData.userId !== null && p.userId === joinData.userId),
            );
            if (count.length >= 3) {
                this.game.closeSocket(socketId, "rate_limited");
                return;
            }
        }

        if (joinMsg.protocol !== GameConfig.protocolVersion) {
            this.game.closeSocket(socketId, "index-invalid-protocol");
            return;
        }

        const result = this.getGroupAndTeam(joinData);
        const group = result?.group;
        // solo 50v50 just chooses the smallest team everytime no matter what
        const team =
            this.game.map.factionMode && !this.game.isTeamMode
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

            while (this.game.playerBarn.players.find((p) => p.name === finalName)) {
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
            finalName,
            socketId,
            joinMsg,
            ip,
            joinData.findGameIp,
            joinData.userId,
            joinData.loadout,
        );

        this.socketIdToPlayer.set(socketId, player);

        if (team && group) {
            team.addPlayer(player);
            group.addPlayer(player);
        } else if (!team && group) {
            group.addPlayer(player);
            player.teamId = group.groupId;
        } else if (team && !group) {
            team.addPlayer(player);
            player.groupId = this.groupIdAllocator.getNextId();
        } else {
            player.groupId = this.groupIdAllocator.getNextId();
            player.teamId = player.groupId;
        }
        if (player.game.map.factionMode) {
            player.playerStatusDirty = true;
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
        if (!this.game.modeManager.isSolo) {
            this.livingPlayers.sort((a, b) => a.teamId - b.teamId);
        }
        this.aliveCountDirty = true;
        this.game.pluginManager.emit("playerJoin", player);

        this.game.updateData();

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

                    const randomPlayer =
                        promotablePlayers[
                            util.randomInt(0, promotablePlayers.length - 1)
                        ];
                    randomPlayer.promoteToRole(scheduledRole.role);
                }
            }
        }
    }

    removePlayer(player: Player) {
        this.players.splice(this.players.indexOf(player), 1);
        const livingIdx = this.livingPlayers.indexOf(player);
        if (livingIdx !== -1) {
            this.livingPlayers.splice(livingIdx, 1);
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
                this.groups.splice(this.groups.indexOf(player.group), 1);
                this.groupsByHash.delete(player.group.hash);
            }
        }
        if (this.game.isTeamMode) {
            this.livingPlayers.sort((a, b) => a.teamId - b.teamId);
        }

        player.obstacleOutfit?.destroy();

        this.game.checkGameOver();
        this.game.updateData();
    }

    sendMsgs() {
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (player.disconnected) continue;
            player.sendMsgs();
        }
    }

    flush() {
        this.newPlayers.length = 0;
        this.deletedPlayers.length = 0;
        this.emotes.length = 0;
        this.aliveCountDirty = false;
        this.killLeaderDirty = false;

        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            player.healthDirty = false;
            player.boostDirty = false;
            player.zoomDirty = false;
            player.actionDirty = false;
            player.inventoryDirty = false;
            player.weapsDirty = false;
            player.spectatorCountDirty = false;
            player.activeIdDirty = false;
            player.groupStatusDirty = false;
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
            '"roles" property is undefined in chosen map definition, cannot call this function',
        );

        const rolesToSchedule = roles.timings.filter(
            (timing) => this.game.gas.circleIdx == timing.circleIdx,
        );

        for (let i = 0; i < rolesToSchedule.length; i++) {
            const roleObj = rolesToSchedule[i];
            const roleStr =
                roleObj.role instanceof Function ? roleObj.role() : roleObj.role;
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
    }

    getGroupAndTeam({ groupData }: JoinTokenData):
        | {
              group?: Group;
              team?: Team;
          }
        | undefined {
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

    dir = v2.create(0, 0);

    posOld = v2.create(0, 0);
    dirOld = v2.create(0, 0);

    collider: Circle;

    healthDirty = true;
    boostDirty = true;
    zoomDirty = true;
    actionDirty = false;
    inventoryDirty = true;
    weapsDirty = true;
    spectatorCountDirty = false;
    activeIdDirty = true;
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
    playerStatusTicker = 0;

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

    shotSlowdownTimer: number = 0;

    freeSwitchTimer: number = 0;

    indoors = false;
    insideZoomRegion = false;

    private _zoom: number = 0;

    get zoom(): number {
        return this._zoom;
    }

    set zoom(zoom: number) {
        if (zoom === this._zoom) return;
        assert(zoom !== 0);
        this._zoom = zoom;
        this.zoomDirty = true;
    }
    cullingZoom = 0;

    scopeZoomRadius: Record<string, number>;

    scope = "1xscope";

    inventory: Record<string, number> = {};

    get bagSizes() {
        return this.game.playerBarn.bagSizes;
    }

    get curWeapIdx() {
        return this.weaponManager.curWeapIdx;
    }

    weapons: WeaponManager["weapons"];

    get activeWeapon() {
        return this.weaponManager.activeWeapon;
    }

    private _disconnected = false;

    get disconnected(): boolean {
        return this._disconnected;
    }

    set disconnected(disconnected: boolean) {
        if (this.disconnected === disconnected) return;

        this._disconnected = disconnected;
        this.setGroupStatuses();
    }

    private _spectatorCount = 0;
    set spectatorCount(spectatorCount: number) {
        if (this._spectatorCount === spectatorCount) return;
        this._spectatorCount = spectatorCount;
        this._spectatorCount = math.clamp(this._spectatorCount, 0, 255); // byte size limit
        this.spectatorCountDirty = true;
    }

    get spectatorCount(): number {
        return this._spectatorCount;
    }

    /** true when player starts spectating new player, only stays true for that given tick */
    startedSpectating: boolean = false;

    private _spectating?: Player;

    get spectating(): Player | undefined {
        return this._spectating;
    }

    set spectating(player: Player | undefined) {
        if (player === this) {
            throw new Error(
                `Player ${player.name} tried spectate themselves (how tf did this happen?)`,
            );
        }
        if (this._spectating === player) return;

        if (this._spectating) {
            this._spectating.spectatorCount--;
            this._spectating.spectators.delete(this);
        }
        if (player) {
            player.spectatorCount++;
            player.spectators.add(this);
        }

        this._spectating = player;
        this.startedSpectating = true;
    }

    spectators = new Set<Player>();

    outfit = "outfitBase";

    setOutfit(outfit: string) {
        if (this.outfit === outfit) return;
        this.outfit = outfit;
        const def = GameObjectDefs[outfit] as OutfitDef;
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
        return (GameObjectDefs[type] as BackpackDef | HelmetDef | ChestDef).level;
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
    private _animCb?: () => void;

    distSinceLastCrawl = 0;

    actionType: Action = GameConfig.Action.None;
    actionSeq = 0;
    action = { time: 0, duration: 0, targetId: 0 };

    timeUntilHidden = -1; // for showing on enemy minimap in 50v50

    /**
     * specifically for reloading single shot guns to keep reloading until maxClip is reached
     */
    reloadAgain = false;

    wearingPan = false;
    healEffect = false;
    // if hit by snowball or potato, slowed down for "x" seconds
    frozenTicker = 0;
    frozen = false;
    frozenOri = 0;

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
    fabricateThrowablesLeft = 0;

    // "Gabby Ghost" perk random emojis
    chattyTicker = 0;

    mapIndicator?: MapIndicator;

    // spud gun variables

    fatModifier = 0;
    fatTicker = 0;

    promoteToRole(role: string) {
        const roleDef = GameObjectDefs[role] as RoleDef;
        if (!roleDef || roleDef.type !== "role") {
            this.game.logger.warn(`Invalid role type: ${role}`);
            return;
        }

        if (role === "leader") {
            this.hasFiredFlare = false;
            this.flareTimer = 15;
        }

        if (this.role == "medic") {
            const index = this.game.playerBarn.medics.indexOf(this);
            if (index != -1) this.game.playerBarn.medics.splice(index, 1);
        }
        if (this.role === role) return;

        // switching from one role to another
        // need to delete any non-droppables so they can be overwritten
        if (this.role) {
            if (this.helmet && (GameObjectDefs[this.helmet] as HelmetDef).noDrop)
                this.helmet = "";
            if (this.chest && (GameObjectDefs[this.chest] as ChestDef).noDrop)
                this.chest = "";
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
        this.game.broadcastMsg(net.MsgType.RoleAnnouncement, msg);

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
            case "medic":
                // TODO: this should be based on aoe_heal perk not role
                this.game.playerBarn.medics.push(this);
                break;
        }

        if (roleDef.defaultItems) {
            // for non faction modes where teamId > 2, just cycles between blue and red teamId
            const clampedTeamId = ((this.teamId - 1) % 2) + 1;

            // inventory and scope
            for (const [key, value] of Object.entries(roleDef.defaultItems.inventory)) {
                if (value == 0) continue; // prevents overwriting existing inventory

                // only sets scope if scope in inventory is higher than current scope
                const invDef = GameObjectDefs[key];
                if (
                    invDef.type == "scope" &&
                    invDef.level > (GameObjectDefs[this.scope] as ScopeDef).level
                ) {
                    this.scope = key;
                }

                this.inventory[key] = value;
            }

            // outfit
            const newOutfit = roleDef.defaultItems.outfit;
            if (newOutfit instanceof Function) {
                this.setOutfit(newOutfit(clampedTeamId));
            } else {
                // string
                if (newOutfit) this.setOutfit(newOutfit);
            }

            const roleHelmet =
                roleDef.defaultItems.helmet instanceof Function
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
            if (roleDef.defaultItems.backpack) {
                this.backpack = roleDef.defaultItems.backpack;
            }

            // weapons
            for (let i = 0; i < roleDef.defaultItems.weapons.length; i++) {
                const weaponOrWeaponFunc = roleDef.defaultItems.weapons[i];
                const trueWeapon =
                    weaponOrWeaponFunc instanceof Function
                        ? weaponOrWeaponFunc(clampedTeamId)
                        : weaponOrWeaponFunc;

                if (!trueWeapon.type) {
                    // prevents overwriting existing weapons
                    if (!this.weapons[i].type) {
                        continue;
                    }

                    const curWeapDef = GameObjectDefs[this.weapons[i].type];
                    if (curWeapDef.type == "gun") {
                        // refills the ammo of the existing weapon
                        this.weapons[i].ammo = this.weaponManager.getTrueAmmoStats(
                            curWeapDef as GunDef,
                        ).trueMaxClip;
                    }
                    continue;
                }

                const trueWeapDef = GameObjectDefs[trueWeapon.type] as LootDef;
                if (trueWeapDef && trueWeapDef.type == "gun") {
                    if (this.weapons[i].type) this.weaponManager.dropGun(i);

                    if (trueWeapon.fillInv) {
                        const ammoType = trueWeapDef.ammo;
                        this.inventory[ammoType] =
                            this.bagSizes[ammoType][this.getGearLevel(this.backpack)];
                    }
                } else if (trueWeapDef && trueWeapDef.type == "melee") {
                    if (this.weapons[i].type) this.weaponManager.dropMelee();
                }
                this.weaponManager.setWeapon(i, trueWeapon.type, trueWeapon.ammo);
            }
        }

        // we first need to build a list of the new perks to add
        const newPerks = new Set<string>();
        if (roleDef.perks) {
            for (let i = 0; i < roleDef.perks.length; i++) {
                const perkOrPerkFunc = roleDef.perks[i];
                const perkType =
                    typeof perkOrPerkFunc === "string"
                        ? perkOrPerkFunc
                        : perkOrPerkFunc();

                newPerks.add(perkType);
            }
        }
        // then remove perks from the old role
        // but skip perks we are about to add again and remove them from the list
        // so they both aren't removed to just be added again
        // and aren't added twice
        for (let i = 0; i < this.perks.length; i++) {
            const perkType = this.perks[i].type;
            if (this.perks[i].isFromRole) {
                if (!newPerks.has(perkType)) {
                    this.removePerk(perkType);
                    i--;
                } else {
                    newPerks.delete(perkType);
                }
            }
        }

        for (const perk of newPerks) {
            this.addPerk(perk, false, undefined, true);
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
        const def = GameObjectDefs[this.role] as RoleDef;
        if (!def) return;
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
            this.game.broadcastMsg(net.MsgType.RoleAnnouncement, msg);
        }
    }

    lastBreathActive = false;
    private _lastBreathTicker = 0;

    bugleTickerActive = false;
    private _bugleTicker = 0;

    perks: Array<{
        type: string;
        droppable: boolean;
        replaceOnDeath?: string;
        isFromRole?: boolean;
    }> = [];

    perkTypes: string[] = [];

    addPerk(
        type: string,
        droppable = false,
        replaceOnDeath?: string,
        isFromRole?: boolean,
    ) {
        this.perks.push({
            type,
            droppable,
            replaceOnDeath,
            isFromRole,
        });
        this.perkTypes.push(type);

        if (type === "trick_m9") {
            const ammo = this.weaponManager.getTrueAmmoStats(
                GameObjectDefs["m9_cursed"] as GunDef,
            );
            this.weaponManager.setWeapon(
                GameConfig.WeaponSlot.Secondary,
                "m9_cursed",
                ammo.trueMaxClip,
            );
        } else if (type === "fabricate") {
            this.fabricateRefillTicker = PerkProperties.fabricate.refillInterval;
        }

        this.recalculateScale();
        this.recalculateMinBoost();
    }

    removePerk(type: string): void {
        const idx = this.perks.findIndex((perk) => perk.type === type);
        this.perks.splice(idx, 1);
        this.perkTypes.splice(this.perkTypes.indexOf(type), 1);

        if (type === "trick_m9") {
            const slot = this.weapons.findIndex((weap) => {
                return weap.type === "m9_cursed";
            });
            if (slot !== -1) {
                this.weaponManager.setWeapon(slot, "", 0);
            }
        } else if (type === "fabricate") {
            this.fabricateRefillTicker = 0;
        } else if (type === "firepower") {
            for (let i = 0; i < this.weapons.length; i++) {
                const weap = this.weapons[i];
                const def = GameObjectDefs[weap.type];
                if (def?.type !== "gun") continue;
                const ammo = this.weaponManager.getTrueAmmoStats(def);

                weap.ammo = math.min(weap.ammo, ammo.trueMaxClip);
                this.weapsDirty = true;
            }
        }

        this.recalculateScale();
        this.recalculateMinBoost();
    }

    hasPerk(type: string) {
        return this.perkTypes.includes(type);
    }

    hasActivePan() {
        return (
            this.wearingPan ||
            (this.activeWeapon == "pan" && this.animType !== GameConfig.Anim.Melee)
        );
    }

    getPanSegment() {
        const panSurface = this.wearingPan ? "unequipped" : "equipped";
        let surface = (GameObjectDefs.pan as MeleeDef).reflectSurface![panSurface];

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

    socketId: string;

    ack = 0;

    name: string;
    isMobile: boolean;

    bot: boolean;

    debug = {
        zoomOverride: GameConfig.scopeZoomRadius["desktop"]["1xscope"],
        overrideZoom: false,
        zoomOverrideCulling: false,
        /** only overrides base speed so modifiers like haste and freeze still apply */
        baseSpeedOverride: -1,
        spectatorMode: false,
        /** drag and drop loot, obstacles, and buildings */
        godMode: <GodMode>{
            isGodMode: false,
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
        heal: "heal_basic",
        boost: "boost_basic",
        emotes: [...GameConfig.defaultEmoteLoadout],
    };

    emoteSoftTicker = 0;
    emoteHardTicker = 0;
    emoteCounter = 0;

    damageTaken = 0;
    damageDealt = 0;

    // infinity since we aren't dead yet ;)
    // this is used for sorting and getting player ranks
    // first player to die is 0, second is 1 etc
    killedIndex = Infinity;

    kills = 0;
    timeAlive = 0;

    msgsToSend: Array<{ type: number; msg: net.Msg }> = [];

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

    userId: string | null = null;
    ip: string;
    // see comment on server/src/api/schema.ts
    // about logging find_game IP's
    findGameIp: string;

    constructor(
        game: Game,
        pos: Vec2,
        layer: number,
        name: string,
        socketId: string,
        joinMsg: net.JoinMsg,
        ip: string,
        findGameIp: string,
        userId: string | null,
        loadout?: Loadout,
    ) {
        super(game, pos);

        this.matchDataId = game.playerBarn.nextMatchDataId++;

        this.layer = layer;

        this.name = name;
        this.socketId = socketId;
        this.ip = ip;
        this.findGameIp = findGameIp;
        this.userId = userId;

        this.isMobile = joinMsg.isMobile;

        this.weapons = this.weaponManager.weapons;

        this.bot = Config.debug.allowBots && joinMsg.bot;

        let defaultItems = GameConfig.player.defaultItems;

        if (!this.bot) {
            defaultItems = this.game.playerBarn.defaultItems;
        }

        // createCircle clones the position
        // so set it manually to link both
        this.collider = collider.createCircle(this.pos, this.rad);
        this.collider.pos = this.pos;

        this.scopeZoomRadius =
            GameConfig.scopeZoomRadius[this.isMobile ? "mobile" : "desktop"];

        this.zoom = this.scopeZoomRadius[this.scope];

        function assertType(type: string, category: string, acceptNoItem: boolean) {
            if (!type && acceptNoItem) return;
            const def = GameObjectDefs[type];
            assert(def, `Invalid item type for ${category}: ${type}`);
            assert(
                def.type === category,
                `Invalid type ${type}, expected ${category} item`,
            );
        }

        for (let i = 0; i < GameConfig.WeaponSlot.Count; i++) {
            const weap = defaultItems.weapons[i];
            let type = weap.type || this.weapons[i].type;
            if (!type) continue;
            assertType(type, GameConfig.WeaponType[i], true);
            this.weaponManager.setWeapon(i, type, weap.ammo ?? 0);
        }

        for (const key in this.bagSizes) {
            this.inventory[key] = defaultItems.inventory[key] ?? 0;
        }

        this.chest = defaultItems.chest;
        assertType(this.chest, "chest", true);

        this.scope = defaultItems.scope;
        assertType(this.scope, "scope", false);
        this.inventory[this.scope] = 1;

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

        this.setLoadout(loadout ? loadout : joinMsg.loadout, !loadout);

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

        if (this.game.map.factionMode) {
            this.timeUntilHidden -= dt;
        }

        if (this.role === "leader" && !this.hasFiredFlare && this.flareTimer > 0) {
            this.flareTimer -= dt;
            if (this.flareTimer <= 0) {
                const flareGunIndex = this.weapons.findIndex(
                    (w) => w.type === "flare_gun" || w.type === "flare_gun_dual",
                );
                if (flareGunIndex !== -1) {
                    this.weaponManager.setCurWeapIndex(flareGunIndex);
                    this.weaponManager.fireWeapon(false, true);
                    this.hasFiredFlare = true;
                    this.flareTimer = 0;
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
                const randomRole = roleChoices[util.randomInt(0, roleChoices.length - 1)];
                this.roleSelect(randomRole);
            }
        }

        // players are still choosing a perk from the perk select menu
        if (this.game.map.perkMode && !this.role) return;

        //
        // Boost logic
        //
        if (!this.downed) {
            if (this.boost > 0 && this.boost <= 25) this.health += 0.5 * dt;
            else if (this.boost >= 25 && this.boost <= 50) this.health += 1.25 * dt;
            else if (this.boost >= 50 && this.boost <= 87.5) this.health += 1.5 * dt;
            else if (this.boost >= 87.5 && this.boost <= 100) this.health += 1.75 * dt;

            this.boost -= 0.375 * dt;

            this.boost = math.clamp(this.boost, this.minBoost, 100);
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
        if (
            this.game.modeManager.isReviving(this) ||
            this.game.modeManager.isBeingRevived(this)
        ) {
            // cancel revive if either player goes out of range or if player being revived dies
            if (
                this.playerBeingRevived &&
                (v2.distance(this.pos, this.playerBeingRevived.pos) >
                    GameConfig.player.reviveRange ||
                    this.playerBeingRevived.dead)
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
            this.emoteCounter >= GameConfig.player.emoteThreshold &&
            this.emoteHardTicker > 0.0
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
            ((this.downed && this.actionType == GameConfig.Action.None) ||
                this.hasPerk("trick_drain")) &&
            this.bleedTicker < 0
        ) {
            const hasDrain = this.hasPerk("trick_drain");
            this.bleedTicker = hasDrain
                ? GameConfig.player.bleedTickRate * 3
                : GameConfig.player.bleedTickRate;

            const mapConfig = this.game.map.mapDef.gameConfig;

            const bleedDamageMult = mapConfig.bleedDamageMult;

            const multiplier =
                bleedDamageMult != 1 ? this.downedCount * bleedDamageMult : 1;

            let damage = hasDrain ? 1 : mapConfig.bleedDamage * multiplier;
            this.damage({
                amount: damage,
                damageType: GameConfig.DamageType.Bleeding,
                dir: this.dir,
            });
        }

        this.chattyTicker -= dt;

        if (this.hasPerk("trick_chatty") && this.chattyTicker < 0) {
            this.chattyTicker = util.random(5, 15);

            const emotes = Object.keys(EmotesDefs);

            this.game.playerBarn.addEmote(
                emotes[Math.floor(Math.random() * emotes.length)],
                this.__id,
            );
        }

        if (this.game.gas.doDamage && this.game.gas.isInGas(this.pos)) {
            this.damage({
                amount: this.game.gas.damage,
                damageType: GameConfig.DamageType.Gas,
                dir: this.dir,
            });
        }

        if (this.reloadAgain && this.actionType !== GameConfig.Action.Revive) {
            this.reloadAgain = false;
            this.weaponManager.scheduleReload();
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
                    const itemDef = GameObjectDefs[this.actionItem] as HealDef | BoostDef;
                    if ("heal" in itemDef) {
                        this.applyActionFunc((target: Player) => {
                            target.health += itemDef.heal;
                        });
                    }
                    if ("boost" in itemDef) {
                        this.applyActionFunc((target: Player) => {
                            target.boost += itemDef.boost;
                        });
                    }
                    this.inventory[this.actionItem]--;
                    this.inventoryDirty = true;
                } else if (this.isReloading()) {
                    this.weaponManager.reload();
                } else if (
                    this.actionType === GameConfig.Action.Revive &&
                    this.playerBeingRevived
                ) {
                    this.applyActionFunc((target: Player) => {
                        if (!target.downed) return;
                        target.downed = false;
                        target.downedDamageTicker = 0;
                        target.health = GameConfig.player.reviveHealth;

                        // checks 2 conditions in one, player has pan AND has it selected
                        if (target.weapons[target.curWeapIdx].type === "pan") {
                            target.wearingPan = false;
                        }

                        target.setDirty();
                        target.setGroupStatuses();
                        this.game.pluginManager.emit("playerRevived", target);
                    });
                }

                // Prevent cancelAction from being called by revived players at the end of revive
                if (!this.revivedBy || this.playerBeingRevived == this.revivedBy) {
                    this.cancelAction();
                }

                if (
                    (this.curWeapIdx == GameConfig.WeaponSlot.Primary ||
                        this.curWeapIdx == GameConfig.WeaponSlot.Secondary) &&
                    this.weapons[this.curWeapIdx].ammo == 0 &&
                    this.actionType !== GameConfig.Action.Revive
                ) {
                    this.weaponManager.scheduleReload();
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
                this._animCb?.();
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
                        bugle.ammo <
                        this.weaponManager.getTrueAmmoStats(
                            GameObjectDefs["bugle"] as GunDef,
                        ).trueMaxClip
                    ) {
                        this.bugleTickerActive = true;
                        this._bugleTicker = 8;
                    }
                }
                this.weapsDirty = true;
            }
        }

        if (this.game.isTeamMode || this.game.map.factionMode) {
            this.playerStatusTicker += dt;
            for (const spectator of this.spectators) {
                spectator.playerStatusTicker += dt;
            }
        }

        if (this.hasPerk("fabricate")) {
            if (this.fabricateThrowablesLeft > 0) {
                this.fabricateGiveTicker -= dt;
                if (this.fabricateGiveTicker < 0) {
                    this.fabricateGiveTicker = PerkProperties.fabricate.giveInterval;
                    this.inventory["frag"]++;
                    this.inventoryDirty = true;
                    this.fabricateThrowablesLeft--;

                    const msg = new net.PickupMsg();
                    msg.type = net.PickupMsgType.Success;
                    msg.item = "frag";
                    msg.count = 1;

                    if (
                        !this.weaponManager.weapons[GameConfig.WeaponSlot.Throwable].type
                    ) {
                        this.weaponManager.showNextThrowable();
                    }

                    this.msgsToSend.push({ type: net.MsgType.Pickup, msg });
                }
            }

            this.fabricateRefillTicker -= dt;
            if (this.fabricateRefillTicker <= 0) {
                const backpackLevel = this.getGearLevel(this.backpack);
                const throwablesToGive = math.max(
                    this.bagSizes["frag"][backpackLevel] - this.inventory["frag"],
                    0,
                );
                this.fabricateThrowablesLeft = throwablesToGive;
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

        this.posOld = v2.copy(this.pos);

        const hasTreeClimbing = this.hasPerk("tree_climbing");

        let steps: number;
        if (movement.x !== 0 || movement.y !== 0) {
            this.recalculateSpeed(hasTreeClimbing);
            steps = Math.round(math.max(this.speed * dt + 5, 5));
        } else {
            this.speed = 0;
            steps = 1;
        }
        this.moveVel = v2.mul(movement, this.speed);

        const speedToAdd = (this.speed / steps) * dt;

        const circle = collider.createCircle(
            this.pos,
            GameConfig.player.maxVisualRadius * this.scale + this.speed * dt,
        );
        // can't collide with objects in spectator mode
        const objs = this.debug.spectatorMode
            ? // so spectators can go underground, need to be able to interact with stairs
              this.game.grid
                  .intersectCollider(circle)
                  .filter(
                      (o): o is Structure =>
                          o.__type == ObjectType.Structure && o.stairs.length != 0,
                  )
            : this.game.grid.intersectCollider(circle);

        for (let i = 0; i < steps; i++) {
            v2.set(this.pos, v2.add(this.pos, v2.mul(movement, speedToAdd)));

            for (let j = 0; j < objs.length; j++) {
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
            this.group?.players[0] === this &&
            this.game.canJoin &&
            this.group.players.length < this.group.maxPlayers
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
        if (this.isMobile && this.mobileDropTicker <= 0 && !this.downed) {
            const closestLoot = this.getClosestLoot();

            if (closestLoot) {
                const itemDef = GameObjectDefs[closestLoot.type];
                switch (itemDef.type) {
                    case "gun":
                        const freeSlot = this.getFreeGunSlot(closestLoot);
                        if (
                            freeSlot.slot &&
                            freeSlot.slot !== this.curWeapIdx &&
                            !this.weapons[freeSlot.slot].type
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
                        if (!this.perks.find((perk) => perk.droppable)) {
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
                            this.bagSizes[closestLoot.type] &&
                            this.inventory[closestLoot.type] >=
                                this.bagSizes[closestLoot.type][
                                    this.getGearLevel(this.backpack)
                                ]
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
        let lowestZoom = this.scopeZoomRadius["1xscope"];

        this.indoors = false;

        /*
         * checking when a player leaves a heal region is a pain,
         * so we just set healEffect to false by default and set it to true when theyre inside a heal region
         */
        const oldHealEffect = this.healEffect;
        this.healEffect = false;

        let zoomRegionZoom = lowestZoom;
        let insideNoZoomRegion = true;
        let insideSmoke = false;
        // building player is currently inside of
        let occupiedBuilding: Building | undefined;

        for (let i = 0; i < objs.length; i++) {
            const obj = objs[i];
            if (obj.__type === ObjectType.Building) {
                if (
                    !this.downed &&
                    obj.healRegions &&
                    util.sameLayer(this.layer, obj.layer) &&
                    !this.game.gas.isInGas(this.pos) // heal regions don't work in gas
                ) {
                    const effectiveHealRegions = obj.healRegions.filter((hr) => {
                        return coldet.testPointAabb(
                            this.pos,
                            hr.collision.min,
                            hr.collision.max,
                        );
                    });

                    if (effectiveHealRegions.length != 0) {
                        const totalHealRate = effectiveHealRegions.reduce(
                            (total, hr) => total + hr.healRate,
                            0,
                        );
                        this.health += totalHealRate * dt;
                        this.healEffect = true;
                    }
                }

                if (obj.ceilingDead) continue;

                // only check if layer is the same when not on stairs!
                if (this.layer < 2 && this.layer !== obj.layer) continue;

                for (let i = 0; i < obj.zoomRegions.length; i++) {
                    const zoomRegion = obj.zoomRegions[i];

                    if (
                        zoomRegion.zoomIn &&
                        coldet.testCircleAabb(
                            this.collider.pos,
                            this.collider.rad,
                            zoomRegion.zoomIn.min,
                            zoomRegion.zoomIn.max,
                        )
                    ) {
                        this.indoors = true;
                        this.insideZoomRegion = true;
                        occupiedBuilding = obj;
                        insideNoZoomRegion = false;
                        if (zoomRegion.zoom) {
                            zoomRegionZoom = zoomRegion.zoom;
                        }
                    }

                    if (
                        zoomRegion.zoomOut &&
                        coldet.testCircleAabb(
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
                    obj.door.openOneWay &&
                    obj.getPlayerSide(this) !== obj.door.openOneWay
                )
                    continue;

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
                    insideSmoke = true;
                }
            }
        }

        // only dirty if healEffect changed from last tick to current tick (leaving or entering a heal region)
        if (oldHealEffect != this.healEffect) {
            this.setDirty();
        }

        if (this.insideZoomRegion) {
            finalZoom = zoomRegionZoom;
        }
        if (insideSmoke || this.downed) {
            finalZoom = lowestZoom;
        }

        if (this.debug.overrideZoom) {
            this.zoom = this.debug.zoomOverride;
            this.cullingZoom = this.debug.zoomOverrideCulling ? finalZoom : this.zoom;
        } else {
            this.zoom = finalZoom;
            this.cullingZoom = finalZoom;
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
            // player doesn't exist in grid while in spectator mode
            if (!this.debug.spectatorMode) this.game.grid.updateObject(this);

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

        if (this.debug.godMode.isGodMode) this.godModeUpdate(occupiedBuilding);

        //
        // Weapon stuff
        //
        this.weaponManager.update(dt);

        this.shotSlowdownTimer -= dt;
        if (this.shotSlowdownTimer <= 0) {
            this.shotSlowdownTimer = 0;
        }
    }

    godModeUpdate(occupiedBuilding?: Building): void {
        if (!this.debug.godMode.isGodMode) return;
        const mouseCollider = collider.createCircle(this.mousePos, 1);
        const childIds = occupiedBuilding
            ? new Set(occupiedBuilding.childObjects.map((o) => o.__id))
            : undefined;
        const hoveredObj = this.game.grid
            .intersectCollider(mouseCollider)
            .filter((o): o is Loot | Obstacle | Building => {
                if (
                    o.__type != ObjectType.Loot &&
                    o.__type != ObjectType.Obstacle &&
                    o.__type != ObjectType.Building
                )
                    return false;

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
            this.debug.godMode.selectedObj = hoveredObj;
            this.debug.godMode.originalPos = v2.copy(this.debug.godMode.selectedObj.pos);
            this.debug.godMode.selectPos = v2.copy(this.mousePos);
        }

        if (
            this.debug.godMode.selectedObj &&
            this.debug.godMode.selectPos &&
            this.debug.godMode.originalPos
        ) {
            if (this.shootHold) {
                const deltaPos = v2.sub(this.mousePos, this.debug.godMode.selectPos);
                const newPos = v2.add(this.debug.godMode.originalPos, deltaPos);
                this.debug.godMode.selectedObj.updatePos(newPos);
            } else {
                this.debug.godMode.selectedObj.refresh();
                this.debug.godMode.selectedObj = undefined;
                this.debug.godMode.selectPos = undefined;
                this.debug.godMode.originalPos = undefined;
            }
        }
    }

    private _firstUpdate = true;
    visibleObjects = new Set<GameObject>();
    visibleMapIndicators = new Set<MapIndicator>();

    msgStream = new net.MsgStream(new ArrayBuffer(65536));
    sendMsgs(): void {
        const msgStream = this.msgStream;
        const game = this.game;
        const playerBarn = game.playerBarn;
        msgStream.stream.index = 0;

        if (this._firstUpdate) {
            const joinedMsg = new net.JoinedMsg();
            joinedMsg.teamMode = this.game.teamMode;
            joinedMsg.playerId = this.__id;
            joinedMsg.started = game.started;
            joinedMsg.teamMode = game.teamMode;
            joinedMsg.emotes = this.loadout.emotes;
            this.sendMsg(net.MsgType.Joined, joinedMsg);

            const mapStream = game.map.mapStream.stream;

            msgStream.stream.writeBytes(mapStream, 0, mapStream.byteIndex);
        }

        if (playerBarn.aliveCountDirty || this._firstUpdate) {
            const aliveMsg = new net.AliveCountsMsg();
            this.game.modeManager.updateAliveCounts(aliveMsg.teamAliveCounts);
            msgStream.serializeMsg(net.MsgType.AliveCounts, aliveMsg);
        }

        const updateMsg = new net.UpdateMsg();

        updateMsg.ack = this.ack;

        if (game.gas.dirty || this._firstUpdate) {
            updateMsg.gasDirty = true;
            updateMsg.gasData = game.gas;
        }

        if (game.gas.timeDirty || this._firstUpdate) {
            updateMsg.gasTDirty = true;
            updateMsg.gasT = game.gas.gasT;
        }

        let player: Player;
        if (this.spectating == undefined) {
            // not spectating anyone
            player = this;
        } else if (this.spectating.dead) {
            // was spectating someone but they died so find new player to spectate
            player =
                this.spectating.killedBy && !this.spectating.killedBy.dead
                    ? this.spectating.killedBy
                    : playerBarn.randomPlayer();
            if (player === this) {
                player = playerBarn.randomPlayer();
            }
            this.spectating = player;
        } else {
            // spectating someone currently who is still alive
            player = this.spectating;
        }
        // temporary guard while the spectating code is not fixed
        if (!player) {
            player = this;
        }

        const radius = player.cullingZoom + 4;
        const rect = coldet.circleToAabb(player.pos, radius);

        const newVisibleObjects = game.grid.intersectColliderSet(rect);
        // client crashes if active player is not visible
        // so make sure its always added to visible objects
        newVisibleObjects.add(this);

        for (const obj of this.visibleObjects) {
            if (!newVisibleObjects.has(obj)) {
                updateMsg.delObjIds.push(obj.__id);
            }
        }

        for (const obj of newVisibleObjects) {
            if (
                !this.visibleObjects.has(obj) ||
                game.objectRegister.dirtyFull[obj.__id]
            ) {
                updateMsg.fullObjects.push(obj);
            } else if (game.objectRegister.dirtyPart[obj.__id]) {
                updateMsg.partObjects.push(obj);
            }
        }

        this.visibleObjects = newVisibleObjects;

        updateMsg.activePlayerId = player.__id;
        if (this.startedSpectating) {
            updateMsg.activePlayerIdDirty = true;

            // build the active player data object manually
            // To avoid setting the spectating player fields to dirty
            updateMsg.activePlayerData = {
                healthDirty: true,
                health: player.health,
                boostDirty: true,
                boost: player.boost,
                zoomDirty: true,
                zoom: player.zoom,
                actionDirty: true,
                action: player.action,
                inventoryDirty: true,
                inventory: player.inventory,
                scope: player.scope,
                weapsDirty: true,
                curWeapIdx: player.curWeapIdx,
                weapons: player.weapons,
                spectatorCountDirty: true,
                spectatorCount: player.spectatorCount,
            };
            this.startedSpectating = false;
        } else {
            updateMsg.activePlayerIdDirty = player.activeIdDirty;
            updateMsg.activePlayerData = player;
        }

        updateMsg.playerInfos = player._firstUpdate
            ? playerBarn.players
            : playerBarn.newPlayers;

        updateMsg.deletedPlayerIds = playerBarn.deletedPlayers;
        if (
            player.playerStatusDirty ||
            player.playerStatusTicker >
                net.getPlayerStatusUpdateRate(this.game.map.factionMode)
        ) {
            let statuses = this.game.modeManager.getPlayerStatuses(player);
            updateMsg.playerStatus = statuses;
            updateMsg.playerStatusDirty = true;
            player.playerStatusTicker = 0;
        }

        if (player.groupStatusDirty) {
            const teamPlayers = player.group!.players;

            let statuses: GroupStatus[] = [];
            for (const p of teamPlayers) {
                statuses.push({
                    health: p.health,
                    disconnected: p.disconnected,
                });
            }
            updateMsg.groupStatus = statuses;
            updateMsg.groupStatusDirty = true;
        }

        const shouldSendEmote = (emote: Emote) => {
            const emotePlayer = game.objectRegister.getById(emote.playerId) as
                | Player
                | undefined;

            const emoteDef = GameObjectDefs[emote.type];

            if (emotePlayer) {
                if (!emote.isPing && !player.visibleObjects.has(emotePlayer)) {
                    return false;
                }

                // regular emotes: always send if visible
                if (!emote.isPing && !(emoteDef as EmoteDef).teamOnly) {
                    return true;
                }

                // part of the same group
                if (emotePlayer?.groupId === player.groupId) {
                    return true;
                }

                // faction team leader
                if (
                    (emotePlayer.role === "leader" || emotePlayer.role === "captain") &&
                    emotePlayer.teamId === player.teamId
                ) {
                    return true;
                }
            }

            // always send map events pings
            if (emote.isPing && emoteDef.type === "ping" && emoteDef.mapEvent) {
                return true;
            }

            return false;
        };

        for (let i = 0; i < playerBarn.emotes.length; i++) {
            const emote = playerBarn.emotes[i];
            if (shouldSendEmote(emote)) {
                updateMsg.emotes.push(emote);
            }
        }

        const extendedRadius = 1.1 * radius;
        const radiusSquared = extendedRadius * extendedRadius;

        const bullets = game.bulletBarn.newBullets;
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            if (
                v2.lengthSqr(v2.sub(bullet.pos, player.pos)) < radiusSquared ||
                v2.lengthSqr(v2.sub(bullet.clientEndPos, player.pos)) < radiusSquared ||
                coldet.intersectSegmentCircle(
                    bullet.pos,
                    bullet.clientEndPos,
                    player.pos,
                    extendedRadius,
                )
            ) {
                updateMsg.bullets.push(bullet);
            }
        }

        for (let i = 0; i < game.explosionBarn.newExplosions.length; i++) {
            const explosion = game.explosionBarn.newExplosions[i];
            const rad = explosion.rad + extendedRadius;
            if (v2.lengthSqr(v2.sub(explosion.pos, player.pos)) < rad * rad) {
                updateMsg.explosions.push(explosion);
            }
        }

        const planes = this.game.planeBarn.planes;
        for (let i = 0; i < planes.length; i++) {
            const plane = planes[i];
            if (coldet.testCircleAabb(plane.pos, plane.rad, rect.min, rect.max)) {
                updateMsg.planes.push(plane);
            }
        }
        const newAirstrikeZones = this.game.planeBarn.newAirstrikeZones;
        for (let i = 0; i < newAirstrikeZones.length; i++) {
            const zone = newAirstrikeZones[i];
            updateMsg.airstrikeZones.push(zone);
        }

        const indicators = this.game.mapIndicatorBarn.mapIndicators;
        for (let i = 0; i < indicators.length; i++) {
            const indicator = indicators[i];
            if (indicator.dirty || !this.visibleMapIndicators.has(indicator)) {
                updateMsg.mapIndicators.push(indicator);
                this.visibleMapIndicators.add(indicator);
            }
            if (indicator.dead) {
                this.visibleMapIndicators.delete(indicator);
            }
        }

        if (playerBarn.killLeaderDirty || this._firstUpdate) {
            updateMsg.killLeaderDirty = true;
            updateMsg.killLeaderId = playerBarn.killLeader?.__id ?? 0;
            updateMsg.killLeaderKills = playerBarn.killLeader?.kills ?? 0;
        }

        msgStream.serializeMsg(net.MsgType.Update, updateMsg);

        for (let i = 0; i < this.msgsToSend.length; i++) {
            const msg = this.msgsToSend[i];
            msgStream.serializeMsg(msg.type, msg.msg);
        }

        this.msgsToSend.length = 0;

        const globalMsgStream = this.game.msgsToSend.stream;
        msgStream.stream.writeBytes(globalMsgStream, 0, globalMsgStream.byteIndex);

        this.sendData(msgStream.getBuffer());
        this._firstUpdate = false;
    }

    spectate(spectateMsg: net.SpectateMsg): void {
        const spectatablePlayers = this.game.modeManager.getSpectatablePlayers(this);
        let playerToSpec: Player | undefined;
        switch (true) {
            case spectateMsg.specBegin:
                const groupExistsOrAlive =
                    this.game.isTeamMode && this.group!.livingPlayers.length > 0;
                const teamExistsOrAlive =
                    this.game.map.factionMode && this.team!.livingPlayers.length > 0;
                const aliveKiller = this.getAliveKiller();
                const shouldSpecRandom =
                    groupExistsOrAlive || teamExistsOrAlive || !aliveKiller;

                playerToSpec = shouldSpecRandom
                    ? this.game.map.factionMode && groupExistsOrAlive
                        ? this.group!.livingPlayers[
                              util.randomInt(0, this.group!.livingPlayers.length - 1)
                          ]
                        : spectatablePlayers[
                              util.randomInt(0, spectatablePlayers.length - 1)
                          ]
                    : aliveKiller;
                break;
            case spectateMsg.specNext:
            case spectateMsg.specPrev:
                const nextOrPrev = +spectateMsg.specNext - +spectateMsg.specPrev;
                playerToSpec = util.wrappedArrayIndex(
                    spectatablePlayers,
                    spectatablePlayers.indexOf(this.spectating!) + nextOrPrev,
                );
                break;
        }
        this.spectating = playerToSpec;
    }

    /**
     * doesn't care about kill credit or anything, simply the last player to damage you (excludes yourself)
     */
    lastDamagedBy: Player | undefined;

    damage(params: DamageParams) {
        if (this._health < 0) this._health = 0;
        if (this.dead) return;
        if (this.downed && this.downedDamageTicker > 0) return;
        // cobalt players on role picker menu
        if (this.game.map.perkMode && !this.role) return;

        const sourceIsPlayer = params.source?.__type === ObjectType.Player;

        // teammates can't deal damage to each other
        if (sourceIsPlayer && params.source !== this) {
            if (
                (params.source as Player).groupId === this.groupId &&
                !this.disconnected
            ) {
                return;
            }
            if (
                this.game.map.factionMode &&
                (params.source as Player).teamId === this.teamId &&
                !this.disconnected
            ) {
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
            params.damageType !== GameConfig.DamageType.Gas &&
            params.damageType !== GameConfig.DamageType.Bleeding &&
            params.damageType !== GameConfig.DamageType.Airdrop
        ) {
            const gameSourceDef = GameObjectDefs[params.gameSourceType ?? ""];
            let isHeadShot = false;

            if (
                gameSourceDef &&
                gameSourceDef.type != "melee" &&
                "headshotMult" in gameSourceDef
            ) {
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

            const chest = GameObjectDefs[this.chest] as ChestDef;
            if (chest && !isHeadShot) {
                reduceDamage(chest.damageReduction);
            }

            const helmet = GameObjectDefs[this.helmet] as HelmetDef;
            if (helmet) {
                reduceDamage(helmet.damageReduction * (isHeadShot ? 1 : 0.3));
            }
        }

        if (this._health - finalDamage < 0) finalDamage = this.health;

        this.game.pluginManager.emit("playerDamage", { ...params, player: this });

        this.damageTaken += finalDamage;
        if (sourceIsPlayer && params.source !== this) {
            if ((params.source as Player).groupId !== this.groupId) {
                (params.source as Player).damageDealt += finalDamage;
            }
            this.lastDamagedBy = params.source as Player;
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
        const aliveCount = this.game.modeManager.aliveCount();

        if (this.game.modeManager.showStatsMsg(this)) {
            const statsMsg = new net.PlayerStatsMsg();
            statsMsg.playerStats = this;
            this.msgsToSend.push({ type: net.MsgType.PlayerStats, msg: statsMsg });
        } else {
            const gameOverMsg = new net.GameOverMsg();

            const statsArr: net.PlayerStatsMsg["playerStats"][] =
                this.game.modeManager.getGameoverPlayers(this);
            gameOverMsg.playerStats = statsArr;
            gameOverMsg.teamRank = winningTeamId == this.teamId ? 1 : aliveCount + 1; // gameover msg sent after alive count updated
            gameOverMsg.teamId = this.teamId;
            gameOverMsg.winningTeamId = winningTeamId;
            gameOverMsg.gameOver = !!winningTeamId;
            this.msgsToSend.push({ type: net.MsgType.GameOver, msg: gameOverMsg });

            for (const spectator of this.spectators) {
                spectator.msgsToSend.push({
                    type: net.MsgType.GameOver,
                    msg: gameOverMsg,
                });
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

        if (this.game.gas.currentRad <= 0.1) {
            this.health = 50;
        }

        this.animType = GameConfig.Anim.None;
        this.setDirty();

        this.shootStart = false;
        this.shootHold = false;
        this.cancelAction();

        this.weaponManager.throwThrowable();
        this.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Melee);

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

        if (params.source instanceof Player) {
            this.downedBy = params.source;
            downedMsg.killerId = params.source.__id;
            downedMsg.killCreditId = params.source.__id;
        }

        this.game.broadcastMsg(net.MsgType.Kill, downedMsg);

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
        this.animType = GameConfig.Anim.None;
        this.animSeq++;
        this.healEffect = false;
        this.setDirty();

        this.shootHold = false;

        this.mapIndicator?.kill();

        this.game.playerBarn.aliveCountDirty = true;
        this.game.playerBarn.livingPlayers.splice(
            this.game.playerBarn.livingPlayers.indexOf(this),
            1,
        );

        this.game.playerBarn.killedPlayers.push(this);

        this.group?.checkPlayers();

        if (this.team) {
            this.team.livingPlayers.splice(this.team.livingPlayers.indexOf(this), 1);
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

        if (params.source instanceof Player) {
            const source = params.source;
            this.killedBy = source;

            if (source !== this && source.teamId !== this.teamId) {
                source.killedIds.push(this.matchDataId);
                source.kills++;

                if (source.isKillLeader) {
                    this.game.playerBarn.killLeaderDirty = true;
                }

                if (source.hasPerk("takedown")) {
                    source.health += 25;
                    source.boost += 25;
                    source.giveHaste(GameConfig.HasteType.Takedown, 3);
                }

                if (source.role === "woods_king") {
                    this.game.playerBarn.addMapPing("ping_woodsking", this.pos);
                }
            }
            killMsg.killerId = source.__id;
            killMsg.killCreditId = source.__id;
            killMsg.killerKills = source.kills;
        }

        if (this.hasPerk("final_bugle")) {
            this.initLastBreath();
        }

        if (
            this.hasPerk("martyrdom") ||
            this.role == "grenadier" ||
            this.role == "demo"
        ) {
            const martyrNadeType = "martyr_nade";
            const throwableDef = GameObjectDefs[martyrNadeType] as ThrowableDef;
            for (let i = 0; i < 12; i++) {
                const velocity = v2.mul(v2.randomUnit(), util.random(2, 5));
                this.game.projectileBarn.addProjectile(
                    this.__id,
                    martyrNadeType,
                    this.pos,
                    1,
                    this.layer,
                    velocity,
                    throwableDef.fuseTime,
                    GameConfig.DamageType.Player,
                );
            }
        }

        if (this.game.map.factionMode) {
            // lone survivr can be given on knock or kill
            this.team!.checkAndApplyLastMan();
            this.team!.checkAndApplyCaptain();

            // golden airdrops depend on alive counts, so we only do this logic on kill
            if (this.game.planeBarn.canDropSpecialAirdrop()) {
                this.game.planeBarn.addSpecialAirdrop();
            }
        }

        // params.gameSourceType check ensures player didnt die by bleeding out
        if (
            this.game.map.potatoMode &&
            this.lastDamagedBy &&
            params.damageType === GameConfig.DamageType.Player &&
            params.source !== this
        ) {
            this.lastDamagedBy.randomWeaponSwap(params);
        }

        this.game.broadcastMsg(net.MsgType.Kill, killMsg);

        if (this.role) {
            const roleMsg = new net.RoleAnnouncementMsg();
            roleMsg.role = this.role;
            roleMsg.assigned = false;
            roleMsg.killed = true;
            roleMsg.playerId = this.__id;
            roleMsg.killerId = params.source?.__id ?? 0;
            this.game.broadcastMsg(net.MsgType.RoleAnnouncement, roleMsg);
        }

        if (this.isKillLeader && this.role !== "the_hunted") {
            const roleMsg = new net.RoleAnnouncementMsg();
            roleMsg.role = "kill_leader";
            roleMsg.assigned = false;
            roleMsg.killed = true;
            roleMsg.playerId = this.__id;
            roleMsg.killerId = params.source?.__id ?? 0;
            this.game.broadcastMsg(net.MsgType.RoleAnnouncement, roleMsg);
        }

        if (this.game.map.mapDef.gameMode.killLeaderEnabled) {
            const killLeader = this.game.playerBarn.killLeader;

            let killLeaderKills = 0;

            if (killLeader && !killLeader.dead) {
                killLeaderKills = killLeader.kills;
            }

            const newKillLeader = this.game.playerBarn.getPlayerWithHighestKills();
            if (
                killLeader !== newKillLeader &&
                params.source &&
                newKillLeader === params.source &&
                newKillLeader.kills > killLeaderKills
            ) {
                if (killLeader && killLeader.role === "the_hunted") {
                    killLeader.removeRole();
                }

                params.source.promoteToKillLeader();
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

        this.game.pluginManager.emit("playerKill", { ...params, player: this });

        //
        // Give spectators someone new to spectate
        //

        this.game.modeManager.assignNewSpectate(this);

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
            const def = GameObjectDefs[weap.type];
            switch (def.type) {
                case "gun":
                    this.weaponManager.dropGun(i);
                    weap.type = "";
                    break;
                case "melee":
                    if (def.noDropOnDeath || weap.type === "fists") break;
                    this.game.lootBarn.addLoot(weap.type, this.pos, this.layer, 1);
                    weap.type = "fists";
                    break;
                case "throwable":
                    weap.type = "";
                    break;
            }
        }
        this.weaponManager.setCurWeapIndex(GameConfig.WeaponSlot.Melee);

        for (const item in this.bagSizes) {
            // const def = GameObjectDefs[item] as AmmoDef | HealDef;
            if (item == "1xscope") {
                continue;
            }

            if (this.inventory[item] > 0) {
                this.game.lootBarn.addLoot(
                    item,
                    this.pos,
                    this.layer,
                    this.inventory[item],
                );
            }
        }

        for (const item of GEAR_TYPES) {
            const type = this[item];
            if (!type) continue;
            const def = GameObjectDefs[type] as HelmetDef | ChestDef | BackpackDef;
            if (!!(def as ChestDef).noDrop || def.level < 1) continue;
            this.game.lootBarn.addLoot(type, this.pos, this.layer, 1);
        }

        if (this.outfit) {
            const def = GameObjectDefs[this.outfit] as OutfitDef;
            if (!def.noDropOnDeath && !def.noDrop) {
                this.game.lootBarn.addLoot(this.outfit, this.pos, this.layer, 1);
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
                );
            }
        }
        this.perks.length = 0;
        this.perkTypes.length = 0;

        // death emote
        this.sendDeathEmoteTicker = 0.3;

        // Building gore region (club pool)
        const objs = this.game.grid.intersectGameObject(this);
        for (const obj of objs) {
            if (
                obj.__type === ObjectType.Building &&
                obj.goreRegion &&
                util.sameLayer(this.layer, obj.layer) &&
                coldet.testCircleAabb(
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
    }

    getAliveKiller(): Player | undefined {
        let attempts = 0;
        const findAliveKiller = (killer: Player | undefined): Player | undefined => {
            attempts++;
            if (attempts > 80) return undefined;

            if (!killer) return undefined;
            if (!killer.dead) return killer;
            if (
                killer.killedBy &&
                killer.killedBy !== this &&
                killer.killedBy !== killer
            ) {
                return findAliveKiller(killer.killedBy);
            }

            return undefined;
        };
        return findAliveKiller(this.killedBy);
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
            this.actionType == GameConfig.Action.Reload ||
            this.actionType == GameConfig.Action.ReloadAlt
        );
    }

    /** returns player to revive if can revive */
    getPlayerToRevive(): Player | undefined {
        if (this.actionType != GameConfig.Action.None) return undefined; // action in progress already

        if (this.downed && this.hasPerk("self_revive")) return this;

        if (!this.game.modeManager.isReviveSupported()) return undefined; // no revives in solos
        if (this.downed) return undefined; // can't revive players while downed

        const nearbyDownedTeammates = this.game.grid
            .intersectCollider(
                collider.createCircle(this.pos, GameConfig.player.reviveRange),
            )
            .filter(
                (obj): obj is Player =>
                    obj.__type == ObjectType.Player &&
                    obj.teamId == this.teamId &&
                    obj.downed &&
                    // can't revive someone already being revived or self reviving (medic)
                    obj.actionType != GameConfig.Action.Revive,
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
            this.playAnim(GameConfig.Anim.Revive, GameConfig.player.reviveDuration);
        }
    }

    isAffectedByAOE(medic: Player): boolean {
        const effectRange =
            medic.actionType == GameConfig.Action.Revive
                ? GameConfig.player.medicReviveRange
                : GameConfig.player.medicHealRange;

        return (
            this.game.modeManager.getIdContext(medic) ==
                this.game.modeManager.getIdContext(this) &&
            !!util.sameLayer(medic.layer, this.layer) &&
            v2.lengthSqr(v2.sub(medic.pos, this.pos)) <= effectRange * effectRange
        );
    }

    /** for the medic role in 50v50 */
    getAOEPlayers(): Player[] {
        const effectRange =
            this.actionType == GameConfig.Action.Revive
                ? GameConfig.player.medicReviveRange
                : GameConfig.player.medicHealRange;

        return this.game.grid
            .intersectCollider(
                // includes self
                collider.createCircle(this.pos, effectRange),
            )
            .filter(
                (obj): obj is Player =>
                    obj.__type == ObjectType.Player && obj.isAffectedByAOE(this),
            );
    }

    useHealingItem(item: string): void {
        const itemDef = GameObjectDefs[item];
        assert(itemDef.type === "heal", `Invalid heal item ${item}`);

        if (
            (!this.hasPerk("aoe_heal") && this.health == itemDef.maxHeal) ||
            this.actionType == GameConfig.Action.UseItem ||
            this.actionType == GameConfig.Action.Revive ||
            this.weaponManager.cookingThrowable
        ) {
            return;
        }
        if (!this.inventory[item]) {
            return;
        }

        // medics always emote the healing/boost item they're using
        if (this.role == "medic") {
            this.game.playerBarn.addEmote("emote_loot", this.__id, item);
        }

        this.cancelAction();
        this.doAction(
            item,
            GameConfig.Action.UseItem,
            (this.hasPerk("aoe_heal") ? 0.75 : 1) * itemDef.useTime,
        );
    }

    applyActionFunc(actionFunc: (target: Player) => void): void {
        if (this.hasPerk("aoe_heal")) {
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
            const target =
                this.actionType === GameConfig.Action.Revive && this.playerBeingRevived
                    ? this.playerBeingRevived
                    : this;
            actionFunc(target);
        }
    }

    useBoostItem(item: string): void {
        const itemDef = GameObjectDefs[item];
        assert(itemDef.type === "boost", `Invalid boost item ${item}`);

        if (
            this.actionType == GameConfig.Action.UseItem ||
            this.actionType == GameConfig.Action.Revive ||
            this.weaponManager.cookingThrowable
        ) {
            return;
        }
        if (!this.inventory[item]) {
            return;
        }

        // medics always emote the healing/boost item they're using
        if (this.role == "medic") {
            this.game.playerBarn.addEmote("emote_loot", this.__id, item);
        }

        this.cancelAction();
        this.doAction(
            item,
            GameConfig.Action.UseItem,
            (this.hasPerk("aoe_heal") ? 0.75 : 1) * itemDef.useTime,
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

    shouldAcceptInput(input: number): boolean {
        return this.downed
            ? (input === GameConfig.Input.Revive && this.hasPerk("self_revive")) || // Players can revive themselves if they have the self-revive perk.
                  (input === GameConfig.Input.Cancel &&
                      !this.revivedBy?.hasPerk("aoe_heal")) || // Players can cancel their own revives if they are not revived by aoe heal.
                  (input === GameConfig.Input.Cancel &&
                      this.game.modeManager.isReviving(this)) || // Players can cancel their own revives if they are reviving themselves.
                  input === GameConfig.Input.Use ||
                  input === GameConfig.Input.Interact // Players can interact with obstacles while downed.
            : true;
    }

    handleInput(msg: net.InputMsg): void {
        this.ack = msg.seq;

        if (this.dead) return;
        if (this.game.map.perkMode && !this.role) return;

        if (!v2.eq(this.dir, msg.toMouseDir)) {
            this.setPartDirty();
            this.dirOld = v2.copy(this.dir);
            this.dir = v2.normalizeSafe(msg.toMouseDir);
        }

        this.moveLeft = msg.moveLeft;
        this.moveRight = msg.moveRight;
        this.moveUp = msg.moveUp;
        this.moveDown = msg.moveDown;
        this.portrait = msg.portrait;
        this.touchMoveActive = msg.touchMoveActive;
        this.touchMoveDir = v2.normalizeSafe(msg.touchMoveDir);
        this.touchMoveLen = msg.touchMoveLen;
        this.toMouseLen = msg.toMouseLen;

        this.mousePos = v2.add(this.pos, v2.mul(this.dir, this.toMouseLen));

        // spectators are only allowed to send movement related inputs
        if (this.debug.spectatorMode) return;

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

                    const currentTarget = slotTargets.indexOf(this.curWeapIdx);
                    if (currentTarget != -1) slotTargets.splice(currentTarget, 1);

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

                    const canRevive =
                        !this.downed || (this.downed && this.hasPerk("self_revive"));

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
                            interactable.__type === ObjectType.Loot &&
                            !this.downed
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
                        this.weaponManager.scheduleReload();
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

                        if (!this.inventory[nextScope]) continue;
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

                        if (!this.inventory[prevScope]) continue;
                        this.scope = prevScope;
                        this.inventoryDirty = true;
                        break;
                    }
                    break;
                }
                case GameConfig.Input.SwapWeapSlots: {
                    const primary = {
                        ...this.weapons[GameConfig.WeaponSlot.Primary],
                    };
                    const secondary = {
                        ...this.weapons[GameConfig.WeaponSlot.Secondary],
                    };

                    this.weapons[GameConfig.WeaponSlot.Primary] = secondary;
                    this.weapons[GameConfig.WeaponSlot.Secondary] = primary;

                    // curWeapIdx's setter method already sets dirty.weapons
                    if (
                        this.curWeapIdx == GameConfig.WeaponSlot.Primary ||
                        this.curWeapIdx == GameConfig.WeaponSlot.Secondary
                    ) {
                        this.weaponManager.setCurWeapIndex(
                            this.curWeapIdx ^ 1,
                            false,
                            false,
                            false,
                            false,
                        );
                    } else {
                        this.weapsDirty = true;
                    }
                    break;
                }
            }
        }

        // no exceptions for any perks or roles
        if (this.downed) return;

        switch (msg.useItem) {
            case "bandage":
            case "healthkit":
                this.useHealingItem(msg.useItem);
                break;
            case "soda":
            case "painkiller":
                this.useBoostItem(msg.useItem);
                break;
            case "1xscope":
            case "2xscope":
            case "4xscope":
            case "8xscope":
            case "15xscope":
                if (this.inventory[msg.useItem]) {
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
                util.sameLayer(loot.layer, this.layer) &&
                (loot.ownerId == 0 || loot.ownerId == this.__id)
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

    getFreeGunSlot(obj: Loot) {
        const gunSlots = [GameConfig.WeaponSlot.Primary, GameConfig.WeaponSlot.Secondary];

        // first loop to find dual wieldable guns
        for (const slot of gunSlots) {
            const slotDef = GameObjectDefs[this.weapons[slot].type] as GunDef | undefined;

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
            return {
                slot: this.curWeapIdx,
                isDual: false,
                cause:
                    this.activeWeapon === obj.type
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

        const def = GameObjectDefs[obj.type];
        if (
            (this.actionType == GameConfig.Action.UseItem && def.type != "gun") ||
            this.actionType == GameConfig.Action.Revive
        )
            return;

        if (this.pickupTicker > 0) return;
        this.pickupTicker = 0.1;
        let amountLeft = 0;
        let lootToAdd = obj.type;
        let removeLoot = true;
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
                    const backpackLevel = this.getGearLevel(this.backpack);
                    const bagSpace = this.bagSizes[obj.type]
                        ? this.bagSizes[obj.type][backpackLevel]
                        : 0;

                    if (this.inventory[obj.type] + obj.count <= bagSpace) {
                        switch (def.type) {
                            case "scope": {
                                const currentScope = GameObjectDefs[
                                    this.scope
                                ] as ScopeDef;
                                if (def.level > currentScope.level) {
                                    // only switch scopes if new scope is highest level player has
                                    this.scope = obj.type;
                                }
                                break;
                            }
                            case "throwable": {
                                if (
                                    throwableList.includes(obj.type) &&
                                    !this.weapons[GameConfig.WeaponSlot.Throwable].type
                                ) {
                                    // fill empty slot with throwable, otherwise just add to inv
                                    if (this.inventory[obj.type] == 0) {
                                        this.weaponManager.setWeapon(
                                            GameConfig.WeaponSlot.Throwable,
                                            obj.type,
                                            0,
                                        );
                                    }
                                }
                                break;
                            }
                        }
                        this.inventory[obj.type] += obj.count;
                        this.inventoryDirty = true;
                    } else {
                        // spawn new loot object to animate the pickup rejection
                        const spaceLeft = bagSpace - this.inventory[obj.type];
                        const amountToAdd = spaceLeft;

                        if (amountToAdd <= 0) {
                            pickupMsg.type = net.PickupMsgType.Full;
                            if (def.type === "scope") {
                                pickupMsg.type = net.PickupMsgType.AlreadyOwned;
                            }
                        } else {
                            this.inventory[obj.type] += amountToAdd;
                            this.inventoryDirty = true;
                            if (
                                def.type === "throwable" &&
                                amountToAdd != 0 &&
                                throwableList.includes(obj.type) &&
                                !this.weapons[GameConfig.WeaponSlot.Throwable].type
                            ) {
                                this.weaponManager.setWeapon(
                                    GameConfig.WeaponSlot.Throwable,
                                    obj.type,
                                    0,
                                );
                                this.setDirty();
                            }
                        }
                        amountLeft = obj.count - amountToAdd;
                    }
                    // this is here because it needs to execute regardless of what happens above
                    // automatically reloads gun if inventory has 0 ammo and ammo is picked up
                    const weaponInfo = GameObjectDefs[this.activeWeapon];
                    if (
                        def.type == "ammo" &&
                        weaponInfo.type === "gun" &&
                        this.weapons[this.curWeapIdx].ammo == 0 &&
                        weaponInfo.ammo == obj.type
                    ) {
                        this.weaponManager.scheduleReload();
                    }
                }
                break;
            case "melee":
                this.weaponManager.dropMelee();
                this.weaponManager.setWeapon(GameConfig.WeaponSlot.Melee, obj.type, 0);
                break;
            case "gun":
                {
                    amountLeft = 0;
                    removeLoot = true;

                    const freeGunSlot = this.getFreeGunSlot(obj);
                    pickupMsg.type = freeGunSlot.cause;
                    let newGunIdx = freeGunSlot.slot;

                    if (newGunIdx === null) {
                        this.pickupTicker = 0;
                        return;
                    }

                    const oldWeapDef = GameObjectDefs[this.weapons[newGunIdx].type] as
                        | GunDef
                        | undefined;
                    if (
                        oldWeapDef &&
                        (oldWeapDef.noDrop || !this.weaponManager.canDropFlare(newGunIdx))
                    ) {
                        this.pickupTicker = 0;
                        return;
                    }

                    this.pickupTicker = 0.2;

                    let gunType = obj.type;

                    if (def.dualWieldType && freeGunSlot.isDual) {
                        gunType = def.dualWieldType;
                    }

                    // replaces the gun

                    let newAmmo = 0;
                    let gunDropped = false;

                    if (oldWeapDef) {
                        newAmmo =
                            oldWeapDef.dualWieldType === gunType
                                ? this.weapons[newGunIdx].ammo
                                : 0;

                        // inverted logic, there is only 1 case where the old gun should not drop
                        // when youre holding a pistol, and you pick up the same single pistol from the ground
                        // it should turn it into its dual pistol version and drop nothing
                        const shouldDrop = !(
                            (
                                oldWeapDef.dualWieldType && // verifies it's a dual wieldable pistol
                                this.weapons[newGunIdx].type == obj.type
                            ) // verifies the old gun and new gun are the same
                        );
                        if (shouldDrop) {
                            this.weaponManager.dropGun(newGunIdx);
                            gunDropped = true;
                        }
                    }

                    this.weaponManager.setWeapon(newGunIdx, gunType, newAmmo);

                    // if "preloaded" gun add ammo to inventory
                    if (obj.isPreloadedGun) {
                        const ammoAmount = def.ammoSpawnCount;
                        const ammoType = def.ammo;
                        const backpackLevel = this.getGearLevel(this.backpack);
                        const bagSpace = this.bagSizes[ammoType]
                            ? this.bagSizes[ammoType][backpackLevel]
                            : 0;
                        if (this.inventory[ammoType] + ammoAmount <= bagSpace) {
                            this.inventory[ammoType] += ammoAmount;
                            this.inventoryDirty = true;
                        } else {
                            // spawn new loot object to animate the pickup rejection
                            const spaceLeft = bagSpace - this.inventory[ammoType];
                            const amountToAdd = spaceLeft;
                            this.inventory[ammoType] += amountToAdd;
                            this.inventoryDirty = true;

                            const amountLeft = ammoAmount - amountToAdd;
                            this.dropLoot(ammoType, amountLeft);
                        }
                    }

                    // always select primary slot if melee is selected
                    if (
                        !freeGunSlot.isDual &&
                        this.curWeapIdx === GameConfig.WeaponSlot.Melee
                    ) {
                        this.weaponManager.setCurWeapIndex(newGunIdx); // primary
                    }

                    // Reload instantly if a gun was dropped, handle duals
                    if (gunDropped || newGunIdx === this.curWeapIdx) {
                        this.cancelAction();
                        this.weaponManager.applyReloadDelay(0);
                        this.weaponManager.scheduleReload();
                    }
                }
                break;
            case "helmet":
            case "chest":
            case "backpack":
                {
                    const objLevel = this.getGearLevel(obj.type);
                    const thisType = this[def.type];
                    const thisDef = GameObjectDefs[thisType];
                    const thisLevel = this.getGearLevel(thisType);
                    amountLeft = 1;

                    // role helmets and perk helmets can't be dropped in favor of another helmet, they're the "highest" tier
                    if (
                        def.type == "helmet" &&
                        (this.hasRoleHelmet || (thisDef && (thisDef as HelmetDef).perk))
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
                if (this.role == "leader" || this.role == "captain") {
                    amountLeft = 1;
                    pickupMsg.type = net.PickupMsgType.BetterItemEquipped;
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
                    type = this.game.lootBarn.getLootTable(
                        "tier_halloween_mystery_perks",
                    )[0].name;
                }

                pickupMsg.item = type;

                if (this.hasPerk(obj.type)) {
                    amountLeft = 1;
                    pickupMsg.type = net.PickupMsgType.AlreadyEquipped;
                    break;
                }

                const emoteType = `emote_${type}`;
                if (GameObjectDefs[`emote_${type}`]) {
                    this.game.playerBarn.addEmote(emoteType, this.__id);
                }

                const perkSlotType = this.perks.find(
                    (p) => p.droppable || p.replaceOnDeath === "halloween_mystery",
                )?.type;
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

        const lootToAddDef = GameObjectDefs[lootToAdd] as LootDef;
        if (
            removeLoot &&
            amountLeft > 0 &&
            lootToAdd !== "" &&
            // if obj you tried picking up can't be picked up and needs to be dropped, "noDrop" is irrelevant
            (obj.type == lootToAdd || !(lootToAddDef as ChestDef).noDrop)
        ) {
            const dir = v2.neg(this.dir);
            this.game.lootBarn.addLootWithoutAmmo(
                lootToAdd,
                v2.add(obj.pos, v2.mul(dir, 0.4)),
                obj.layer,
                amountLeft,
                undefined,
                dir,
            );
        }

        if (removeLoot) {
            obj.destroy();
        }
        this.msgsToSend.push({
            type: net.MsgType.Pickup,
            msg: pickupMsg,
        });
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
            playerLootTypes.push(weapon.type);
        }

        for (let i = 0; i < this.perks.length; i++) {
            const perk = this.perks[i];
            if (!perk.droppable) continue;
            playerLootTypes.push(perk.type);
        }

        for (const armor of [this.helmet, this.chest] as const) {
            if (!armor) continue;
            if ((GameObjectDefs[armor] as ChestDef | HelmetDef).noDrop) continue;
            playerLootTypes.push(armor);
        }

        if (playerLootTypes.length == 0) return;

        const item = playerLootTypes[util.randomInt(0, playerLootTypes.length - 1)];
        const weapIdx = this.weapons.findIndex((w) => w.type == item);

        const dropMsg = new net.DropItemMsg();
        dropMsg.item = item;
        dropMsg.weapIdx = weapIdx;
        this.dropItem(dropMsg);
    }

    /** just used in potato mode, swaps oldWeapon with a random weapon of the same type (mosin -> m9) */
    randomWeaponSwap(params: DamageParams): void {
        if (this.dead) return;
        const oldWeapon = params.weaponSourceType || params.gameSourceType;
        if (!oldWeapon) return;

        const oldWeaponDef = GameObjectDefs[oldWeapon] as
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
            ? ([_type, def]) =>
                  !def.noPotatoSwap && def.quality == PerkProperties.rare_potato.quality
            : ([_type, def]) => !def.noPotatoSwap;

        const weaponChoices = enumerableDefs.filter(filterCb);
        const [chosenWeaponType, chosenWeaponDef] =
            weaponChoices[util.randomInt(0, weaponChoices.length - 1)];

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

        const slotDef = GameObjectDefs[this.weapons[index].type] as
            | GunDef
            | MeleeDef
            | ThrowableDef;
        if (slotDef && slotDef.noPotatoSwap) return;

        if (index === this.curWeapIdx && this.isReloading()) {
            this.cancelAction();
        }

        this.weaponManager.setWeapon(
            index,
            chosenWeaponType,
            chosenWeaponDef.type == "gun"
                ? this.weaponManager.getTrueAmmoStats(chosenWeaponDef).trueMaxClip
                : 0,
        );

        if ("switchDelay" in chosenWeaponDef) {
            this.weaponManager.weapons[index].cooldown = chosenWeaponDef.switchDelay;
        }

        if (chosenWeaponDef.type == "gun") {
            const backpackLevel = this.getGearLevel(this.backpack);
            const bagSpace = this.bagSizes[chosenWeaponDef.ammo]
                ? this.bagSizes[chosenWeaponDef.ammo][backpackLevel]
                : 0;

            const ammo = math.clamp(
                chosenWeaponDef.ammoSpawnCount - chosenWeaponDef.maxClip,
                0,
                bagSpace,
            );

            if (this.inventory[chosenWeaponDef.ammo] < ammo) {
                this.inventory[chosenWeaponDef.ammo] = ammo;
                this.inventoryDirty = true;
            }
            if (index === this.curWeapIdx) {
                this.shotSlowdownTimer = 0;
            }
        } else if (chosenWeaponDef.type == "throwable") {
            const backpackLevel = this.getGearLevel(this.backpack);
            const bagSpace = this.bagSizes[chosenWeaponType]
                ? this.bagSizes[chosenWeaponType][backpackLevel]
                : 0;

            const amountToAdd = math.clamp(Math.floor(bagSpace / 3), 1, 511);
            if (this.inventory[chosenWeaponType] + amountToAdd <= bagSpace) {
                this.inventory[chosenWeaponType] += amountToAdd;
            } else {
                this.inventory[chosenWeaponType] = bagSpace;
            }

            this.inventoryDirty = true;
        }

        this.setDirty();

        this.game.playerBarn.addEmote("emote_loot", this.__id, chosenWeaponType);
    }

    dropLoot(type: string, count = 1, useCountForAmmo?: boolean) {
        this.mobileDropTicker = 3;
        this.game.lootBarn.addLoot(
            type,
            this.pos,
            this.layer,
            count,
            useCountForAmmo,
            10,
            v2.neg(this.dir),
            undefined,
            undefined,
            "player",
        );
    }

    dropArmor(item: string): boolean {
        const armorDef = GameObjectDefs[item];
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

        const itemDef = GameObjectDefs[dropMsg.item] as LootDef;
        if (!itemDef) return;

        dropMsg.weapIdx = math.clamp(dropMsg.weapIdx, 0, GameConfig.WeaponSlot.Count - 1);

        switch (itemDef.type) {
            case "ammo": {
                const inventoryCount = this.inventory[dropMsg.item];

                if (inventoryCount === 0) return;

                let amountToDrop = Math.max(1, Math.floor(inventoryCount / 2));

                if (itemDef.minStackSize && inventoryCount <= itemDef.minStackSize) {
                    amountToDrop = Math.min(itemDef.minStackSize, inventoryCount);
                } else if (inventoryCount <= 5) {
                    amountToDrop = Math.min(5, inventoryCount);
                }

                this.splitUpLoot(dropMsg.item, amountToDrop);
                this.inventory[dropMsg.item] -= amountToDrop;
                this.inventoryDirty = true;
                break;
            }
            case "scope": {
                if (itemDef.level === 1) break;
                if (!this.inventory[dropMsg.item]) return;
                const scopeLevel = `${itemDef.level}xscope`;
                const scopeIdx = SCOPE_LEVELS.indexOf(scopeLevel);

                this.dropLoot(dropMsg.item, 1);
                this.inventory[scopeLevel] = 0;

                if (this.scope === scopeLevel) {
                    for (let i = scopeIdx; i >= 0; i--) {
                        if (!this.inventory[SCOPE_LEVELS[i]]) continue;
                        this.scope = SCOPE_LEVELS[i];
                        break;
                    }
                }

                this.inventoryDirty = true;
                break;
            }
            case "chest":
            case "helmet": {
                this.dropArmor(dropMsg.item);
                break;
            }
            case "heal":
            case "boost": {
                const inventoryCount = this.inventory[dropMsg.item];

                if (inventoryCount === 0) return;

                let amountToDrop = Math.max(1, Math.floor(inventoryCount / 2));

                this.inventory[dropMsg.item] -= amountToDrop;

                this.dropLoot(dropMsg.item, amountToDrop);
                this.inventoryDirty = true;
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
            case "throwable": {
                if (this.weaponManager.cookingThrowable) return;
                const inventoryCount = this.inventory[dropMsg.item];

                if (inventoryCount === 0) return;

                const amountToDrop = Math.max(1, Math.floor(inventoryCount / 2));

                this.splitUpLoot(dropMsg.item, amountToDrop);

                this.inventory[dropMsg.item] -= amountToDrop;

                if (this.inventory[dropMsg.item] == 0) {
                    this.weaponManager.showNextThrowable();
                }
                this.inventoryDirty = true;
                this.weapsDirty = true;
                break;
            }
            case "perk": {
                const perkSlotType = this.perks.find(
                    (p) => p.droppable && p.type === dropMsg.item,
                )?.type;
                if (perkSlotType && perkSlotType == dropMsg.item) {
                    this.dropLoot(dropMsg.item);
                    this.removePerk(dropMsg.item);
                    this.setDirty();
                }
            }
        }

        const reloading = this.isReloading();
        this.cancelAction();

        if (reloading && this.weapons[this.curWeapIdx].ammo == 0) {
            this.weaponManager.scheduleReload();
        }
    }

    setLoadout(loadout: net.JoinMsg["loadout"], useDefaultUnlocks?: boolean) {
        const defaltUnlocks = UnlockDefs.unlock_default.unlocks;
        /**
         * Checks if an item is present in the player's loadout
         */
        const isItemInLoadout = (item: string, category: string) => {
            if (useDefaultUnlocks && !defaltUnlocks.includes(item)) return false;

            const def = GameObjectDefs[item];
            if (!def || def.type !== category) return false;

            return true;
        };

        if (
            isItemInLoadout(loadout.outfit, "outfit") &&
            loadout.outfit !== "outfitBase"
        ) {
            this.setOutfit(loadout.outfit);
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
        const emoteDef = GameObjectDefs[emoteMsg.type];

        if (emoteMsg.isPing) {
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
            this.emoteHardTicker =
                this.emoteHardTicker > 0
                    ? this.emoteHardTicker
                    : GameConfig.player.emoteHardCooldown * 1.5;
        }
    }

    processEditMsg(msg: net.EditMsg) {
        if (!Config.debug.allowEditMsg) return;

        if (msg.loadNewMap) {
            this.game.map.regenerate(msg.newMapSeed);
        }

        this.debug.overrideZoom = msg.overrideZoom;
        this.debug.zoomOverrideCulling = msg.cull;
        this.debug.zoomOverride = msg.zoom;

        this.debug.baseSpeedOverride = math.clamp(msg.speed, 1, 10000);

        // only accept ground or underground
        if ((msg.layer == 0 || msg.layer == 1) && this.layer != msg.layer) {
            this.layer = msg.layer;
            this.setDirty();
        }

        // removed from grid while in spectator mode so other players can't see/interact with the player
        if (this.debug.spectatorMode != msg.spectatorMode) {
            msg.spectatorMode
                ? this.game.grid.remove(this)
                : this.game.grid.addObject(this);
        }

        this.debug.spectatorMode = msg.spectatorMode;
        this.debug.godMode.isGodMode = msg.godMode;

        if (msg.spawnLootType) {
            const def = GameObjectDefs[msg.spawnLootType];
            if (!def || !("lootImg" in def)) return;
            let count = 1;
            if (this.bagSizes[msg.spawnLootType]) {
                count = this.bagSizes[msg.spawnLootType][0];
            }
            this.game.lootBarn.addLoot(
                msg.spawnLootType,
                this.pos,
                this.layer,
                count,
                false,
                0,
            );
        }

        if (msg.promoteToRoleType) {
            const def = GameObjectDefs[msg.promoteToRoleType];
            if (!def) return;
            this.promoteToRole(msg.promoteToRoleType);
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

    freeze(frozenOri: number, duration: number): void {
        this.frozenTicker = duration;
        this.frozen = true;
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
        }
    }

    incrementFat() {
        this.fatTicker = 2.5;
        if (this.fatModifier > 0.6) return;
        this.fatModifier += 0.06;
        this.recalculateScale();
    }

    giveHaste(type: HasteType, duration: number): void {
        this.hasteType = type;
        this.hasteSeq++;
        this._hasteTicker = duration;
        this.setDirty();
    }

    playAnim(type: Anim, duration: number, cb?: () => void): void {
        this.animType = type;
        this.animSeq++;
        this.setDirty();
        this._animTicker = duration;
        this._animCb = cb;
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
        if (this.debug.baseSpeedOverride != -1) {
            this.speed = this.debug.baseSpeedOverride;
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
        const weaponDef = GameObjectDefs[this.activeWeapon] as
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
            this.shotSlowdownTimer > 0 ||
            (!hasFieldMedic && this.actionType == GameConfig.Action.UseItem)
        ) {
            this.speed *= 0.5;
        }

        if (hasFieldMedic && this.actionType == GameConfig.Action.UseItem) {
            this.speed += PerkProperties.field_medic.speedBoost;
        }

        this.speed = math.clamp(this.speed, 1, 10000);
    }

    sendMsg(type: number, msg: net.AbstractMsg, bytes = 128): void {
        const stream = new net.MsgStream(new ArrayBuffer(bytes));
        stream.serializeMsg(type, msg);
        this.sendData(stream.getBuffer());
    }

    sendData(buffer: Uint8Array): void {
        this.game.sendSocketMsg(this.socketId, buffer);
    }
}
