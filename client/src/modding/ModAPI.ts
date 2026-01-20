type GameStartListener = () => void;
type GameEndListener = () => void;
type PlayerDeathListener = () => void;
type PlayerShootListener = () => void;
type PlayerLocalShootListener = () => void;

export interface TextureOverrides {
  [key: string]: string; // key = texture ID, value = URL/path
}

export function createModAPI() {
  const gameStartListeners: GameStartListener[] = [];
  const gameEndListeners: GameEndListener[] = [];
  const playerDeathListeners: PlayerDeathListener[] = [];
  const playerShootListeners: PlayerShootListener[] = [];
  const playerLocalShootListeners: PlayerLocalShootListener[] = [];
  const textureOverrides: TextureOverrides = {};

  return Object.freeze({

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

    _getTextureOverrides() {
      return textureOverrides;
    },
  });
}

export type ModAPI = ReturnType<typeof createModAPI>;
