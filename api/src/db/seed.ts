import { MapId } from "@survev/shared/defs/types/misc";
import { TeamMode } from "@survev/shared/gameConfig";
import { util } from "@survev/shared/utils/util";
import { generateUsername } from "unique-username-generator";
import { createNewUser, generateId } from "../routes/user/auth/authUtils";
import { db } from ".";
import type { MatchDataTable } from "./schema";
import { matchDataTable } from "./schema";

const playersWithAccounts = Array.from({ length: 3000 }, (_, _idx) => ({
    slug: generateUsername(),
    userId: generateId(15),
}));

seed();
async function seed() {
    try {
        for (const { slug, userId } of playersWithAccounts) {
            await createNewUser({
                id: userId,
                authId: generateId(15),
                username: slug,
                linked: true,
                slug: slug,
            });
            for (let j = 0; j < util.randomInt(50, 100); j++) {
                const data = generateMatchHistory(userId, slug, util.randomInt(60, 80));
                await db.insert(matchDataTable).values(data);
            }
            console.log({ slug, userId });
        }
        console.log("Seeded database");
    } catch (error) {
        console.error("Failed to seed database", error);
    }
}

interface Player {
    killerIds: number[];
    killedBy: number | null;
    dead: boolean;
    id: number;
    teamId: number;
    rank: number;
    teamCount: number;
}

function generateMatchHistory(
    userId: string,
    slug: string,
    numPlayers = 70,
): MatchDataTable[] {
    const loggedInUsersInGame = shuffle([...playersWithAccounts]).splice(
        0,
        util.randomInt(12, 20),
    );
    const { teamMode, region, mapId, gameId, createdAt } = getRandomData();
    const maxTeamSize = teamMode;

    const players: Record<number, Player> = {};
    let _currTeamId = 0;
    let playersInTeam = 0;

    // Initialize players
    for (let id = 0; id < numPlayers; id++) {
        if (playersInTeam === maxTeamSize) {
            _currTeamId++;
            playersInTeam = 0;
        }
        playersInTeam++;

        players[id] = {
            killerIds: [],
            killedBy: null,
            dead: false,
            id,
            teamId: id,
            rank: 0,
            teamCount: 1,
        };
    }

    // Assign ranks and teams
    const alivePlayers = shuffle(Object.keys(players).map(Number));
    const teams = chunk(alivePlayers, maxTeamSize);
    for (let i = 0; i < teams.length; i++) {
        for (const playerId of teams[i]) {
            players[playerId].teamCount = teams[i].length;
            players[playerId].rank = i + 1;
            players[playerId].teamId = 101 + i;
        }
    }

    // Process kills
    for (const playerId of Object.keys(players).map(Number)) {
        if (alivePlayers.length <= 1) break;

        const kills = weightedRandom([
            { value: 0, weight: 0.6 },
            { value: util.randomInt(1, 3), weight: 0.3 },
            {
                value: util.randomInt(3, Math.min(10, alivePlayers.length - 1)),
                weight: 0.05,
            },
        ]);

        if (kills === 0) continue;

        const playersToKill = alivePlayers
            .filter((id) => id !== playerId)
            .slice(0, kills);

        alivePlayers.splice(0, kills);

        for (const killed of playersToKill) {
            players[killed].dead = true;
            players[killed].killedBy = playerId;
            players[playerId].killerIds.push(killed);
        }
    }

    return shuffle(Object.values(players)).map((player, i) => {
        const isLoggedIn = i != 0 && loggedInUsersInGame.length;
        const loggedInUser = isLoggedIn
            ? loggedInUsersInGame.pop()!
            : {
                  slug: null,
                  userId: generateId(15),
              };
        const playerUserId = Math.random() < 0.3 ? loggedInUser?.userId : null;
        const playerSlug = Math.random() < 0.3 ? loggedInUser?.slug : null;

        return {
            mapId,
            region,
            createdAt,
            teamTotal: teams.length,
            teamCount: player.teamCount,
            teamMode,
            gameId,
            mapSeed: util.randomInt(0, 1 << 30),
            userId: 0 === i ? userId : playerUserId,
            slug: 0 === i ? slug : playerSlug,
            username: generateUsername(),
            playerId: player.id,
            teamId: player.teamId,
            timeAlive: util.randomInt(10, 120),
            rank: player.rank,
            died: player.dead,
            kills: player.killerIds.length,
            damageDealt:
                player.killerIds.length * util.randomInt(70, 120) +
                util.randomInt(40, 100),
            damageTaken: util.randomInt(100, 300),
            killerId: player.killedBy ?? 0,
            killedIds: player.killerIds,
        };
    }) satisfies MatchDataTable[];
}

function getRandomData() {
    const date = new Date();
    return {
        mapId: getRandomItem([MapId.Desert, MapId.Main, MapId.Woods]),
        gameId: crypto.randomUUID(),
        createdAt: new Date(date.setDate(date.getDate() - util.randomInt(0, 20))),
        region: getRandomItem(["na", "eu", "as"]),
        teamMode: weightedRandom([
            { value: TeamMode.Solo, weight: 0.4 },
            { value: TeamMode.Duo, weight: 0.4 },
            { value: TeamMode.Squad, weight: 0.2 },
        ]),
    };
}

// Helper functions
function getRandomItem<const T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function shuffle<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
}

function chunk<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
        array.slice(i * size, i * size + size),
    );
}

function weightedRandom<T>(options: { value: T; weight: number }[]): T {
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;

    for (const option of options) {
        random -= option.weight;
        if (random <= 0) return option.value;
    }
    return options[0].value;
}
