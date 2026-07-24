import $ from "jquery";
import { device } from "../device.ts";
import { helpers } from "../helpers.ts";
import type { InputBinds } from "../inputBinds.ts";
import { MenuModal } from "./menuModal.ts";
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { BindDefs } from "../inputBinds.ts";
import { type InputHandler, Key, InputType, InputValue } from "../input.ts";
import { Localization } from "./localization.ts";

type Toast = {
    id: number;
    text: string;
    x: number;
    y: number;
};

@customElement("copy-toast")
export class CopyToast extends LitElement {
    @property()
    text = "";

    @property({ type: Number })
    x = 0;

    @property({ type: Number })
    y = 0;

    render() {
        return html`
            <div class="copy-toast toast" style="left:${this.x}px; top:${this.y}px;">
                ${this.text}
            </div>`;
    }

    static styles = css`
        @keyframes toast {
            0% {
                opacity: 0;
                transform: translate(-50%, 0);
            }
    
            55% {
                opacity: 1;
                transform: translate(-50%, -25px);
            }
    
            100% {
                opacity: 0;
                transform: translate(-50%, -25px);
            }
        }
    
    
        .toast {
            position: fixed;
            pointer-events: none;
            animation: toast 550ms forwards;
            white-space: nowrap;
            color: #7cfc00;
            z-index: 10000;
        }        
    `; // yea so the z-index thing is kinda a hack... but erm I couldn't really find another way to fix it so yea...
}

@customElement("settings-modal")
export class SettingsModal extends LitElement {
    createRenderRoot() {
        return this;
    }

    @property({ type: Boolean })
    open = false;

    private close() {
        this.open = false;
        this.dispatchEvent(new CustomEvent("close"));
    }

    private onBackdropClick() {
        this.close();
    }

    private toggleCheckbox(e: MouseEvent) { // in reality you guys really shouldn't even need this just use a <label> and the browser does it for you... but eh maybe you guys have some unknown reason for wanting specifically this so for now here it is :p
        const label = e.currentTarget as HTMLElement;
        const checkbox = label.previousElementSibling as HTMLInputElement | null;
        if (!checkbox) return;
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    }

    render() { // ideally get rid of the inline style later but since you guys have CSS that is essentially geared towards Jquery right now in line styles is the only way this modal is showing without breaking like all other modals :p
        return html`
        <div id="modal-settings" class="modal" style=${this.open ? "display:block" : "display:none"} @click=${this.onBackdropClick}>
        <div class="modal-content modal-close" @click=${(e: MouseEvent) => e.stopPropagation()}>
          <div class="modal-header">
            <span class="close close-corner" @click=${this.close}></span>
            <h2 data-l10n="index-settings">Settings</h2>
          </div>
          <div id="modal-settings-body" class="modal-body">
            <div id="language-select-mobile-wrapper" class="modal-settings-item">
              <div class="language-select-wrap">
                <select class="language-select"></select>
              </div>
            </div>
            <div id="modal-settings-high-res" class="modal-settings-item">
              <input id="highResTex" type="checkbox"><p class="modal-settings-checkbox-text" data-l10n="index-high-resolution" @click=${this.toggleCheckbox}>High resolution (check to increase visual quality)</p>
            </div>
            <div id="modal-settings-interp" class="modal-settings-item">
              <input id="interpolation" type="checkbox"><p class="modal-settings-checkbox-text" data-l10n="index-client-side-interp" @click=${this.toggleCheckbox}>Client side interpolation</p>
            </div>
              <div id="modal-settings-rotation" class="modal-settings-item hide-on-mobile">
              <input id="localRotation" type="checkbox"><p class="modal-settings-checkbox-text" data-l10n="index-client-side-rotation" @click=${this.toggleCheckbox}>Client side player rotation</p>
            </div>
            <div class="modal-settings-item hide-on-mobile">
              <input id="screenShake" type="checkbox"><p class="modal-settings-checkbox-text" data-l10n="index-screen-shake" @click=${this.toggleCheckbox}>Screen shake</p>
            </div>
            <div class="modal-settings-item">
              <input id="anonPlayerNames" type="checkbox"><p class="modal-settings-checkbox-text" data-l10n="index-anon-player-names" @click=${this.toggleCheckbox}>Anonymize player names</p>
            </div>
            <div class="modal-settings-item slider-container main-volume-slider">
              <p class="modal-slider-text" data-l10n="index-master-volume">Master Volume</p>
              <input type="range" min="0" max="100" value="50" class="slider sl-master-volume" id="">
            </div>
            <div class="modal-settings-item slider-container main-volume-slider">
              <p class="modal-slider-text" data-l10n="index-sfx-volume">SFX Volume</p>
              <input type="range" min="0" max="100" value="50" class="slider sl-sound-volume" id="">
            </div>
            <div class="modal-settings-item slider-container main-volume-slider">
              <p class="modal-slider-text" data-l10n="index-music-volume">Music Volume</p>
              <input type="range" min="0" max="100" value="50" class="slider sl-music-volume" id="">
            </div>
            <div id="settings-links">
              <!--
              <a href="privacy.html" target="_blank" class="footer-after" data-l10n="index-privacy">privacy</a>
              -->
              <a href="attribution.txt" target="_blank" class="footer-after" data-l10n="index-attributions">attributions</a>
              <a href="hof.html" target="_blank" data-l10n="index-hof">HOF</a>
            </div>
          </div>
          <div class="modal-footer"></div>
        </div>
      </div>
        `;
    }
}

@customElement("keybind-modal")
export class KeybindModal extends LitElement { // this stuff is why Lit is cool (or dare I say lit?)
    createRenderRoot() {
        return this;
    }

    @property({ type: Boolean })
    open = false;

    @property({ attribute: false })
    inputBinds!: InputBinds;

    @property({ attribute: false })
    input!: InputHandler;

    @property({ attribute: false })
    localization!: Localization;

    @state()
    private shareOpen = false;

    @state()
    private showWarning = false;

    @state()
    private keybindCode = "";

    @state()
    private capturingBind: number | null = null;

    @state()
    private toasts: Toast[] = [];

    @state()
    private nextToastId = 0;

    private close() {
        this.input.captureNextInput(null);
        this.capturingBind = null;
        this.resetShareSection();
        this.open = false;
        this.dispatchEvent(new CustomEvent("close"));
    }

    private onBackdropClick() {
        this.close();
    }

    private resetShareSection() {
        this.shareOpen = false;
        this.showWarning = false;
        this.keybindCode = "";
    }

    private inputKey(key: Key) {
        return new InputValue(InputType.Key, key);
    }

    private captureBind(bindIndex: number) {
        this.capturingBind = bindIndex;
        this.input.captureNextInput((event, inputValue) => {
            event.preventDefault();
            event.stopPropagation();
            const disallowKeys: number[] = [
                Key.Control,
                Key.Alt,
                Key.Windows,
                Key.ContextMenu,
                Key.F1,
                Key.F2,
                Key.F3,
                Key.F4,
                Key.F5,
                Key.F6,
                Key.F7,
                Key.F8,
                Key.F9,
                Key.F10,
                Key.F11,
                Key.F12,
            ];
            if (
                inputValue.type == InputType.Key
                && disallowKeys.includes(inputValue.code)
            ) {
                return false;
            }
            this.capturingBind = null;
            if (!inputValue.equals(this.inputKey(Key.Escape))) {
                let bindValue: InputValue | null = inputValue;
                if (inputValue.equals(this.inputKey(Key.Backspace))) {
                    bindValue = null;
                }
                this.inputBinds.setBind(bindIndex, bindValue);
                this.inputBinds.saveBinds();
                this.requestUpdate();
            }
            return true;
        });
    }

    private toggleShare() {
        this.shareOpen = !this.shareOpen;
    }

    private showToast(text: string, e: MouseEvent) {
        const toast = {
            id: this.nextToastId++,
            text,
            x: e.pageX,
            y: (e.currentTarget as HTMLElement).getBoundingClientRect().top + window.scrollY,
        };
        this.toasts = [...this.toasts, toast];
        setTimeout(() => {
            this.toasts = this.toasts.filter(t => t.id !== toast.id);
        }, 550);
    }

    private loadKeybinds(e: MouseEvent) {
        const success = this.inputBinds.fromBase64(this.keybindCode);
        this.keybindCode = "";
        this.showWarning = !success;
        if (success) {
            this.inputBinds.saveBinds();
            this.requestUpdate();
            this.showToast("Loaded!", e);
        }
    }

    private copyKeybinds(e: MouseEvent) {
        helpers.copyTextToClipboard(this.inputBinds.toBase64());
        this.showToast("Copied!", e);
    }

    private restoreDefaults() {
        this.inputBinds.loadDefaultBinds();
        this.inputBinds.saveBinds();
        this.requestUpdate();
    }

    render() {
        if (!this.inputBinds || !this.localization) {
            return html``;
        }
        return html`
        <div id="ui-modal-keybind" class="ui-modal-keybind modal" oncontextmenu="return false;" style=${this.open ? "display:block" : "display:none"} @click=${this.onBackdropClick}>
        <div class="ui-modal-keybind-content modal-content modal-close" @click=${(e: MouseEvent) => e.stopPropagation()}>
          <div id="ui-modal-keybind-header" class="modal-header">
            <span id="ui-close-keybind" class="close close-corner" @click=${this.close}></span>
            <h2 data-l10n="index-customize-keybinds">Customize Keybinds</h2>
          </div>
          <div id="ui-modal-keybind-body" class="modal-body">
            <div id="ui-modal-keybind-list" class="js-keybind-list" style=${`height:${this.shareOpen ? 275 : 420}px`}>
                ${Object.entries(BindDefs).map(([key, def]) => {
            const bind = this.inputBinds.getBind(Number(key));
            const nameKey =
                "bind-" +
                def.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "");

            return html`
                        <div class="ui-keybind-container">
                            <a class=${`btn-game-menu btn-darken btn-keybind-desc ${this.capturingBind === Number(key) ? "btn-keybind-desc-selected" : ""}`} @click=${() => this.captureBind(Number(key))}>${this.localization.translate(nameKey) || def.name}</a>
                            <div class="btn-keybind-display">
                            ${bind ? this.localization.translate(bind.toString()) || bind.toString() : ""}
                            </div>
                        </div>
            `
        })}
            </div>
            <div id="ui-modal-keybind-share" style=${this.shareOpen ? "display:block" : "display:none"}>
              <div class="ui-modal-keybind-share-row">
                <div class="ui-modal-keybind-share-elem">
                  <span data-l10n="index-keybind-link">Share your keybinds with this code</span>:
                </div>
                <div class="ui-modal-keybind-share-elem">
                  <div id="keybind-link-text">
                    <div id="keybind-link" @click=${this.copyKeybinds}>${this.inputBinds.toBase64()}</div>
                    <span id="keybind-copy" class="copy-item btn-darken" @click=${this.copyKeybinds}></span>
                  </div>
                </div>
              </div>
              <span class="keybind-share-paste-text" data-l10n="index-keybind-paste">Load keybinds using a code here</span><span>:</span>
              <div id="keybind-warning" class="link-warning" style="display:${this.showWarning ? "block" : "none"}">Invalid code!</div>
              <div class="ui-modal-keybind-share-row">
                <input type="text" class="menu-option" contenteditable="false" tabindex="0" autofocus placeholder="Paste a keybind code here" id="keybind-code-input" .value=${this.keybindCode} @input=${(e: Event) => this.keybindCode = (e.target as HTMLInputElement).value} />
                <a class="btn-game-menu btn-darken" id="btn-keybind-code-load" data-l10n="index-keybind-apply" @click=${this.loadKeybinds}>Load</a>
              </div>
            </div>
          </div>
          <div id="ui-modal-keybind-footer" class="modal-footer modal-footer-round">
            <a class="js-btn-keybind-share btn-game-menu btn-darken" data-l10n="game-share" @click=${this.toggleShare}>Share</a>
            <a class="js-btn-keybind-restore btn-game-menu btn-darken" data-l10n="game-restore-defaults" @click=${this.restoreDefaults}>Restore Defaults</a>
          </div>
        </div>
      </div>
      ${this.toasts.map(toast => html`
        <copy-toast .text=${toast.text} .x=${toast.x} .y=${toast.y}></copy-toast>
        `)};
      `;
    }

    show() {
        this.resetShareSection();
        this.open = true;
    }
}

function setupModals(inputBinds: InputBinds) {
    const localization = new Localization; // we could just replace the inputBindUI thing with localization and get rid of this const... but eh it is basically the same thing :p

    const startMenuWrapper = $("#start-menu");
    $("#btn-help").on("click", () => {
        const e = $("#start-help");
        startMenuWrapper.addClass("display-help");
        const height = startMenuWrapper.css("height");
        e.css("display", "block");
        startMenuWrapper.animate(
            {
                scrollTop: height,
            },
            1000,
        );
        return false;
    });
    const teamMobileLink = $("#team-mobile-link");
    const teamMobileLinkDesc = $("#team-mobile-link-desc");
    const teamMobileLinkWarning = $("#team-mobile-link-warning");
    const teamMobileLinkInput = $("#team-link-input");
    const socialShareBlock = $("#social-share-block");
    const newsBlock = $("#news-block");

    // Team mobile link
    $("#btn-join-team").on("click", () => {
        $("#server-warning").css("display", "none");
        teamMobileLinkInput.val("");
        teamMobileLink.css("display", "block");
        teamMobileLinkDesc.css("display", "block");
        teamMobileLinkWarning.css("display", "none");
        startMenuWrapper.css("display", "none");
        newsBlock.css("display", "none");
        socialShareBlock.css("display", "none");
        $("#right-column").css("display", "none");
        return false;
    });
    $("#btn-team-mobile-link-leave").on("click", () => {
        teamMobileLink.css("display", "none");
        teamMobileLinkInput.val("");
        startMenuWrapper.css("display", "block");
        newsBlock.css("display", "block");
        socialShareBlock.css("display", "block");
        $("#right-column").css("display", "block");
        return false;
    });

    // Auto submit link or code on enter
    $("#team-link-input").on("keypress", (e) => {
        if (e.key === "Enter") {
            $("#btn-team-mobile-link-join").trigger("click");
            e.target.blur();
        }
    });

    // Blur name input on enter
    $("#player-name-input-solo").on("keypress", (e) => {
        if (e.key === "Enter") {
            e.target.blur();
        }
    });

    // Scroll to name input on mobile
    if (device.mobile && device.os != "ios") {
        $("#player-name-input-solo").on("focus", function () {
            if (device.isLandscape) {
                const height = device.screenHeight;
                const offset = height <= 282 ? 18 : 36;
                document.body.scrollTop = $(this).offset()!.top - offset;
            }
        });
        $("#player-name-input-solo").on("blur", () => {
            document.body.scrollTop = 0;
        });
    }

    // Modals
    const startBottomRight = $("#start-bottom-right");
    const startTopLeft = $("#start-top-left");
    const startTopRight = $("#start-top-right");

    // Keybind Modal
    const modalKeybind = document.querySelector<KeybindModal>("keybind-modal")!;
    modalKeybind.addEventListener("close", () => {
        startBottomRight.fadeIn(200);
        startTopRight.fadeIn(200);
    });
    // no its never going to be null go away typescript :/
    document.querySelector(".btn-keybind")!.addEventListener("click", (e) => {
        e.preventDefault();
        modalKeybind.inputBinds = inputBinds;
        modalKeybind.input = inputBinds.input;
        modalKeybind.localization = localization;
        startBottomRight.fadeOut(200);
        startTopRight.fadeOut(200);
        modalKeybind.show();
    });

    // Settings Modal
    const modalSettings = document.querySelector<SettingsModal>("settings-modal")!;
    // now to just remove fadeIn and fadeOut...
    modalSettings.addEventListener("close", () => {
        startBottomRight.fadeIn(200);
        startTopRight.fadeIn(200);
    });

    document.querySelectorAll(".btn-settings").forEach(btn => {
        btn.addEventListener("click", e => {
            e.preventDefault();
            startBottomRight.fadeOut(200);
            startTopRight.fadeOut(200);
            modalSettings.open = true;
        });
    });
    // Hamburger Modal
    const modalHamburger = new MenuModal($("#modal-hamburger"));
    modalHamburger.onShow(() => {
        startTopLeft.fadeOut(200);
    });
    modalHamburger.onHide(() => {
        startTopLeft.fadeIn(200);
    });
    $("#btn-hamburger").on("click", () => {
        modalHamburger.show();
        return false;
    });
    $(".modal-body-text").on("click", function () {
        const checkbox = $(this).siblings("input:checkbox");
        checkbox.prop("checked", !checkbox.is(":checked"));
        checkbox.trigger("change");
    });
    $("#force-refresh").on("click", () => {
        window.location.href = `/?t=${Date.now()}`;
    });
}
function onResize() {
    // Add styling specific to safari in browser
    if (device.os == "ios") {
        // iPhone X+ specific
        if (device.model == "iphonex") {
            if (device.isLandscape) {
                $(".main-volume-slider").css("width", "90%");
            } else {
                $(".main-volume-slider").css("width", "");
            }
        } else if (!window.navigator.standalone) {
            if (device.isLandscape) {
                $("#start-main-center").attr("style", "");
                $("#modal-customize .modal-content").attr("style", "");
            } else {
                $("#modal-customize .modal-content").css({
                    transform: "translate(-50%, -50%) scale(0.45)",
                    top: "38%",
                });
            }
        }
    }
    if (device.tablet) {
        // Temporarily remove the youtube links
        $("#featured-youtuber").remove();
        $(".btn-youtube").remove();
    }
    if (device.touch) {
        // Remove full screen option from main menu
        $(".btn-start-fullscreen").css("display", "none");
    } else {
        $(".btn-start-fullscreen").css("display", "block");
    }
    // Set keybind button styling
    $(".btn-keybind").css("display", device.mobile ? "none" : "inline-block");
}

function applyMobileBrowserStyling(isTablet: boolean) {
    $("#team-hide-url").css("display", "none");
    if (isTablet) {
        $("#start-bottom-middle").addClass("start-bottom-middle-tablet");
    }
}

export default {
    setupModals,
    onResize,
    applyMobileBrowserStyling,
};
