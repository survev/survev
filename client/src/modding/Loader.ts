import { modAPI } from "./ModAPIInstance";

// I dont think I made this clear before but this file is essentially just dev testing so you can
// put like "fake mods" in here just to make sure the code works

// STRIP_FROM_PROD_CLIENT:START

modAPI.onGameStart(() => {
    console.log("the real onGameStart ModAPI hook fired!");
});

modAPI.on("gameEnd", () => {
    console.log("onGameEnd ModAPI hook fired!");
});

modAPI.on("localPlayerDeath", () => {
    console.log("onLocalPlayerDeath ModAPI hook fired!");
});

modAPI.on("playerShoot", () => {
    console.log("onPlayerShoot ModAPI hook fired!");
});

modAPI.on("localPlayerShoot", () => {
    console.log("onLocalPlayerShoot ModAPI hook fired!");
});

// I guess I can test these 2 at the same time... makes sense to me
// also im gonna stop adding the modAPI.getLocalPlayerTextures because well too much typing...
// but it will make a return once I actually hook it up

modAPI.on("localPlayerKill", () => {
    console.log("onLocalPlayerKill ModAPI hook fired");
    const totalKills = modAPI.getLocalPlayerKills();
    console.log(
        "getPlayerKills ModAPI hook reported:",
        totalKills.totalKills,
        "as the kill amount",
    );
});

modAPI.on("localPlayerHeal", () => {
    console.log("onLocalPlayerHeal ModAPI hook fired!");
    const newPlayerHealth = modAPI.getLocalPlayerHealth();
    const playerHealAmount = modAPI.getLocalPlayerHeal();
    // I should probably put this console.log behind a if statement checking
    // if inferredSource !== "possiblyRegen" because as is it produces a lot of console spam...
    // but eh I guess its fine it is just for testing after all :o
    console.log(
        "getLocalPlayerHealth ModAPI hook reported:",
        newPlayerHealth,
        "as the new health amount",
    );
    if (playerHealAmount.inferredSource !== "possiblyRegen") {
        console.log(
            "getLocalPlayerHeal ModAPI hook reported:",
            playerHealAmount.totalHeal,
            "as the amount of non regen health replenished",
        );
    }
});

modAPI.on("localPlayerDamage", () => {
    console.log("onLocalPlayerDamage ModAPI hook fired!");
    const newPlayerHealth = modAPI.getLocalPlayerHealth();
    const playerDamageTaken = modAPI.getLocalPlayerDamage();
    console.log(
        "getLocalPlayerHealth ModAPI hook reported:",
        newPlayerHealth,
        "as the new health amount",
    );
    console.log(
        "getLocalPlayerDamage ModAPI hook reported:",
        playerDamageTaken.totalDamage,
        "as the damage taken",
    );
});

// lots of testing time...
modAPI.on("localPlayerRemovedItem", () => {
    console.log("onLocalPlayerRemovedItem ModAPI hook fired!");
    const removedItem = modAPI.getLocalPlayerRemovedItem();
    console.log(
        "getLocalPlayerRemovedItem ModAPI hooke reported:",
        removedItem,
        "as the removed item",
    );
});

modAPI.on("localPlayerAddedItem", () => {
    console.log("onLocalPlayerAddedItem ModAPI hook fired!");
    const addedItem = modAPI.getLocalPlayerAddedItem();
    console.log(
        "getLocalPlayerAddedItem ModAPI hook reported:",
        addedItem,
        "as the added item",
    );
});

modAPI.on("localPlayerGearChange", () => {
    console.log("onLocalPlayerGearChange ModAPI hook fired!");
    const playerGear = modAPI.getLocalPlayerGear();
    console.log(
        "getLocalPlayerGear ModAPi hook reported:",
        playerGear,
        "as the current player gear",
    );
});

modAPI.on("localPlayerWeaponChange", () => {
    console.log("onLocalPlayerWeaponChange ModAPI hook fired!");
    const equippedWeapons = modAPI.getLocalPlayerWeapons();
    console.log(
        "getLocalPlayerWeapons ModAPI hook reported:",
        equippedWeapons,
        "as the equipped weapons",
    );
});
// STRIP_FROM_PROD_CLIENT:END
