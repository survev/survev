import { afterEach, describe, expect, it, vi } from "vitest";
import { getFindGamePlayerData } from "../../server/src/api/apiHelpers.ts";
import { Config } from "../../server/src/config.ts";
import type { RoundRequest } from "../../server/src/ranked/coordinator.ts";
import { GameServerDuelHost } from "../../server/src/ranked/gameServerHost.ts";
import { loadout } from "../../shared/utils/loadout.ts";

vi.mock("../../server/src/config.ts", () => ({
    Config: {
        database: { enabled: true },
        regions: { test: { address: "game.example.test", https: true } },
        secrets: { SURVEV_API_KEY: "test-api-key" },
    },
}));
vi.mock("../../server/src/api/apiHelpers.ts", () => ({ getFindGamePlayerData: vi.fn() }));

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    Config.database.enabled = true;
});

describe("ranked allocation through the configured game server", () => {
    it("retains native identity and account loadouts while excluding normal quest progression", async () => {
        const request: RoundRequest = {
            seriesId: "series",
            roundId: "round",
            round: 1,
            teamSize: 1,
            region: "test",
            players: [
                { id: "native-one", name: "One", team: 0, ip: "127.0.0.1", joinToken: "one-token" },
                { id: "native-two", name: "Two", team: 1, ip: "127.0.0.2", joinToken: "two-token" },
            ],
        };
        const nativeLoadout = loadout.defaultLoadout();
        nativeLoadout.outfit = "outfitCobalt";
        vi.mocked(getFindGamePlayerData).mockImplementation(async players =>
            players.map(player => ({ ...player, loadout: nativeLoadout, quests: ["quest_kills"] }))
        );
        const fetch = vi.fn(async (_url: string, _options: RequestInit) =>
            Response.json({ gameId: "allocated", urls: ["wss://game.example.test/play"] })
        );
        vi.stubGlobal("fetch", fetch);
        await new GameServerDuelHost().create(request);
        const [, options] = fetch.mock.calls[0] as unknown as [string, RequestInit];
        const body = JSON.parse(String(options.body));
        expect(body.playerData[0]).toMatchObject({
            userId: "native-one",
            loadout: nativeLoadout,
            quests: [],
            duelProfileId: "native-one",
            duelTeam: 0,
            duelName: "One",
            joinToken: "one-token",
        });
        expect(body.playerData[1].userId).toBe("native-two");
        expect(fetch.mock.calls[0][0]).toBe("https://game.example.test/api/find_game");
    });

    it("keeps local identities out of PostgreSQL and does not allocate after a native account lookup failure", async () => {
        const request: RoundRequest = {
            seriesId: "series",
            roundId: "round",
            round: 1,
            teamSize: 1,
            region: "test",
            players: [
                { id: "local-one", name: "One", team: 0, ip: "127.0.0.1", joinToken: "one-token" },
                { id: "local-two", name: "Two", team: 1, ip: "127.0.0.2", joinToken: "two-token" },
            ],
        };
        const fetch = vi.fn(async (_url: string, _options: RequestInit) =>
            Response.json({ gameId: "allocated", urls: ["wss://game.example.test/play"] })
        );
        vi.stubGlobal("fetch", fetch);
        Config.database.enabled = false;
        await new GameServerDuelHost().create(request);
        expect(getFindGamePlayerData).not.toHaveBeenCalled();
        expect(
            JSON.parse(String(fetch.mock.calls[0][1].body)).playerData.map((player: { userId: string | null }) =>
                player.userId
            ),
        ).toEqual([null, null]);
        fetch.mockClear();
        Config.database.enabled = true;
        vi.mocked(getFindGamePlayerData).mockRejectedValue(new Error("Native accounts unavailable"));
        await expect(new GameServerDuelHost().create(request)).rejects.toThrow("Native accounts unavailable");
        expect(fetch).not.toHaveBeenCalled();
    });
});
