import { isMobile } from "pixi.js-legacy";
import { getParameterByName } from "./helpers";

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

function detectIE() {
    const ua = window.navigator.userAgent;
    const msie = ua.indexOf("MSIE ");
    const trident = ua.indexOf("Trident/");
    return msie > 0 || trident > 0;
}
function detectEdge() {
    return window.navigator.userAgent.indexOf("Edge/") > 0;
}
function detectiPhoneX() {
    return (
        detectiOS() &&
        ((screen.width == 375 && screen.height == 812) ||
            (screen.height == 375 && screen.width == 812) ||
            (screen.width == 414 && screen.height == 896) ||
            (screen.height == 414 && screen.width == 896))
    );
}

function getOs() {
    if (detectiOS()) return "ios";
    if (detectAndroid()) return "android";
    return "pc";
}

function getBrowser() {
    if (detectIE()) return "ie";
    if (detectEdge()) return "edge";
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

class Device {
    os: string;
    browser: string;
    model: string;
    pixelRatio = window.devicePixelRatio;
    version: string;
    mobile: boolean;
    tablet: boolean;
    touch: boolean;
    uiLayout: number;
    UiLayout = {
        Lg: 0,
        Sm: 1,
    };

    isLandscape = true;
    screenWidth = 0;
    screenHeight = 0;

    constructor() {
        this.os = getOs();
        this.browser = getBrowser();
        this.model = detectiPhoneX() ? "iphonex" : "unknown";
        const versionParam = getParameterByName("version");
        if (versionParam) {
            setItem("surviv_version", versionParam);
        }
        this.version = getItem("surviv_version") || "1.0.0";
        this.mobile = detectMobile();
        this.tablet = isMobile.tablet || isIpad();
        this.touch = this.mobile || this.tablet;

        this.uiLayout = this.mobile ? this.UiLayout.Sm : this.UiLayout.Lg;

        this.onResize();
    }

    onResize() {
        this.isLandscape =
            window.innerWidth > window.innerHeight ||
            window.orientation == 90 ||
            window.orientation == -90;
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        const layoutDim = this.isLandscape ? this.screenWidth : this.screenHeight;
        this.uiLayout =
            this.mobile || layoutDim <= 850 || (layoutDim <= 900 && this.pixelRatio >= 3)
                ? this.UiLayout.Sm
                : this.UiLayout.Lg;
    }
}

export const device = new Device();
