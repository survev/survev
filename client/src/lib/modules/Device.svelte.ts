import { isMobile } from "pixi.js-legacy";
import { devicePixelRatio, innerHeight, innerWidth } from "svelte/reactivity/window";
import { helpers } from "./helpers.svelte.ts";

function detectMobile() {
    return isMobile.android.device || isMobile.apple.device || isIpad();
}

function isIpad() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes("ipad") || (ua.includes("macintosh") && "ontouchend" in document);
}

function detectiOS() {
    return isMobile.apple.phone || isMobile.apple.ipod;
}

function detectAndroid() {
    return isMobile.android.device;
}

function detectiPhoneX() {
    return (
        detectiOS()
        && ((screen.width == 375 && screen.height == 812)
            || (screen.height == 375 && screen.width == 812)
            || (screen.width == 414 && screen.height == 896)
            || (screen.height == 414 && screen.width == 896))
    );
}

function getOs() {
    if (detectiOS()) return "ios";
    if (detectAndroid()) return "android";

    return "pc";
}

function getBrowser() {
    return "unknown";
}

function setItem(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
    } catch (_e) {}
}

function getItem(key: string) {
    let item = null;

    try {
        item = localStorage.getItem(key);
    } catch (_e) {}

    return item;
}

export class Device {
    readonly UiLayout = {
        Lg: 0,
        Sm: 1,
    };

    readonly os = getOs();
    readonly browser = getBrowser();
    readonly model = detectiPhoneX() ? "iphonex" : "unknown";

    readonly version = getItem("surviv_version") || "1.0.0";

    readonly mobile = detectMobile();
    readonly tablet = isMobile.tablet || isIpad();
    readonly touch = this.mobile || this.tablet;

    uiLayout = $state(this.mobile ? this.UiLayout.Sm : this.UiLayout.Lg);
    debug = false; // unused?

    isLandscape = $state(true);

    readonly pixelRatio = $derived(devicePixelRatio.current ?? 1);
    readonly screenWidth = $derived(innerWidth.current ?? 0);
    readonly screenHeight = $derived(innerHeight.current ?? 0);

    constructor() {
        const versionParam = helpers.getParameterByName("version");
        if (versionParam) setItem("surviv_version", versionParam);

        this.version = getItem("surviv_version") || "1.0.0";

        this.onResize();
    }

    onResize() {
        this.isLandscape = window.innerWidth > window.innerHeight
            || window.screen.orientation.type === "landscape-primary"
            || window.screen.orientation.type === "landscape-secondary";

        const layoutDim = this.isLandscape ? this.screenWidth : this.screenHeight;
        this.uiLayout = this.mobile || layoutDim <= 850 || (layoutDim <= 900 && this.pixelRatio >= 3)
            ? this.UiLayout.Sm
            : this.UiLayout.Lg;
    }
}

export const device = new Device();
