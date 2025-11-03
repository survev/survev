import $ from "jquery";
import { GameObjectDefs } from "../../shared/defs/gameObjectDefs";
import type { MeleeDef } from "../../shared/defs/gameObjects/meleeDefs";
import type { OutfitDef } from "../../shared/defs/gameObjects/outfitDefs";
import { MapDefs } from "../../shared/defs/mapDefs";
import * as net from "../../shared/net/net";
import { device } from "./device";

const truncateCanvas = document.createElement("canvas");

export function getParameterByName<T extends string>(name: string, url?: string): T {
    const searchParams = new URLSearchParams(url || window.location.search);
    return (searchParams.get(name) || "") as T;
}

export const helpers = {
    getParameterByName,
    getCookie: function (cname: string) {
        const name = `${cname}=`;
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(";");
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];

            while (c.charAt(0) == " ") {
                c = c.substring(1);
            }

            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    },
    getGameModes: function () {
        const gameModes: {
            mapId: number;
            desc: {
                buttonCss: string;
                icon: string;
                name: string;
            };
        }[] = [];

        // Gather unique mapIds and assosciated map descriptions from the list of maps
        const mapKeys = Object.keys(MapDefs);
        for (let i = 0; i < mapKeys.length; i++) {
            const mapKey = mapKeys[i];
            const mapDef = MapDefs[mapKey as keyof typeof MapDefs];
            if (
                !gameModes.find((x) => {
                    return x.mapId == mapDef.mapId;
                })
            ) {
                gameModes.push({
                    mapId: mapDef.mapId,
                    desc: mapDef.desc,
                });
            }
        }
        gameModes.sort((a, b) => {
            return a.mapId - b.mapId;
        });
        return gameModes;
    },
    sanitizeNameInput: function (input: string) {
        let name = input.trim();
        if (name.length > net.Constants.PlayerNameMaxLen) {
            name = name.substring(0, net.Constants.PlayerNameMaxLen);
        }
        return name;
    },
    colorToHexString: function (c: number) {
        return `#${`000000${c.toString(16)}`.slice(-6)}`;
    },
    colorToDOMString: function (color: number, alpha: number) {
        return `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${
            color & 255
        }, ${alpha})`;
    },
    htmlEscape: function (str = "") {
        return str
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    },
    truncateString: function (str: string, font: string, maxWidthPixels: number) {
        const context = truncateCanvas.getContext("2d")!;
        context.font = font;
        let truncated = str;
        for (
            let i = str.length;
            i > 0 && context.measureText(truncated).width > maxWidthPixels;
        ) {
            // Append an ellipses
            truncated = `${str.substring(0, --i)}…`;
        }
        return truncated;
    },
    toggleFullScreen: function (clear?: boolean) {
        let elem = document.documentElement;
        if (
            document.fullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement ||
            clear
        ) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                // overwrite the element (for IE)
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else {
                document.webkitExitFullscreen?.();
            }
        } else if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem = document.body;
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else {
            elem.webkitRequestFullscreen?.();
        }
    },
    copyTextToClipboard: function (text: string) {
        try {
            const $temp = $<HTMLInputElement>("<input>");
            $("body").append($temp);
            $temp.val(text);

            if (device.os == "ios") {
                const el = $temp.get(0)!;
                const editable = el.contentEditable;
                const readOnly = el.readOnly;
                el.contentEditable = "true";
                el.readOnly = true;
                const range = document.createRange();
                range.selectNodeContents(el);
                const sel = window.getSelection()!;
                sel.removeAllRanges();
                sel.addRange(range);
                el.setSelectionRange(0, 999999);
                el.contentEditable = editable;
                el.readOnly = readOnly;
            } else {
                $temp.trigger("select");
            }
            document.execCommand("copy");
            $temp.remove();
        } catch (_e) {}
    },
    formatTime(time: number) {
        const minutes = Math.floor(time / 60) % 60;
        let seconds: string | number = Math.floor(time) % 60;
        if (seconds < 10) {
            seconds = `0${seconds}`;
        }
        let timeSurv = "";
        timeSurv += `${minutes}:`;
        timeSurv += seconds;
        return timeSurv;
    },
    emoteImgToSvg(img: string) {
        return img && img.length > 4 ? `../img/emotes/${img.slice(0, -4)}.svg` : "";
    },
    getSvgFromGameType: function (gameType: string) {
        const def = GameObjectDefs[gameType] as any;
        const defType = def ? def.type : "";
        switch (defType) {
            case "gun":
            case "melee":
            case "throwable":
            case "heal":
            case "boost":
            case "helmet":
            case "chest":
            case "scope":
            case "backpack":
            case "perk":
            case "xp":
                return `img/loot/${def.lootImg?.sprite.slice(0, -4)}.svg`;
            case "heal_effect":
            case "boost_effect":
                return `img/particles/${def.texture?.slice(0, -4)}.svg`;
            case "emote":
                return `img/emotes/${def.texture.slice(0, -4)}.svg`;
            case "crosshair":
                return `img/crosshairs/${def.texture.slice(0, -4)}.svg`;
            case "outfit": {
                const lootImg = (def as OutfitDef).lootImg;
                if (lootImg.sprite !== "loot-shirt-01.img") {
                    return `img/loot/${lootImg.sprite.slice(0, -4)}.svg`;
                }

                // tint outfits using loot-shirt-01
                const outfitSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><path d="M63.993 8.15c-10.38 0-22.796 3.526-30.355 7.22-8.038 3.266-14.581 7.287-19.253 14.509C8.102 39.594 5.051 54.6 7.13 78.482c5.964 2.07 11.333 1.45 16.842-.415-1.727-7.884-1.448-15.764.496-22.204 2.126-7.044 6.404-12.722 12.675-13.701l2.77-.432.074 2.803c.054 2.043.09 4.17.116 6.335l.027 6.312c-.037 8.798-.382 18.286-1.277 27.845 5.637 1.831 14.806 2.954 23.964 3.019l4.597-.058c8.53-.275 16.742-1.449 21.665-3.063-1.093-14.65-1.166-29.434-1.52-41.334l-.097-3.283 3.18.824c6.238 1.617 10.55 7.376 12.76 14.507 2.02 6.51 2.353 14.37.64 22.248a29.764 29.764 0 0 0 12.847 1.181l4.399-.588c1.033-18.811-1.433-37.403-6.27-46.264l-4.408-6.376c-4.647-5.357-10.62-8.399-17.665-11.074-6.746-3.458-18.358-6.614-28.95-6.614zm0 3.05c6.494 0 13.37 1.942 19.274 4.516-3.123 2.758-6.971 4.665-11.067 5.754l-7.852 17.31-6.838-16.882c-4.757-.93-9.26-2.957-12.783-6.174C50.9 13.081 57.809 11.2 63.993 11.2zm.58 28.539l3.512 5.327-3.497 5.053-3.53-5.053zm0 11.888l3.512 5.328-3.497 5.052-3.53-5.053 3.514-5.327zm0 11.733l3.512 5.327-3.497 5.054-3.53-5.054zm0 11.876l3.512 5.327-3.497 5.054-3.53-5.053 3.514-5.327zm25.079 13.715c-6.61 2.055-15.829 2.907-25.277 2.951-9.5.045-18.965-.744-25.902-2.892-.205 1.785-.43 3.569-.678 5.347 5.968 2.132 16.346 3.408 26.497 3.36 10.143-.05 20.355-1.444 25.912-3.433a241.302 241.302 0 0 1-.552-5.333zm1.368 9.086c-6.782 2.308-16.533 3.262-26.53 3.31-2.935.015-5.866-.052-8.724-.213l-4.227-.315c-5.358-.5-10.307-1.382-14.329-2.758-.897 5.43-2.02 10.772-3.413 15.903 2.117 1.06 4.41 1.968 6.835 2.733l3.97 1.096c15.85 3.805 35.88 2.156 49.601-3.513-1.355-5.09-2.387-10.57-3.183-16.243z" fill="${this.colorToHexString(lootImg.tint)}"/></svg>`;

                return URL.createObjectURL(
                    new Blob([outfitSvg], { type: "image/svg+xml;charset=utf-8" }),
                );
            }
            default:
                return "";
        }
    },
    getCssTransformFromGameType: function (gameType: string) {
        const def = GameObjectDefs[gameType] as MeleeDef;
        let transform = "";
        if (def?.lootImg) {
            transform = `rotate(${def.lootImg.rot || 0}rad) scaleX(${
                def.lootImg.mirror ? -1 : 1
            })`;
        }
        return transform;
    },
    random64: function () {
        function r32() {
            return Math.floor(Math.random() * Math.pow(2, 32)).toString(16);
        }
        return r32() + r32();
    },
    verifyTurnstile: function (enabled: boolean, cb: (token: string) => void) {
        if (!enabled || !window.turnstile || !TURNSTILE_SITE_KEY) {
            cb("");
            return;
        }
        window.turnstile.render("#start-turnstile-container", {
            sitekey: TURNSTILE_SITE_KEY,
            appearance: "interaction-only",
            callback: (token: string) => {
                cb(token);
                window.turnstile.remove("#start-turnstile-container");
            },
        });
    },
};
