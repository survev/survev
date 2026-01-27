# Introduction

Hi! This is a ModAPI created for survev.io, designed to provide a stable and predictable way for mods to interact with the game.

Mods interact with the game through event hooks (on*), read-only accessors (get*), and a small set of intentionally limited modification hooks (set*).

# How Mods Work

Mods register callbacks using on* hooks. These hooks fire in response to specific game events, allowing mods to react by running their own logic.

(Yes, you *can* try to make a dancing chicken appear each time someone dies. No judgement here...)

Mods can read certain pieces of game state using get* functions. All data returned by these functions is read-only and represents a snapshot of the current state.

(Think of it like looking through your neighbors window, nice view but you can't take their TV.)

In limited cases, mods may also modify certain aspects of the game using set* functions. These APIs are intentionally constrained to prevent instability or unintended side effects.

(Alas you cannot replace textures that other players (without your mod) would see. So your dream of making the whole map completely filled with water will have to wait...)

# History / Background

Historically mods for survev.io (and even surviv.io) relied on either monkeypatching what was needed, or if more powerful hooks were needed then entire code patching. While this allowed practically any type of reasonable mod to be created, these hooks were often brittle and prone to breaking upon updates.

The goal of this ModAPI project is to get rid of that brittleness, within reasonable boundaries, while still allowing mod authors plenty of creativity in their creations.

(Or, if we really wanted to go back to the stone age, we could create stuff like [this](https://github.com/chickenpoo351/Survev-Bundle-Patcher). An extreme example of automated code replacement for modding the game...)

# Table of Contents

- [on* hooks](#on-hooks)
  - [Introduction to on* hooks](#introduction-to-on-hooks)
  - [Game state hooks](#game-state-hooks)
    - [onGameStart](#ongamestart)
    - [onGameEnd](#ongameend)
  - [Player state hooks](#player-state-hooks)
    - [onLocalPlayerDeath](#onLocalplayerdeath)
    - [onPlayerShoot](#onplayershoot)
    - [onLocalPlayerShoot](#onlocalplayershoot)
    - [onLocalPlayerKill](#onlocalplayerkill)
    - [onLocalPlayerHeal](#onlocalplayerheal)
    - [onLocalPlayerDamage](#onlocalplayerdamage)
    - [onLocalPlayerInventoryItemChange](#onlocalplayerinventoryitemchange)
    - [onLocalPlayerHelmetChange](#onlocalplayerhelmetchange)
    - [onLocalPlayerChestChange](#onlocalplayerchestchange)
    - [onLocalPlayerBackpackChange](#onlocalplayerbackpackchange)
    - [onLocalPlayerOutfitChange](#onlocalplayeroutfitchange)
    - [onLocalPlayerGearChange](#onlocalplayergearchange)
    - [onLocalPlayerEquippedWeaponChange](#onlocalplayerequippedweaponchange)
    - [onLocalPlayerWeaponChange](#onlocalplayerweaponchange)
    - [onLocalPlayerWeaponAmmoUse](#onlocalplayerweaponammouse)
    - [onLocalPlayerWeaponAmmoGained](#onlocalplayerweaponammogained)
    - [onLocalPlayerRemovedItem](#onlocalplayerremoveditem)
    - [onLocalPlayerAddedItem](#onlocalplayeraddeditem)
- [get* hooks](#get-hooks)
  - [Introduction to get* hooks](#introduction-to-get-hooks)
  - [Player info hooks](#player-info-hooks)
    - [getLocalPlayerKills](#getlocalplayerkills)
    - [getLocalPlayerHealth](#getlocalplayerhealth)
    - [getLocalPlayerDamage](#getlocalplayerdamage)
    - [getLocalPlayerHeal](#getlocalplayerheal)
    - [getLocalPlayerHealRaw](#getlocalplayerhealraw)
    - [getLocalPlayerRemovedItem](#getlocalplayerremoveditem)
    - [getLocalPlayerAddedItem](#getlocalplayeraddeditem)
    - [getLocalPlayerHelmet](#getlocalplayerhelmet)
    - [getLocalPlayerChest](#getlocalplayerchest)
    - [getLocalPlayerBackpack](#getlocalplayerbackpack)
    - [getLocalPlayerOutfit](#getlocalplayeroutfit)
    - [getLocalPlayerLastChangedGear](#getlocalplayerlastchangedgear)
    - [getLocalPlayerGear](#getlocalplayergear)
    - [getLocalPlayerCurrentEquippedWeapon](#getlocalplayercurrentequippedweapon)
    - [getLocalPlayerLastChangedWeapon](#getlocalplayerlastchangedweapon)
    - [getLocalPlayerWeaponAmmoUsed](#getlocalplayerweaponammoused)
    - [getLocalPlayerWeaponAmmoGained](#getlocalplayerweaponammogained)
    - [getLocalPlayerWeapons](#getlocalplayerweapons)


# on* hooks

This section contains everything needed to know about on* type hooks.

## Introduction to on* hooks

on* hooks are quite simple once you get to know them, allow me to explain.

These hooks follow quite simple rules first off practically all of these hooks are used like this. 

    // onGameStart() hook used for example.
    // As well modAPI will be the object that will equal window.survevModAPI just for simplicity of the example of course though, you can name this anything you want or just use the window object.

    const modAPI = window.survevModAPI

    modAPI.onGameStart(() => {
      // Your logic here to run upon game start.
    })

As you can see it is really quite simple of course there are a few things you should know.

- First off, hooks are **synchronous**.

- Secondly, execution order **between multiple hooks** must not be relied upon.

Now what do those exactly mean? Lets start with hooks being synchronous.

What this means is if you have an example like this 

    const modAPI = window.survevModAPI

    modAPI.onGameStart(() => {
      // perhaps you have logic here to play a sound
    })

    modAPI.onGameStart(() => {
      // perhaps you have logic here to show an image
    })

These will *not* fire at the same time. Instead, each hook callback will execute only after the previous callback of the same type has finished executing.

The callbacks are executed in the **order they were registered**. However, because mod load and registration order is not guaranteed, you should **not rely on a specific execution order between multiple hooks**.
For this reason, it is generally recommended that you only use one on* hook of each type.

**Note**: Execution order is only predictable within a single script. If a user installs additional mods that use the same hooks, the order in which each mods callbacks run may differ.

## Game state hooks

This section contains every on* hook related to game state.

### onGameStart

**When does this fire?**  
Fires once at the start of a game round, after the game has initialized but before active gameplay begins.

**How often does it fire?**  
Once per game round.

**Common use cases**
- Initializing mod state
- Setting up UI elements
- Registering textures or assets
- Playing intro sounds or animations

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onGameStart(() => {
      // logic to run upon game start
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.

---

### onGameEnd

**When does this fire?**  
Fires once at the end of a game round, after active gameplay has ended.

**How often does it fire?**  
Once per game round.

**Common use cases**
- Preparing mod for menu interactions
- Setting up UI elements
- Registering textures or assets
- Playing exit sounds or animations

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onGameEnd(() => {
      // logic to run upon game end
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.

---

## Player state hooks

This section contains every on* hook related to the player.

### onLocalPlayerDeath

**When does this fire?**  
Fires once when the local player dies during a game round.

**How often does it fire?**  
Once per game round.

**Common use cases**
- Showing on screen effects
- Setting up UI elements
- Playing sound effects
- Gathering data

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerDeath(() => {
      // logic to run upon local player death
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.

---

### onPlayerShoot

**When does this fire?**  
Fires once when *any* player owned bullet is on screen.

**How often does it fire?**  
Once per bullet spawned on screen.

**Common use cases**
- Playing sound effects
- Bullet specific effects
- Data gathering

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onPlayerShoot(() => {
      // logic to run upon any bullet on screen
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.
- This hook is for any bullet on screen. View the [onLocalPlayerShoot](#onlocalplayershoot) hook if you want only local bullets.
- This hook can fire frequently during active combat. Keep logic lightweight to avoid performance issues.

---

### onLocalPlayerShoot

**When does this fire?**  
Fires once when any *local* player owned bullet is on screen.

**How often does it fire?**  
Once per local player owned bullet spawned on screen.

**Common use cases**
- Playing sound effects
- Bullet specific effects
- Data gathering

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerShoot(() => {
      // logic to run upon any local player bullet on screen
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.
- This hook is for local player bullets on screen. View the [onPlayerShoot](#onplayershoot) hook if you want any bullets.
- This hook can fire frequently during active combat. Keep logic lightweight to avoid performance issues.

---

### onLocalPlayerKill

**When does this fire?**  
Fires once when the local player is credited a kill.

**How often does it fire?**  
Once per credited local player kill.

**Common use cases**
- Updating UI elements
- Playing sound effects / animations
- Data gathering
- Kill streak tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerKill(() => {
      // logic to run upon local player kill
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.

---

### onLocalPlayerHeal

**When does this fire?**  
Fires once when the local player regains health, including healing items or regeneration.

**How often does it fire?**  
Once per tick of health regained.

**Common use cases**
- Updating UI elements
- Playing sound effects / animations
- Data gathering
- Health tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerHeal(() => {
      // logic to run upon local player heal
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.

---


### onLocalPlayerDamage

**When does this fire?**  
Fires once when the local player takes damage.

**How often does it fire?**  
Once per tick of health lost.

**Common use cases**
- Updating UI elements
- Playing sound effects / animations
- Data gathering
- Health tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerDamage(() => {
      // logic to run upon local player damage
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.

---

### onLocalPlayerInventoryItemChange

**When does this fire?**  
Fires once when an item in the inventory of the local player changes (added, removed, or updated).

**How often does it fire?**  
Once per inventory item changed.

**Common use cases**
- Updating UI elements
- Playing sound effects / animations
- Data gathering
- Inventory tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerInventoryItemChange(() => {
      // logic to run upon local player inventory item change
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.

---

### onLocalPlayerHelmetChange

**When does this fire?**  
Fires once when the local player's helmet changes (equipped, removed, or replaced).

**How often does it fire?**  
Once per helmet change.

**Common use cases**
- Updating UI elements
- Playing sound effects / animations
- Data gathering
- Gear tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerHelmetChange(() => {
      // logic to run upon local player helmet change
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.
- This hook is for a single gear change. View the [onLocalPlayerGearChange](#onlocalplayergearchange) hook if you want any gear change

---

### onLocalPlayerChestChange

**When does this fire?**  
Fires once when the local player’s chest changes (equipped, removed, or replaced).

**How often does it fire?**  
Once per chest change.

**Common use cases**
- Updating UI elements
- Playing sound effects or animations
- Data gathering
- Gear tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerChestChange(() => {
      // logic to run upon local player chest change
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.
- This hook is for a single gear change. View the [onLocalPlayerGearChange](#onlocalplayergearchange) hook if you want any gear change

---

### onLocalPlayerBackpackChange

**When does this fire?**  
Fires once when the local player’s backpack changes (equipped, removed, or replaced).

**How often does it fire?**  
Once per backpack change.

**Common use cases**
- Updating UI elements
- Playing sound effects or animations
- Data gathering
- Gear tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerBackpackChange(() => {
      // logic to run upon local player backpack change
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.
- This hook is for a single gear change. View the [onLocalPlayerGearChange](#onlocalplayergearchange) hook if you want any gear change

---

### onLocalPlayerOutfitChange

**When does this fire?**  
Fires once when the local player’s outfit changes (equipped, removed, or replaced).

**How often does it fire?**  
Once per outfit change.

**Common use cases**
- Updating UI elements
- Playing sound effects or animations
- Data gathering
- Gear tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerOutfitChange(() => {
      // logic to run upon local player outfit change
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.
- This hook is for a single gear change. View the [onLocalPlayerGearChange](#onlocalplayergearchange) hook if you want any gear change

---

### onLocalPlayerGearChange

**When does this fire?**  
Fires once when *any* of the local player’s gear changes (equipped, removed, or replaced).

**How often does it fire?**  
Once per gear change.

**Common use cases**
- Updating UI elements
- Playing sound effects or animations
- Data gathering
- Gear tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerGearChange(() => {
      // logic to run upon local player gear change
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.

---

### onLocalPlayerEquippedWeaponChange

**When does this fire?**  
Fires once when the local player’s equipped weapon changes (equipped, removed, or replaced).

**How often does it fire?**  
Once per equipped weapon change.

**Common use cases**
- Updating UI elements
- Playing sound effects or animations
- Data gathering
- Weapon tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerEquippedWeaponChange(() => {
      // logic to run upon local player equipped weapon change
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.
- This hook is only for the equipped weapon. View the [onLocalPlayerWeaponChange](#onlocalplayerweaponchange) hook for any weapon change.

---

### onLocalPlayerWeaponChange

**When does this fire?**  
Fires once when the local player’s weapon changes (equipped, removed, or replaced).

**How often does it fire?**  
Once per weapon change.

**Common use cases**
- Updating UI elements
- Playing sound effects or animations
- Data gathering
- Weapon tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerWeaponChange(() => {
      // logic to run upon local player weapon change
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.
- This hook is for any weapon change. View the [onLocalPlayerEquippedWeaponChange](#onlocalplayerequippedweaponchange) hook for the equipped weapon change.

---

### onLocalPlayerWeaponAmmoUse

**When does this fire?**  
Fires once when the local player’s weapon ammo is used.

**How often does it fire?**  
Once per weapon ammo change.

**Common use cases**
- Updating UI elements
- Playing sound effects or animations
- Data gathering
- Weapon ammo tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerWeaponAmmoUse(() => {
      // logic to run upon local player weapon ammo use
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.
- This hook can fire frequently during active combat. Keep logic lightweight to avoid performance issues.

---

### onLocalPlayerWeaponAmmoGained

**When does this fire?**  
Fires once when the local player’s weapon gains ammo.

**How often does it fire?**  
Once per weapon ammo change.

**Common use cases**
- Updating UI elements
- Playing sound effects or animations
- Data gathering
- Weapon ammo tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerWeaponAmmoGained(() => {
      // logic to run upon local player weapon ammo gained
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.
- This hook can fire frequently during active combat. Keep logic lightweight to avoid performance issues.

---

### onLocalPlayerRemovedItem

**When does this fire?**  
Fires once when an item in the local player's inventory is removed (dropped, used, etc).

**How often does it fire?**  
Once per item removed.

**Common use cases**
- Updating UI elements
- Playing sound effects or animations
- Data gathering
- Inventory tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerRemovedItem(() => {
      // logic to run upon local player removed item
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.

---

### onLocalPlayerAddedItem

**When does this fire?**  
Fires once when an item in the local player's inventory is added (picked up, given, etc).

**How often does it fire?**  
Once per item added.

**Common use cases**
- Updating UI elements
- Playing sound effects or animations
- Data gathering
- Inventory tracking

**Example use**
    
    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerAddedItem(() => {
      // logic to run upon local player added item
    })

**Notes**
- This hook is synchronous.
- Execution order between multiple mods is not guaranteed.

---

# get* hooks

This section contains everything needed to know about get* hooks.

## Introduction to get* hooks

get* hooks are the *read only* side of the ModAPI. They allow mods to **query the current game state at any time** without subscribing to events or modifying anything.

Unlike on* hooks, get* hooks do not fire automatically. Instead they return a snapshot of the current state **at the moment you call them**.

In other words:

- on* hooks tell you *when something happened*
- get* hooks tell you *what the state looks like right now*

If on* hooks are notifications, get* hooks are questions.

All get* hooks are simple function calls that immediantly return data as seen here.

    // getLocalPlayerKills and getLocalPlayerHealth used as examples
    const modAPI = window.survevModAPI

    const kills = modAPI.getLocalPlayerKills();
    const health = modAPI.getLocalPlayerHealth();

There is no registration, no callbacks, and no lifecycle to manage. Call them whenever you need information.

All values returned by get* hooks are read only. Modifying the returned data will not affect the game.

This is 100% intentional.

get* hooks return the current known state, not historical data.

For example:

- `getLocalPlayerHealth()` returns the *current* health value
- it does **not** tell *when* or *why* that health changed

If you need timing, historical data collection, or event context, combine get* hooks with on* hooks like so:

    // onLocalPlayerDamage and getLocalPlayerHealth used as examples

    const modAPI = window.survevModAPI

    modAPI.onLocalPlayerDamage(() => {
      const newHealth = modAPI.getLocalPlayerHealth();
      // now do whatever you like with that info
    })

This pattern of using on* and get* hooks is the recommended way to build most mods.

## Player info hooks

This section contains every get* hook related to the player.

### getLocalPlayerKills

### getLocalPlayerHealth

### getLocalPlayerDamage

### getLocalPlayerHeal

### getLocalPlayerHealRaw

### getLocalPlayerRemovedItem

### getLocalPlayerAddedItem

### getLocalPlayerHelmet

### getLocalPlayerChest

### getLocalPlayerBackpack

### getLocalPlayerOutfit

### getLocalPlayerLastChangedGear

### getLocalPlayerGear

### getLocalPlayerCurrentEquippedWeapon

### getLocalPlayerLastChangedWeapon

### getLocalPlayerWeaponAmmoUsed

### getLocalPlayerWeaponAmmoGained

### getLocalPlayerWeapons