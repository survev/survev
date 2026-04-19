import type * as net from "../../shared/net/net";
import type { Ctx, Game } from "./game";
import { helpers } from "./helpers";
import { createBullet } from "./objects/bullet";

type ObjectUpdateMsg = Pick<
    net.UpdateMsg | net.ReplayUpdateMsg,
    "delObjIds" | "fullObjects" | "partObjects"
>;

type EffectUpdateMsg = Pick<
    net.UpdateMsg | net.ReplayUpdateMsg,
    | "gasDirty"
    | "gasData"
    | "gasTDirty"
    | "gasT"
    | "bullets"
    | "explosions"
    | "emotes"
    | "planes"
    | "airstrikeZones"
    | "mapIndicators"
    | "killLeaderDirty"
    | "killLeaderId"
    | "killLeaderKills"
>;

export function createWorldUpdateContext(game: Game): Ctx {
    return {
        audioManager: game.m_audioManager,
        renderer: game.m_renderer,
        particleBarn: game.m_particleBarn,
        map: game.m_map,
        smokeBarn: game.m_smokeBarn,
        decalBarn: game.m_decalBarn,
    };
}

export function applyObjectUpdates(game: Game, msg: ObjectUpdateMsg, ctx: Ctx) {
    for (let i = 0; i < msg.delObjIds.length; i++) {
        game.m_objectCreator.m_deleteObj(msg.delObjIds[i]);
    }

    for (let i = 0; i < msg.fullObjects.length; i++) {
        const obj = msg.fullObjects[i];
        game.m_objectCreator.m_updateObjFull(obj.__type, obj.__id, obj, ctx);
    }

    for (let i = 0; i < msg.partObjects.length; i++) {
        const obj = msg.partObjects[i];
        game.m_objectCreator.m_updateObjPart(obj.__id, obj, ctx);
    }
}

export function applyWorldEffects(game: Game, msg: EffectUpdateMsg) {
    if (msg.gasDirty) {
        game.m_gas.setFullState(msg.gasT, msg.gasData, game.m_uiManager);
    }
    if (msg.gasTDirty) {
        game.m_gas.setProgress(msg.gasT);
    }

    for (let i = 0; i < msg.bullets.length; i++) {
        const bullet = msg.bullets[i];
        createBullet(
            bullet,
            game.m_bulletBarn,
            game.m_flareBarn,
            game.m_playerBarn,
            game.m_renderer,
        );
        if (bullet.shotFx) {
            game.m_shotBarn.addShot(bullet);
        }
    }

    for (let i = 0; i < msg.explosions.length; i++) {
        const explosion = msg.explosions[i];
        game.m_explosionBarn.addExplosion(explosion.type, explosion.pos, explosion.layer);
    }

    for (let i = 0; i < msg.emotes.length; i++) {
        const emote = msg.emotes[i];
        if (emote.isPing) {
            game.m_emoteBarn.addPing(emote, game.m_map.factionMode);
        } else {
            game.m_emoteBarn.addEmote(emote);
        }
    }

    game.m_planeBarn.updatePlanes(msg.planes, game.m_map);
    for (let i = 0; i < msg.airstrikeZones.length; i++) {
        game.m_planeBarn.createAirstrikeZone(msg.airstrikeZones[i]);
    }

    game.m_uiManager.updateMapIndicators(msg.mapIndicators);

    if (msg.killLeaderDirty) {
        const leaderNameText = helpers.htmlEscape(
            game.m_playerBarn.getPlayerName(msg.killLeaderId, game.m_activeId, true),
        );
        game.m_uiManager.updateKillLeader(
            msg.killLeaderId,
            leaderNameText,
            msg.killLeaderKills,
            game.m_map.getMapDef().gameMode,
        );
    }
}

export function syncActivePlayerWorldState(game: Game) {
    game.m_activePlayer.layer = game.m_activePlayer.m_netData.m_layer;
    game.m_renderer.setActiveLayer(game.m_activePlayer.layer);
    game.m_audioManager.activeLayer = game.m_activePlayer.layer;

    const underground = game.m_activePlayer.isUnderground(game.m_map);
    game.m_renderer.setUnderground(underground);
    game.m_audioManager.underground = underground;
}

export function updateReplayTiming(game: Game) {
    const now = Date.now();
    game.m_updateRecvCount++;
    if (game.lastUpdateTime > 0) {
        const interval = now - game.lastUpdateTime;
        game.m_camera.m_interpInterval = interval / 1000;
        game.updateIntervals.push(interval);
    }
    game.lastUpdateTime = now;
}

export function updateGameTiming(game: Game, msg: net.UpdateMsg) {
    const now = Date.now();
    game.m_updateRecvCount++;
    if (msg.ack == game.seq && game.seqInFlight) {
        game.seqInFlight = false;
        const ping = now - game.seqSendTime;
        game.debugHUD.pingGraph.addEntry(ping);
        game.pings.push(ping);
    }
    if (game.lastUpdateTime > 0) {
        const interval = now - game.lastUpdateTime;
        game.m_camera.m_interpInterval = interval / 1000;
        game.updateIntervals.push(interval);
    }
    game.lastUpdateTime = now;
}
