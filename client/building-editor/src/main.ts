import * as PIXI from "pixi.js-legacy";
import { math } from "../../../shared/utils/math";
import { Vec2, v2 } from "../../../shared/utils/v2";
import { Ambiance } from "../../src/ambiance";
import { AudioManager } from "../../src/audioManager";
import { ConfigManager } from "../../src/config";
import { device } from "../../src/device";
import { InputHandler } from "../../src/input";
import { InputBinds } from "../../src/inputBinds";
import { SoundHandle } from "../../src/lib/createJS";
import { ResourceManager } from "../../src/resources";
import { Localization } from "../../src/ui/localization";
import { EditorDisplay } from "./editorDisplay";
import { EditorUi } from "./editorUi";

// we dont really need sounds
// and loading them slows down page loading a lot
// when they load... if we want them to load we also need to fix audio manager path anyway
// so just do nothing :)
class FakeAudioManager extends AudioManager {
    preloadSounds() {}
    loadSound() {}
    playSound() {
        return null;
    }
    playGroup() {
        return null;
    }
    update() {}
    updateSound() {}
}

class Application {
    config = new ConfigManager();
    localization = new Localization();

    pixi?: PIXI.Application<PIXI.ICanvas>;
    resourceManager?: ResourceManager;
    input?: InputHandler;
    inputBinds?: InputBinds;
    editorDisplay?: EditorDisplay;

    audioManager = new FakeAudioManager();
    ambience = new Ambiance();

    ui?: EditorUi;

    domContentLoaded = false;
    configLoaded = false;
    initialized = false;
    active = false;
    hasFocus = true;

    contextListener = function (e: MouseEvent) {
        e.preventDefault();
    };

    constructor() {
        const onLoadComplete = () => {
            this.config.load(() => {
                this.configLoaded = true;
                this.tryLoad();
            });
        };
        this.loadBrowserDeps(onLoadComplete);
    }

    loadBrowserDeps(onLoadCompleteCb: () => void) {
        onLoadCompleteCb();
    }

    tryLoad() {
        if (this.domContentLoaded && this.configLoaded && !this.initialized) {
            this.initialized = true;
            const language =
                this.config.get("language") || this.localization.detectLocale();
            this.config.set("language", language);
            this.localization.setLocale(language);
            this.localization.populateLanguageSelect();
            this.localization.localizeIndex();

            this.setAppActive(true);
            const domCanvas = document.querySelector<HTMLCanvasElement>("#cvs")!;
            const rendererRes = window.devicePixelRatio > 1 ? 2 : 1;

            const createPixiApplication = (forceCanvas: boolean) => {
                return new PIXI.Application({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    view: domCanvas,
                    antialias: false,
                    resolution: rendererRes,
                    hello: true,
                    forceCanvas,
                });
            };
            let pixi = null;
            try {
                pixi = createPixiApplication(false);
            } catch (_e) {
                pixi = createPixiApplication(true);
            }
            this.pixi = pixi;
            this.pixi.renderer.events.destroy();
            this.pixi.ticker.add(this.update, this);
            this.pixi.renderer.background.color = 7378501;
            this.resourceManager = new ResourceManager(
                this.pixi.renderer,
                this.audioManager,
                this.config,
            );
            this.resourceManager.loadMapAssets("main");
            this.input = new InputHandler(document.getElementById("game-touch-area")!);
            this.inputBinds = new InputBinds(this.input, this.config);
            this.editorDisplay = new EditorDisplay(
                this.pixi,
                this.audioManager,
                this.config,
                this.inputBinds,
                this.ambience,
                this.resourceManager,
            );
            this.onResize();

            this.onConfigModified();
            this.config.addModifiedListener(this.onConfigModified.bind(this));

            this.editorDisplay.init();

            this.ui = new EditorUi(this.config, this.editorDisplay);
        }
    }

    onResize() {
        device.onResize();
        this.pixi?.renderer.resize(device.screenWidth, device.screenHeight);
        this.editorDisplay?.resize();
    }

    setAppActive(active: boolean) {
        this.active = active;
    }

    onConfigModified(_key?: string) {}

    update() {
        const dt = math.clamp(this.pixi!.ticker.elapsedMS / 1000, 0.001, 1 / 8);
        this.resourceManager!.update(dt);
        this.ambience.update(dt, this.audioManager, !this.active);

        if (this.editorDisplay?.initialized) {
            this.editorDisplay.update(dt);
        }
        this.ui?.m_update(this.input!);

        this.input!.flush();
    }
}

const App = new Application();

function onPageLoad() {
    App.domContentLoaded = true;
    App.tryLoad();
}

document.addEventListener("DOMContentLoaded", onPageLoad);
window.addEventListener("load", onPageLoad);

window.addEventListener("resize", () => {
    App.onResize();
});
window.addEventListener("orientationchange", () => {
    App.onResize();
});

window.addEventListener("onfocus", () => {
    App.hasFocus = true;
});
window.addEventListener("onblur", () => {
    App.hasFocus = false;
});
