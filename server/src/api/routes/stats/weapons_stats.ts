import { Hono } from "hono";
import {
    type GameObjectDef,
    GameObjectDefs,
} from "../../../../../shared/defs/gameObjectDefs";
import type { AmmoDef } from "../../../../../shared/defs/gameObjects/gearDefs";
import type { GunDef } from "../../../../../shared/defs/gameObjects/gunDefs";
import {
    type WeaponStatsResponse,
    zWeaponStatsRequest,
} from "../../../../../shared/types/stats";
import { util } from "../../../../../shared/utils/util";
import type { Context } from "../..";
import {
    databaseEnabledMiddleware,
    rateLimitMiddleware,
    validateParams,
} from "../../auth/middleware";

export const weaponsStatsRouter = new Hono<Context>();

function getHexColor(def: GameObjectDef) {
    if (def.type == "gun") {
        const bullet = def.ammo;
        const bulletTint = (GameObjectDefs[bullet] as AmmoDef)?.lootImg?.tint;
        if (bulletTint) {
            return util.intToHex(bulletTint);
        }
    }

    return "#ccc";
}

function getImage(def: GameObjectDef) {
    return `img/loot/${(def as GunDef)?.lootImg?.sprite.replace(".img", ".svg")}`;
}

weaponsStatsRouter.post(
    "/",
    databaseEnabledMiddleware,
    rateLimitMiddleware(40, 60 * 1000),
    validateParams(zWeaponStatsRequest),
    (c) => {
        return c.json<WeaponStatsResponse>([
            {
                type: "ak47",
                name: (GameObjectDefs["ak47"] as GunDef)?.name,
                img: getImage(GameObjectDefs["ak47"]),
                color: getHexColor(GameObjectDefs["ak47"]),
                kills: 10,
                deaths: 10,
                damageDealt: 10,
                damageTaken: 10,
            },
            {
                type: "fists",
                name: (GameObjectDefs["fists"] as GunDef)?.name,
                img: getImage(GameObjectDefs["fists"]),
                color: getHexColor(GameObjectDefs["fists"]),
                kills: 10,
                deaths: 10,
                damageDealt: 10,
                damageTaken: 10,
            },
        ]);
    },
);
