import { Atlases } from "../../client/atlas-builder/atlasDefs";
import { type MapDef, MapDefs } from "../../shared/defs/mapDefs";
import { MapObjectDefs } from "../../shared/defs/mapObjectDefs";
import type { BuildingDef, ObstacleDef } from "../../shared/defs/mapObjectsTyping";

export function getAllAtlasSprites(map: keyof typeof MapDefs) {
    const def = MapDefs[map] as MapDef;
    const sprites = new Set();

    for (const atlas of def.assets.atlases) {
        const atlasDef = Atlases[atlas];
        for (const image of atlasDef.images) {
            const key = `${image.split("/").at(-1)!.split(".").at(-2)}.img`;
            sprites.add(key);
        }
    }
    return sprites;
}

function getObstacleSprites(type: string, sprites: Set<string>) {
    const def = MapObjectDefs[type] as ObstacleDef;

    if (def.img.sprite) {
        sprites.add(def.img.sprite);
    }
    if (def.img.residue) {
        sprites.add(def.img.residue);
    }

    if (def.door?.casingImg) {
        sprites.add(def.door.casingImg.sprite);
    }

    if (def.button?.useImg) {
        sprites.add(def.button.useImg);
    }
    if (def.button?.offImg) {
        sprites.add(def.button.offImg);
    }

    if (def.destroyType) {
        getObjSprites(def.destroyType, sprites);
    }
}

function getBuildingSprites(type: string, sprites: Set<string>) {
    const def = MapObjectDefs[type] as BuildingDef;

    for (const sprite of def.ceiling.imgs) {
        sprites.add(sprite.sprite);
    }
    for (const sprite of def.floor.imgs) {
        sprites.add(sprite.sprite);
    }
    if (def.ceiling.destroy?.residue) {
        sprites.add(def.ceiling.destroy.residue);
    }
    for (const obj of def.mapObjects) {
        if (obj.type) {
            const types = [];
            if (typeof obj.type === "string") {
                types.push(obj.type);
            } else if (typeof obj.type == "object") {
                types.push(...Object.keys(obj.type));
            }
            for (const t of types) {
                getObjSprites(t, sprites);
            }
        }
    }
}

function getObjSprites(type: string, sprites: Set<string>) {
    if (!type) return;
    const def = MapObjectDefs[type];
    if (!def) return;

    switch (def.type) {
        case "obstacle":
            getObstacleSprites(type, sprites);
            break;
        case "building":
            getBuildingSprites(type, sprites);
            break;
        case "structure":
            break;
    }
}

export function getAllMapSprites(map: keyof typeof MapDefs) {
    const def = MapDefs[map] as MapDef;
    const sprites = new Set<string>();

    for (const c of def.gameConfig.planes.crates) {
        getObjSprites(c.name, sprites);
    }
    const mapGen = def.mapGen;

    if (mapGen.bridgeTypes.medium) {
        getObjSprites(mapGen.bridgeTypes.medium, sprites);
    }
    if (mapGen.bridgeTypes.large) {
        getObjSprites(mapGen.bridgeTypes.large, sprites);
    }
    if (mapGen.bridgeTypes.xlarge) {
        getObjSprites(mapGen.bridgeTypes.xlarge, sprites);
    }

    for (const type of mapGen.customSpawnRules.placeSpawns) {
        getObjSprites(type, sprites);
    }

    for (const type in mapGen.densitySpawns[0]) {
        getObjSprites(type, sprites);
    }
    for (const type in mapGen.fixedSpawns[0]) {
        getObjSprites(type, sprites);
    }

    for (const spawn of mapGen.randomSpawns) {
        for (const type of spawn.spawns) {
            getObjSprites(type, sprites);
        }
    }

    for (const [, replacement] of Object.entries(mapGen.spawnReplacements[0])) {
        getObjSprites(replacement, sprites);
    }

    const biome = def.biome;
    if (biome.airdrop) {
        sprites.add(biome.airdrop.planeImg);
        sprites.add(biome.airdrop.airdropImg);
    }

    if (biome.frozenSprites) {
        for (const sprite of biome.frozenSprites) {
            sprites.add(sprite);
        }
    }

    sprites.delete("");
    sprites.delete("none");

    return sprites;
}
