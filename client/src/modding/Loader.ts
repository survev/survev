import { createModAPI } from "./ModAPI";

// STRIP_FROM_PROD_CLIENT:START
const modAPI = createModAPI();

window.__MYGAME_MOD_API__ = modAPI;

// eventually replace fakeGameStart with well the actual game starting
const fakeGameStart = () => {
  console.log("Game starting...");
  modAPI._emitGameStart();
};

// simulate game start after 1 second (for testing)
setTimeout(fakeGameStart, 1000);

// example of replacing a local player texture
modAPI.setLocalPlayerTexture("playerSkin", "/textures/test-skin.png");

// and then using that here when GameStart fires pretty simple right?
modAPI.onGameStart(() => {
  console.log("ModAPI hook fired! Current textures:", modAPI.getLocalPlayerTextures());
});
// STRIP_FROM_PROD_CLIENT:END
