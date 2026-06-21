import type { ConfigManager } from "$lib/modules/ConfigManager.svelte.ts";
import type { PassState, QuestState } from "../../shared/types/user.ts";
import type { Item, ItemStatus } from "../../shared/utils/loadout.ts";
import { type Loadout, loadout as loadouts } from "../../shared/utils/loadout.ts";
import { util } from "../../shared/utils/util.ts";
import { api } from "./api.ts";
import { errorLogManager } from "./errorLogs.ts";
import { helpers } from "./helpers.ts";
import { proxy } from "./proxy.ts";

import { hc } from "hono/client";
import type { UserRouterApp } from "../../server/src/api/routes/user/UserRouter.ts";

type UserRouter = ReturnType<typeof hc<UserRouterApp>>;

type AccountEventMap = {
    request: (account: Account) => void;
    requestsComplete: () => void;
    login: (account: Account) => void;
    loadout: (loadout: Loadout) => void;
    items: (items: Item[]) => void;
    error: (error: string, reason?: string) => void;
    pass: (pass: PassState, quests: QuestState[], resetRefresh: boolean) => void;
};

export class Account {
    events: Record<string, Array<(...args: any[]) => void>> = {};
    requestsInFlight = 0;
    loggingIn = false;
    loggedIn = false;
    profile = {
        linked: false,
        usernameSet: false,
        username: "",
        slug: "",
        usernameChangeTime: 0,
    };

    loadout = loadouts.defaultLoadout();
    items: Item[] = [];
    quests: QuestState[] = [];
    pass = {} as PassState;

    router: UserRouter;

    constructor(public config: ConfigManager) {
        this.router = hc<UserRouterApp>(api.resolveUrl("/api/user"), {
            init: {
                credentials: proxy.anyLoginSupported() ? "include" : "omit",
            },
        });
    }

    async fetchApi<Path extends keyof UserRouter>(
        path: Path,
        body: Parameters<UserRouter[Path]["$post"]>[0],
        cb: (
            error: null | any,
            res: Awaited<ReturnType<Awaited<ReturnType<UserRouter[Path]["$post"]>>["json"]>>,
        ) => void,
    ): Promise<void> {
        this.requestsInFlight++;
        this.emit("request", this);

        try {
            const res = await this.router[path].$post(body as any);
            const data = await res.json();
            cb(null, data as any);
        } catch (err) {
            cb(err, {} as any);
        }

        this.requestsInFlight--;
        this.emit("request", this);
        if (this.requestsInFlight == 0) {
            this.emit("requestsComplete");
        }
    }

    addEventListener<E extends keyof AccountEventMap>(
        event: E,
        callback: AccountEventMap[E],
    ) {
        this.events[event] = this.events[event] || [];
        this.events[event].push(callback);
    }

    removeEventListener<E extends keyof AccountEventMap>(
        event: E,
        callback: AccountEventMap[E],
    ) {
        const listeners = this.events[event] || [];
        for (let i = listeners.length - 1; i >= 0; i--) {
            if (listeners[i] == callback) {
                listeners.splice(i, 1);
            }
        }
    }

    emit<E extends keyof AccountEventMap>(event: E, ...args: Parameters<AccountEventMap[E]>): void {
        const listenersCopy = (this.events[event] || []).slice(0);
        for (let i = 0; i < listenersCopy.length; i++) {
            listenersCopy[i](...args);
        }
    }

    init() {
        if (this.config.get("sessionCookie")) {
            this.setSessionCookies();
        }

        if (helpers.getCookie("app-data")) {
            this.login();
            return;
        }

        this.emit("request", this);
        this.emit("items", []);

        const storedLoadout = this.config.get("loadout");
        this.loadout = util.mergeDeep({}, loadouts.defaultLoadout(), storedLoadout);
        this.emit("loadout", this.loadout);
    }

    setSessionCookies() {
        this.clearSessionCookies();
        document.cookie = this.config.get("sessionCookie")!;
        document.cookie = `app-data=${Date.now()}`;
    }

    clearSessionCookies() {
        document.cookie = "app-sid=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "app-data=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }

    login() {
        if (helpers.getCookie("app-data")) {
            this.loadProfile();
            this.getPass(true);
        }
    }

    logout() {
        this.config.set("profile", null);
        this.config.set("sessionCookie", null);
        this.config.set("loadout", loadouts.defaultLoadout());
        this.fetchApi("logout", {}, () => {
            window.location.reload();
        });
    }

    loadProfile() {
        this.loggingIn = !this.loggedIn;
        this.fetchApi("profile", {}, (err, data) => {
            const wasLogginIn = this.loggingIn;
            this.loggingIn = false;
            this.loggedIn = false;
            this.profile = {} as this["profile"];
            this.items = [];
            if (err) {
                errorLogManager.storeGeneric("account", "load_profile_error");
            } else if (data.banned) {
                this.emit("error", "account_banned", data.reason);
            } else if (data.success) {
                this.loggedIn = true;
                this.profile = data.profile;
                this.items = data.items;
                this.loadout = data.loadout;
                const profile = this.config.get("profile") || { slug: "" };
                profile.slug = data.profile.slug;
                this.config.set("profile", profile);
            }
            if (!this.loggedIn) {
                this.config.set("sessionCookie", null);
            }
            if (wasLogginIn && this.loggedIn) {
                this.emit("login", this);
            }
            this.emit("items", this.items);
            this.emit("loadout", this.loadout);
        });
    }

    resetStats() {
        this.fetchApi("reset_stats", {}, (err) => {
            if (err) {
                errorLogManager.storeGeneric("account", "reset_stats_error");
                this.emit("error", "server_error");
            }
        });
    }

    deleteAccount() {
        this.fetchApi("delete", {}, (err) => {
            if (err) {
                errorLogManager.storeGeneric("account", "delete_error");
                this.emit("error", "server_error");
                return;
            }
            this.config.set("profile", null);
            this.config.set("sessionCookie", null);
            window.location.reload();
        });
    }

    setUsername(username: string, callback: (err?: string) => void) {
        this.fetchApi("username", { json: { username } }, (err, res) => {
            if (err) {
                errorLogManager.storeGeneric("account", "set_username_error");
                callback(err);
                return;
            }
            if (res.result == "success") {
                this.loadProfile();
                callback();
            } else {
                callback(res.result);
            }
        });
    }

    setLoadout(loadout: Loadout) {
        // Preemptively set the new loadout and revert if the call fail
        const loadoutPrev = this.loadout;
        this.loadout = loadout;
        this.emit("loadout", this.loadout);
        this.config.set("loadout", loadout);

        if (!helpers.getCookie("app-data")) return;

        this.fetchApi("loadout", { json: { loadout } }, (err, res) => {
            if (err) {
                errorLogManager.storeGeneric("account", "set_loadout_error");
                this.emit("error", "server_error");
            }
            if (err || !res.loadout) {
                this.loadout = loadoutPrev;
            } else {
                this.loadout = res.loadout;
            }
            this.emit("loadout", this.loadout);
        });
    }

    setItemStatus(status: ItemStatus, itemTypes: string[]) {
        if (itemTypes.length != 0) {
            // Preemptively mark the item status as modified on our local copy
            for (let i = 0; i < itemTypes.length; i++) {
                const item = this.items.find((x) => {
                    return x.type == itemTypes[i];
                });
                if (item) {
                    item.status = Math.max(item.status!, status);
                }
            }

            this.emit("items", this.items);
            this.fetchApi("set_item_status", {
                json: {
                    status,
                    itemTypes,
                },
            }, (err) => {
                if (err) {
                    errorLogManager.storeGeneric("account", "set_item_status_error");
                }
            });
        }
    }

    getPass(tryRefreshQuests: boolean) {
        this.fetchApi("get_pass", { json: { tryRefreshQuests } }, (err, res) => {
            this.pass = {} as PassState;
            this.quests = [];
            if (err || !res.success) {
                errorLogManager.storeGeneric("account", "get_pass_error");
            } else {
                this.pass = res.pass || {} as PassState;
                this.quests = res.quests || [];
                this.quests.sort((a, b) => {
                    return a.idx - b.idx;
                });
                this.emit("pass", this.pass, this.quests, true);
                if (this.pass?.newItems) {
                    this.loadProfile();
                }
            }
        });
    }

    setPassUnlock(unlockType: string) {
        this.fetchApi("set_pass_unlock", { json: { unlockType } }, (err, res) => {
            if (err || !res.success) {
                errorLogManager.storeGeneric("account", "set_pass_unlock_error");
            } else {
                this.getPass(false);
            }
        });
    }

    refreshQuest(idx: number) {
        this.fetchApi("refresh_quest", { json: { idx } }, (err, res) => {
            if (err) {
                errorLogManager.storeGeneric("account", "refresh_quest_error");
                return;
            }
            if (res.success) {
                this.getPass(false);
            } else {
                // Give the pass UI a chance to update quests
                this.emit("pass", this.pass!, this.quests, false);
            }
        });
    }
}
