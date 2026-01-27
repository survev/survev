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

### onLocalPlayerDeath

### onPlayerShoot

### onLocalPlayerShoot

### onLocalPlayerKill

### onLocalPlayerHeal

### onLocalPlayerDamage

### onLocalPlayerInventoryItemChange

### onLocalPlayerHelmetChange

### onLocalPlayerChestChange

### onLocalPlayerBackpackChange

### onLocalPlayerOutfitChange

### onLocalPlayerGearChange

### onLocalPlayerEquippedWeaponChange

### onLocalPlayerWeaponChange

### onLocalPlayerWeaponAmmoUse

### onLocalPlayerWeaponAmmoGained

### onLocalPlayerRemovedItem

### onLocalPlayerAddedItem

# get* hooks

## Introduction to get* hooks

## Player info hooks

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