import $ from "jquery";

import type { MeleeDef } from "../../shared/defs/gameObjects/meleeDefs.ts";
import { type MapDefKey, MapDefs } from "../../shared/defs/mapDefs.ts";
import { GameObjectDefs } from "../../shared/defs/register.ts";
import * as net from "../../shared/net/net.ts";
import { util } from "../../shared/utils/util.ts";
import { device } from "./device.ts";

const truncateCanvas = document.createElement("canvas");

export function getParameterByName<T extends string>(name: string, url?: string): T {
    const searchParams = new URLSearchParams(url || window.location.search);
    return (searchParams.get(name) || "") as T;
}

export const helpers = {
    getParameterByName,
    getCookie: function(cname: string) {
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
    getGameModes: function() {
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
            const mapDef = MapDefs[mapKey as MapDefKey];
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
    sanitizeNameInput: function(input: string) {
        let name = input.trim();
        if (name.length > net.Constants.PlayerNameMaxLen) {
            name = name.substring(0, net.Constants.PlayerNameMaxLen);
        }
        return name;
    },
    colorToHexString: function(c: number) {
        return `#${`000000${c.toString(16)}`.slice(-6)}`;
    },
    colorToDOMString: function(color: number, alpha: number) {
        return `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, ${alpha})`;
    },
    htmlEscape: function(str = "") {
        return str
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    },
    truncateString: function(str: string, font: string, maxWidthPixels: number) {
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
    toggleFullScreen: function(clear?: boolean) {
        let elem = document.documentElement;
        if (
            document.fullscreenElement
            || document.mozFullScreenElement
            || document.webkitFullscreenElement
            || document.msFullscreenElement
            || clear
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
    copyTextToClipboard: function(text: string) {
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
    getSvgFromGameType: function(gameType: string) {
        const def = GameObjectDefs.typeToDefSafe(gameType);
        if (!def) return "";

        switch (def.type) {
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
                return `img/loot/${def.lootImg.sprite.slice(0, -4)}.svg`;
            }
            default:
                return "";
        }
    },
    getCssTransformFromGameType: function(gameType: string) {
        const def = GameObjectDefs.typeToDefSafe(gameType) as MeleeDef;
        let transform = "";
        if (def?.lootImg) {
            transform = `rotate(${def.lootImg.rot || 0}rad) scaleX(${def.lootImg.mirror ? -1 : 1})`;
        }
        return transform;
    },
    getSvgFilterForTint(tint: number) {
        if (tint === 0xffffff) return undefined;

        const rgb = util.intToRgb(tint);
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const filterId = `svg-tint-${tint}`;

        const filter = `<filter id="${filterId}" color-interpolation-filters="sRGB">\
<feColorMatrix in="SourceGraphic" type="matrix" \
values="\
${r} 0 0 0 0 \
0 ${g} 0 0 0 \
0 0 ${b} 0 0 \
0 0 0 1 0"/>\
</filter>`;

        // safari / webkit SUCKS and doesn't work with inline/or blob svg filters
        // so we need to append the filter to the document...
        if (navigator.userAgent.includes("Safari")) {
            if (!document.getElementById(filterId)) {
                let svgRoot = document.getElementById("tint-filter-svg-root") as unknown as SVGSVGElement | undefined;
                if (!svgRoot) {
                    svgRoot = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svgRoot.id = "tint-filter-svg-root";
                    svgRoot.style.display = "none";
                    document.body.append(svgRoot);
                }
                svgRoot.innerHTML += filter;
            }
            return `url(#${filterId})`;
        }

        const svg = encodeURI(`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg">${filter}</svg>`);
        return `url(${svg}#${filterId})`;
    },
    random64: function() {
        function r32() {
            return Math.floor(Math.random() * Math.pow(2, 32)).toString(16);
        }
        return r32() + r32();
    },
    abortSignal(timeout: number) {
        if ("timeout" in AbortSignal) {
            return AbortSignal.timeout(timeout);
        }
        const controller = new AbortController();

        setTimeout(() => {
            controller.abort(
                new DOMException("The operation timed out.", "TimeoutError"),
            );
        }, timeout);

        return controller.signal;
    },
    verifyTurnstile: function(enabled: boolean, cb: (token: string) => void) {
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
