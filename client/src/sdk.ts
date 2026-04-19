import $ from "jquery";

declare global {
    interface Window {
        CrazyGames: any;
        PokiSDK: any;
        SDK_OPTIONS: any;
        sdk: any;
    }
}

// Prevent Iframe issues
if (window.self !== window.top) {
    function preventScroll(event: Event): void {
        let target = event.target as HTMLElement | null;

        while (target && target !== document.body) {
            const overflowY = getComputedStyle(target).overflowY;

            const scrollable = overflowY === "auto" || overflowY === "scroll";

            if (scrollable) {
                return;
            }

            target = target.parentElement;
        }

        event.preventDefault();
    }

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });

    // Prevent keys scroll
    document.addEventListener("keydown", (event) => {
        const keysToPrevent = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];

        if (keysToPrevent.includes(event.key)) {
            const target = event.target as HTMLElement;

            const allowedTags = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"];

            if (
                event.key === " " &&
                (allowedTags.includes(target.tagName) || target.isContentEditable)
            ) {
                return;
            }

            event.preventDefault();
        }
    });
}

function isWithinGameMonetize(): boolean {
    try {
        if (window !== window.parent && document.referrer) {
            const parentOrigin = new URL(document.referrer).origin;
            return parentOrigin.includes("gamemonetize");
        }
        return window.location.href.includes("gamemonetize");
    } catch (error) {
        console.error("Error in isWithinGameMonetize:", error);
        return window.location.href.includes("gamemonetize");
    }
}

function isWithinCrazyGames(): boolean {
    const urlParams = new URLSearchParams(self.location.search);
    return urlParams.has("crazygames");
}

function isWithinPoki(): boolean {
    try {
        if (window !== window.parent && document.referrer) {
            const parentOrigin = new URL(document.referrer).origin;
            return parentOrigin.includes("poki");
        }
        return false;
    } catch (error) {
        console.error("Error in isWithinPoki:", error);
        return false;
    }
}

class SDKManager {
    isPoki = isWithinPoki();
    isCrazyGames = isWithinCrazyGames();
    isGameMonetize = isWithinGameMonetize();
    isAnySDK: boolean;

    respawns: number[] = [];

    adCallback = () => {};

    constructor() {
        this.isAnySDK = this.isPoki || this.isCrazyGames || this.isGameMonetize;
    }

    async init() {
        if (this.isAnySDK) {
            $("#btn-start-fullscreen").hide();

            $("#left-column").hide();
            $("#btn-discord-top-right").show();
            $(".surviv-shirts")
                .css("background-image", "url(./img/discord-promo.png)")
                .html(`<a href="https://discord.gg/6uRdCdkTPt" target="_blank"></a>`);
        } else {
            $(".btn-kofi").show();
            $(".surviv-shirts")
                .css("background-image", "url(./img/survev-kofi.png)")
                .html(`<a href="https://ko-fi.com/survev" target="_blank"></a>`);
        }

        if (this.isPoki) {
            await this.initPoki();
        } else if (this.isGameMonetize) {
            this.initGameMonetize();
        } else if (this.isCrazyGames) {
            await this.initCrazyGames();
        }
    }

    disableBloodParticles() {
        return this.isCrazyGames;
    }

    gameLoadComplete() {
        if (this.isPoki) {
            window.PokiSDK.gameLoadingFinished();
        }
    }

    gamePlayStart() {
        if (this.isCrazyGames) {
            window.CrazyGames.SDK.game.gameplayStart();
        } else if (this.isPoki) {
            window.PokiSDK.gameplayStart();
        }
    }
    gamePlayStop() {
        if (this.isCrazyGames) {
            window.CrazyGames.SDK.game.gameplayStop();
        } else if (this.isPoki) {
            window.PokiSDK.gameplayStop();
        }
    }

    requestMidGameAd(callback: () => void): void {
        if (this.isPoki) {
            this.requestPokiMidGameAd(callback);
        } else if (this.isGameMonetize) {
            this.requestGameMonetizeMidgameAd(callback);
        } else if (this.isCrazyGames) {
            this.requestCrazyGamesMidGameAd(callback);
        } else {
            callback();
        }
    }

    async getPlayerName(): Promise<string | undefined> {
        if (this.isCrazyGames && window.CrazyGames.SDK.user.isUserAccountAvailable) {
            const user = await window.CrazyGames.SDK.user.getUser();
            if (user) {
                return user.username;
            }
        }
        return undefined;
    }

    hideInviteButton() {
        if (this.isCrazyGames) {
            window.CrazyGames.SDK.game.hideInviteButton();
        }
    }

    showInviteButton(roomID: string) {
        if (this.isCrazyGames) {
            window.CrazyGames.SDK.game.showInviteButton({
                roomID,
            });
        }
    }

    supportsInviteLink() {
        return this.isCrazyGames || this.isPoki;
    }

    async getInviteLink(roomID: string): Promise<string | undefined> {
        if (this.isCrazyGames) {
            return window.CrazyGames.SDK.game.inviteLink({
                roomID,
            });
        }
        if (this.isPoki) {
            return await window.PokiSDK.shareableURL({
                roomID,
            });
        }
        return undefined;
    }

    getRoomInviteParam() {
        if (this.isCrazyGames) {
            return window.CrazyGames.SDK.game.getInviteParam("roomID");
        }
        if (this.isPoki) {
            return window.PokiSDK.getURLParam("roomID");
        }
        return undefined;
    }

    async requestAd(ad: string): Promise<void> {
        if (this.isCrazyGames) {
            const dimensions = ad.split("x").map(Number);
            await this.requestCrazyGamesBanner(
                `${AIP_PLACEMENT_ID}_${ad}`,
                dimensions[0],
                dimensions[1],
            );
        }
    }

    removeAllAds() {
        if (this.isCrazyGames) {
            window.CrazyGames.SDK.banner.clearAllBanners();
        }
    }

    private requestCrazyGamesMidGameAd(callback: () => void): void {
        const callbacks = {
            adFinished: callback,
            adError: callback,
            adStarted: () => console.log("Start midgame ad"),
        };

        window.CrazyGames.SDK.ad.requestAd("midgame", callbacks);
    }

    private requestGameMonetizeMidgameAd(callback: () => void): void {
        if (window.sdk && window.sdk.showBanner) {
            window.sdk.showBanner();
            this.adCallback;
        } else {
            callback();
        }
    }

    private requestPokiMidGameAd(callback: () => void): void {
        window.PokiSDK.commercialBreak(() => {
            // you can pause any background music or other audio here
        }).then(() => {
            callback();
        });
    }

    private initGameMonetize() {
        const gameMonetizeScript = document.createElement("script");
        gameMonetizeScript.src = "https://api.gamemonetize.com/sdk.js";
        gameMonetizeScript.id = "gamemonetize-sdk";
        document.head.appendChild(gameMonetizeScript);

        window.SDK_OPTIONS = {
            gameId: import.meta.env.VITE_GAMEMONETIZE_ID,
            onEvent: (event: any) => {
                switch (event.name) {
                    case "SDK_GAME_START":
                        this.adCallback();
                        this.adCallback = () => {};
                        break;
                    case "SDK_READY":
                        console.log("Successfully loaded GameMonetize SDK"); // never happens for some reasons
                        break;
                }
            },
        };
    }

    private initPoki(): Promise<void> {
        return new Promise(function (resolve) {
            const pokiScript = document.createElement("script");
            pokiScript.src = "https://game-cdn.poki.com/scripts/v2/poki-sdk.js";
            document.head.appendChild(pokiScript);

            pokiScript.addEventListener("load", () => {
                window.PokiSDK.init()
                    .then(() => {
                        console.log("Poki SDK successfully initialized");
                    })
                    .catch(() => {
                        console.log(
                            "Initialized, something went wrong, load you game anyway",
                        );
                    });

                resolve();
            });
        });
    }

    private initCrazyGames(): Promise<void> {
        return new Promise((resolve, reject) => {
            const crazyGamesScript = document.createElement("script");
            crazyGamesScript.src = "https://sdk.crazygames.com/crazygames-sdk-v3.js";
            document.head.appendChild(crazyGamesScript);

            crazyGamesScript.addEventListener("load", async () => {
                await window.CrazyGames.SDK.init();

                this.requestCrazyGamesBanner(`${AIP_PLACEMENT_ID}_728x90`, 728, 90);

                setInterval(() => {
                    const mainMenu = document.getElementById("start-menu-wrapper");

                    if (getComputedStyle(mainMenu!).display != "none") {
                        this.requestCrazyGamesBanner(
                            `${AIP_PLACEMENT_ID}_728x90`,
                            728,
                            90,
                        );
                    }
                }, 60000);

                resolve();
            });

            crazyGamesScript.addEventListener("error", () => {
                console.log("CrazyGames SDK load error");

                reject();
            });
        });
    }

    private async requestCrazyGamesBanner(
        element: string,
        width: number,
        height: number,
    ): Promise<void> {
        try {
            await window.CrazyGames.SDK.banner.requestBanner({
                id: element,
                width: width,
                height: height,
            });
        } catch (e) {
            console.log("Banner request error", e);
        }
    }
}

export const SDK = new SDKManager();
