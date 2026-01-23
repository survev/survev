type GameStartListener = () => void;
type GameEndListener = () => void;
type PlayerDeathListener = () => void;
type PlayerShootListener = () => void;
type PlayerLocalShootListener = () => void;
type PlayerKillListener = () => void;
type PlayerHealListener = () => void;
type PlayerDamageListener = () => void;

export interface TextureOverrides {
    [key: string]: string; // key = texture ID, value = URL/path
};

export interface PlayerKills {
    totalKills: number;
};

export interface PlayerHealth {
    totalHealth: number;
};

export interface PlayerDamage {
    totalDamage: number;
};

export type InferredHealSource = "possiblyRegen" | "likelyItem";

export interface PlayerHeal {
    totalHeal: number;
    inferredSource?: InferredHealSource;
};

export interface PlayerHealRaw {
    totalHealRaw: number;
};

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
    const playerHealListeners: PlayerHealListener[] = [];
    const playerDamageListeners: PlayerDamageListener[] = [];
    const playerHealth: PlayerHealth = {
        totalHealth: 100,
    };
    const playerDamage: PlayerDamage = {
        totalDamage: 0,
    };
    const playerHeal: PlayerHeal = {
        totalHeal: 0,
        inferredSource: undefined,
    };
    const playerHealRaw: PlayerHealRaw = {
        totalHealRaw: 0
    }

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

        onLocalPlayerHeal(fn: PlayerHealListener) {
            playerHealListeners.push(fn);
        },

        onLocalPlayerDamage(fn: PlayerDamageListener) {
            playerDamageListeners.push(fn);
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

        getLocalPlayerHealth(): Readonly<PlayerHealth> {
            return { ...playerHealth };
        },

        getLocalPlayerDamage(): Readonly <PlayerDamage> {
            return { ...playerDamage };
        },

        getLocalPlayerHeal(): Readonly<PlayerHeal> {
            return { ...playerHeal };
        },

        getLocalPlayerHealRaw(): Readonly<PlayerHealRaw> {
            return { ...playerHealRaw };
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

        _emitLocalPlayerHeal() {
            for (const fn of playerHealListeners) fn();
        },

        _emitLocalPlayerDamage() {
            for (const fn of playerDamageListeners) fn();
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

        _setLocalPlayerHealth(totalHealth: number) {
            playerHealth.totalHealth = totalHealth;
        },

        _setLocalPlayerDamageAmount(totalDamage: number) {
            playerDamage.totalDamage = totalDamage;
        },
        // im probably going to forget this so heres a note for later doc writing
        // the setLocalPlayerHealAmount is what people use when they want a semi-filtered
        // heal readout meanwhile the raw one as the name implies is a raw readout
        // (now that I think of it this is probably hard to forget due to the name but anything can happen I guess...)
        _setLocalPlayerHealAmount(totalHeal: number, options?: { inferredSource?: InferredHealSource }) {
            playerHeal.totalHeal = totalHeal;
            playerHeal.inferredSource = options?.inferredSource;
        },

        _setLocalPlayerHealAmountRaw(totalHealRaw: number) {
            playerHealRaw.totalHealRaw = totalHealRaw;
        },

        // _set* internal hooks end
    });
}

export type ModAPI = ReturnType<typeof createModAPI>;
