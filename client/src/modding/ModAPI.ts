type GameStartListener = () => void;
type GameEndListener = () => void;
type PlayerDeathListener = () => void;
type PlayerShootListener = () => void;
type PlayerLocalShootListener = () => void;
type PlayerKillListener = () => void;

export interface TextureOverrides {
    [key: string]: string; // key = texture ID, value = URL/path
}

export interface PlayerKills {
    totalKills: number;
}

export function createModAPI() {
    const gameStartListeners: GameStartListener[] = [];
    const gameEndListeners: GameEndListener[] = [];
    const playerDeathListeners: PlayerDeathListener[] = [];
    const playerShootListeners: PlayerShootListener[] = [];
    const playerLocalShootListeners: PlayerLocalShootListener[] = [];
    const playerKillListeners: PlayerKillListener[] = [];
    const textureOverrides: TextureOverrides = {};
    const playerKills: PlayerKills = {
        totalKills: 0,
    };

    return Object.freeze({
        // on* hooks start
        onGameStart(fn: GameStartListener) {
            gameStartListeners.push(fn);
        },

        onGameEnd(fn: GameEndListener) {
            gameEndListeners.push(fn);
        },

        onPlayerDeath(fn: PlayerDeathListener) {
            playerDeathListeners.push(fn);
        },

        onPlayerShoot(fn: PlayerShootListener) {
            playerShootListeners.push(fn);
        },

        onLocalPlayerShoot(fn: PlayerLocalShootListener) {
            playerLocalShootListeners.push(fn);
        },

        onPlayerKill(fn: PlayerKillListener) {
            playerKillListeners.push(fn);
        },

        // on* hooks end
        /**
         * @param textureId string ID of the texture
         * @param url path/URL to the texture
         */
        setLocalPlayerTexture(textureId: string, url: string) {
            textureOverrides[textureId] = url;
        },

        getLocalPlayerTextures(): Readonly<TextureOverrides> {
            return { ...textureOverrides };
        },

        getPlayerKills(): Readonly<PlayerKills> {
            return { ...playerKills };
        },

        // _emit* internal hooks start

        _emitGameStart() {
            for (const fn of gameStartListeners) fn();
        },

        _emitGameEnd() {
            for (const fn of gameEndListeners) fn();
        },

        _emitPlayerDeath() {
            for (const fn of playerDeathListeners) fn();
        },

        _emitPlayerShoot() {
            for (const fn of playerShootListeners) fn();
        },

        _emitLocalPlayerShoot() {
            for (const fn of playerLocalShootListeners) fn();
        },

        _emitPlayerKill() {
            for (const fn of playerKillListeners) fn();
        },

        // _emit* internal hooks end

        // _get* internal hooks start

        _getTextureOverrides() {
            return textureOverrides;
        },

        // _get* internal hooks end

        // _set* internal hooks start
        _setPlayerKills(totalKills: number) {
            playerKills.totalKills = totalKills;
        },

        // _set* internal hooks end
    });
}

export type ModAPI = ReturnType<typeof createModAPI>;
