declare global {
    interface Navigator {
        standalone?: boolean;
        userLanguage: string;
    }

    interface JQuery<TElement = HTMLElement> extends Iterable<TElement> {
        html(
            htmlString_function:
                | number /** Allow for number values to be passed */
                | JQuery.htmlString
                | JQuery.Node
                | ((
                      this: TElement,
                      index: number,
                      oldhtml: JQuery.htmlString,
                  ) => JQuery.htmlString | JQuery.Node),
        ): this;
    }

    interface Window {
        mobile?: boolean;
        webkitAudioContext?: AudioContext;
        CP: any;

        fusetag?: {
            que: Array<() => any>;
            initialised?: boolean;
            fuseUUID?: string;
            activateZone: (id: string) => void;
            pageInit: (options?: PageInitOptions) => void;
            registerAll: () => void;
            registerZone: (id: string) => void;
            setTargeting: (key: string, value: TargetingValue) => void;
            setAllowRefreshCallback: (callback: (slotDivId: string) => boolean) => void;
            destroySticky: () => void;
        };
    }

    interface Document {
        mozFullScreenElement?: Element | null;
        webkitFullscreenElement?: Element | null;
        msFullscreenElement?: Element | null;
        msExitFullscreen: (options?: FullscreenOptions) => Promise<void>;
        mozCancelFullScreen: (options?: FullscreenOptions) => Promise<void>;
        webkitExitFullscreen: (options?: FullscreenOptions) => Promise<void>;
    }
    interface Element {
        msRequestFullscreen: (options?: FullscreenOptions) => Promise<void>;
        mozRequestFullScreen: (options?: FullscreenOptions) => Promise<void>;
        webkitRequestFullscreen: (options?: FullscreenOptions) => Promise<void>;
    }
    const GAME_REGIONS: Record<
        string,
        {
            readonly https: boolean;
            readonly address: string;
            readonly l10n: string;
        }
    >;

    const IS_DEV: boolean;

    const GIT_VERSION: string | undefined;

    const AD_PREFIX: string | undefined;
    const GAMEMONETIZE_ID: string | undefined;
    const TURNSTILE_SITE_KEY: string | undefined;

    window.fusetag = window.fusetag || (window.fusetag = { que: [] });
}

declare module "pixi.js-legacy" {
    interface DisplayObject {
        __zOrd: number;
        __zIdx: number;
        __layerIdx: number;
    }
}
export {};
