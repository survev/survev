import { Google, generateCodeVerifier, generateState } from "arctic";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { Config } from "../../../../config";
import { cookieDomain, getRedirectUri, handleAuthUser } from "./authUtils";

const google = new Google(
    Config.secrets.GOOGLE_CLIENT_ID!,
    Config.secrets.GOOGLE_SECRET_ID!,
    getRedirectUri("google"),
);

const stateCookieName = "google_oauth_state";
const codeVerifierCookieName = "google_code_verifier";

export const GoogleRouter = new Hono();

GoogleRouter.use(async (c, next) => {
    if (!(Config.secrets.GOOGLE_CLIENT_ID && Config.secrets.GOOGLE_SECRET_ID)) {
        return c.text("Google login is not supported", 500);
    }
    await next();
});

GoogleRouter.get("/", (c) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "email"]);

    setCookie(c, stateCookieName, state, {
        //secure: process.env.NODE_ENV === "production",
        secure: false,
        path: "/",
        httpOnly: false,
        maxAge: 60 * 10,
        sameSite: "Lax",
        domain: cookieDomain,
    });

    setCookie(c, codeVerifierCookieName, codeVerifier, {
        //secure: process.env.NODE_ENV === "production",
        secure: false,
        path: "/",
        httpOnly: false,
        maxAge: 60 * 10,
        sameSite: "Lax",
        domain: cookieDomain,
    });

    return c.redirect(url);
});

GoogleRouter.get("/callback", async (c) => {
    const code = c.req.query("code")?.toString() ?? null;
    const state = c.req.query("state")?.toString() ?? null;

    const storedState = getCookie(c)[stateCookieName] ?? null;
    const storedCodeVerifier = getCookie(c)[codeVerifierCookieName];

    if (!code || !state || !storedCodeVerifier || !storedState || state !== storedState) {
        return c.json({}, 400);
    }

    const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: {
            Authorization: `Bearer ${tokens.accessToken()}`,
        },
    });

    const resData = (await response.json()) as {
        sub: string;
        email_verified: boolean;
    };

    if (!resData.email_verified) {
        return c.json({ error: "verified_email_required" }, 400);
    }

    await handleAuthUser(c, "google", resData.sub);

    return c.redirect(Config.oauthBasePath);
});
