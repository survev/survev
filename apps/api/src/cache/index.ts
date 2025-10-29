import { util } from "@survev/shared/utils/util";
import { createClient } from "redis";
import { server } from "../apiServer";
import { Config } from "../config";

export const CACHE_TTL = util.daysToMs(3);

type RedisClientType = ReturnType<typeof createClient>;

let redisClient: RedisClientType;

export async function getRedisClient() {
    if (redisClient || !Config.cachingEnabled) {
        return redisClient;
    }
    const cacheInstance = createClient();

    cacheInstance.on("connect", () => server.logger.info("Connected to redis"));

    await cacheInstance.connect();
    redisClient = cacheInstance;
    return cacheInstance;
}

async function cleanupRedis() {
    if (!redisClient) return;
    await redisClient
        .disconnect()
        .catch((err) =>
            server.logger.info(
                `CacheStore - Error while disconnecting from redis: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`,
            ),
        );
}

process.on("exit", () => cleanupRedis);
