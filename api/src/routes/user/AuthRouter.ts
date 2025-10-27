import { OAuth2RequestError } from "arctic";
import { Hono } from "hono";
import { server } from "../../apiServer";
import { databaseEnabledMiddleware, rateLimitMiddleware } from "../../auth/middleware";
import { Config } from "../../config";
import { DiscordRouter } from "./auth/discord";
import { GoogleRouter } from "./auth/google";
import { MockRouter } from "./auth/mock";

export const AuthRouter = new Hono();

AuthRouter.onError((err, c) => {
    server.logger.error(`${c.req.path} Error:`, err);
    if (err instanceof OAuth2RequestError && err.message === "bad_verification_code") {
        // invalid code
        return c.json({ error: "bad_verification_code" }, 400);
    }
    return c.json({ error: "Internal Server Error" }, 500);
});

AuthRouter.use(databaseEnabledMiddleware);
AuthRouter.use(rateLimitMiddleware(5, 60 * 1000));

AuthRouter.route("/discord", DiscordRouter);
AuthRouter.route("/google", GoogleRouter);

if (Config.debug.allowMockAccount) {
    AuthRouter.route("/mock", MockRouter);
}
