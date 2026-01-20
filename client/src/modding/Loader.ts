import { modAPI } from "./ModAPIInstance";
// I dont think I made this clear before but this file is essentially just dev testing so you can
// put like "fake mods" in here just to make sure the code works

// STRIP_FROM_PROD_CLIENT:START


// example of replacing a local player texture
modAPI.setLocalPlayerTexture("playerSkin", "/textures/test-skin.png");

// and then using that here when GameStart fires pretty simple right?
modAPI.onGameStart(() => {
  console.log("onGameStart ModAPI hook fired! Current textures:", modAPI.getLocalPlayerTextures());
});

modAPI.onGameEnd(() => {
  console.log("onGameEnd ModAPI hook fired! Current textures:", modAPI.getLocalPlayerTextures());
})

modAPI.onPlayerDeath(() => {
  console.log("onPlayerDeath ModAPI hook fired! Current textures:", modAPI.getLocalPlayerTextures())
})
// STRIP_FROM_PROD_CLIENT:END
