type GameStartListener = () => void;
type GameEndListener = () => void;

export interface TextureOverrides {
  [key: string]: string; // key = texture ID, value = URL/path
}

export function createModAPI() {
  const gameStartListeners: GameStartListener[] = [];
  const gameEndListeners: GameEndListener[] = [];
  const textureOverrides: TextureOverrides = {};

  return Object.freeze({

    onGameStart(fn: GameStartListener) {
      gameStartListeners.push(fn);
    },

    onGameEnd(fn: GameEndListener) {
      gameEndListeners.push(fn);
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

    _getTextureOverrides() {
      return textureOverrides;
    },
  });
}

export type ModAPI = ReturnType<typeof createModAPI>;
