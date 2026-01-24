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
    - [onPlayerDeath](#onplayerdeath)
    - [onPlayerShoot](#onplayershoot)
    - [onLocalPlayerShoot](#onlocalplayershoot)
    - [onPlayerKill](#onplayerkill)
    - [onLocalPlayerHeal](#onlocalplayerheal)
    - [onLocalPlayerDamage](#onlocalplayerdamage)
- [get* hooks](#get-hooks)
  - [Introduction to get* hooks](#introduction-to-get-hooks)
  - [Player info hooks](#player-info-hooks)
    - [getPlayerKills](#getplayerkills)
    - [getLocalPlayerHealth](#getlocalplayerhealth)
    - [getLocalPlayerDamage](#getlocalplayerdamage)
    - [getLocalPlayerHeal](#getlocalplayerheal)
    - [getLocalPlayerHealRaw](#getlocalplayerhealraw)


# on* hooks

## Introduction to on* hooks

## Game state hooks

### onGameStart

### onGameEnd

## Player state hooks

### onPlayerDeath

### onPlayerShoot

### onLocalPlayerShoot

### onPlayerKill

### onLocalPlayerHeal

### onLocalPlayerDamage

# get* hooks

## Introduction to get* hooks

## Player info hooks

### getPlayerKills

### getLocalPlayerHealth

### getLocalPlayerDamage

### getLocalPlayerHeal

### getLocalPlayerHealRaw