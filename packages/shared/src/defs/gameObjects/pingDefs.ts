export interface PingDef {
    readonly type: "ping";
    texture?: string;
    mapTexture?: string;
    sound?: string;
    soundLeader?: string;
    pingMap?: boolean;
    pingLife?: number;
    mapLife?: number;
    mapEvent?: boolean;
    worldDisplay?: boolean;
    tint?: number;
}

export const PingDefs: Record<string, PingDef> = {
    ping_danger: {
        type: "ping",
        texture: "ping-team-danger.img",
        mapTexture: "ping-map-danger.img",
        sound: "ping_danger_01",
        soundLeader: "ping_leader_01",
        pingMap: true,
        pingLife: 4,
        mapLife: 4,
        mapEvent: false,
        worldDisplay: true,
    },
    ping_coming: {
        type: "ping",
        texture: "ping-team-coming.img",
        mapTexture: "ping-map-coming.img",
        sound: "ping_coming_01",
        soundLeader: "ping_leader_01",
        pingMap: true,
        pingLife: 4,
        mapLife: 300,
        mapEvent: false,
        worldDisplay: true,
    },
    ping_help: {
        type: "ping",
        texture: "ping-team-help.img",
        mapTexture: "ping-map-help.img",
        sound: "ping_help_01",
        soundLeader: "ping_leader_01",
        pingMap: true,
        pingLife: 4,
        mapLife: 4,
        mapEvent: false,
        worldDisplay: true,
    },
    ping_airdrop: {
        type: "ping",
        texture: "ping-team-airdrop.img",
        mapTexture: "ping-map-airdrop.img",
        sound: "ping_airdrop_01",
        pingMap: true,
        pingLife: 4,
        mapLife: 10,
        mapEvent: true,
        worldDisplay: false,
        tint: 0xff6600,
    },
    ping_airstrike: {
        type: "ping",
        texture: "ping-team-airstrike.img",
        mapTexture: "ping-map-airstrike.img",
        sound: "ping_airstrike_01",
        pingMap: true,
        pingLife: 2,
        mapLife: 2,
        mapEvent: true,
        worldDisplay: true,
        tint: 0xeaff00,
    },
    ping_woodsking: {
        type: "ping",
        texture: "player-king-woods.img",
        mapTexture: "ping-map-woods-king.img",
        sound: "helmet03_forest_pickup_01",
        pingMap: true,
        pingLife: 4,
        mapLife: 10,
        mapEvent: true,
        worldDisplay: false,
        tint: 0x12ff00,
    },
    ping_unlock: {
        type: "ping",
        texture: "ping-team-unlock.img",
        mapTexture: "ping-map-unlock.img",
        sound: "ping_unlock_01",
        pingMap: true,
        pingLife: 4,
        mapLife: 10,
        mapEvent: true,
        worldDisplay: false,
        tint: 0xd8ff,
    },
};
