import { device } from "../device.ts";
import { helpers } from "../helpers.ts";
import type { InputBinds } from "../inputBinds.ts";
import { LitElement, html, css, type PropertyValues } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
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

@customElement("start-menu")
export class StartMenu extends LitElement {
    createRenderRoot() {
        return this;
    }

    private readonly onLocaleChanged = () => this.requestUpdate();

    protected updated(_changedProperties: PropertyValues): void {
        if (_changedProperties.has("localization")) {
            const oldLocalization = _changedProperties.get("localization");
            if (oldLocalization) {
                oldLocalization.onLocaleChanged = undefined;
            }

            if (this.localization) {
                this.localization.onLocaleChanged = this.onLocaleChanged;
            }
        }
    }

    @property({ type: Boolean })
    open = true;

    @property({ attribute: false })
    localization!: Localization;

    @property({ type: String })
    playerName = "";

    @property({ attribute: false })
    regions: { id: string; label: string; playerCount?: number; }[] = [];

    @property({ type: String })
    selectedRegion = "";

    @property({ attribute: false })
    gameModes: { icon?: string; buttonCss?: string; buttonText: string; enabled: boolean; }[] = [];

    @property({ type: Boolean })
    supportsTeam = false;

    @property({ type: Number })
    playerMaxNameLength = 16;

    @property({ type: Boolean })
    playLocked = false;

    @query("#start-menu")
    private startMenuContainer!: HTMLElement;

    @query("#player-name-input-solo")
    private playerNameInput!: HTMLInputElement

    @state()
    private showingHelp = false;

    @state()
    private pendingMode: number | null = null;

    private close() {
        this.open = false;
    }

    private openHelp() {
        console.log("help")
        this.showingHelp = true;
        this.updateComplete.then(() => {
            this.startMenuContainer.scrollTo({
                top: this.startMenuContainer.clientHeight,
                behavior: "smooth",
            });
        });
    }

    private renderPlayButtonContent(l10nKey: string, mode: number) {
        if (this.pendingMode === mode) return html`<div class="ui-spinner"></div>`;
        return this.localization.translate(l10nKey);
    }

    private onPlay(mode: number) {
        this.dispatchEvent(new CustomEvent<number>("quick-start", {
            detail: mode,
            bubbles: true,
            composed: true,
        }));
    }

    private onJoinTeam() {
        this.dispatchEvent(new CustomEvent("join-team"));
        this.close();
    }

    private onRegionChanged(e: Event) {
        this.selectedRegion = (e.target as HTMLSelectElement).value;
        this.dispatchEvent(new CustomEvent("region-change", {
            detail: this.selectedRegion,
            bubbles: true,
            composed: true,
        }));
    }

    private onLoadout() {
        this.dispatchEvent(new CustomEvent("open-loadout"));
    }

    private onPlayerNameKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            (e.target as HTMLElement).blur();
        }
    }

    private onPlayerFocus() {
        if (device.mobile && device.os !== "ios" && device.isLandscape) {
            const height = device.screenHeight;
            const offset = height <= 282 ? 18 : 36;
            document.body.scrollTop = this.playerNameInput.offsetTop - offset;
        }
    }

    private onPlayerBlur() {
        if (device.mobile && device.os !== "ios") {
            document.body.scrollTop = 0;
        }
    }

    private playLockoutTimer?: number;

    render() {
        if (!this.localization) {
            return html``;
        }
        const solo = this.gameModes[0];
        const duo = this.gameModes[1];
        const squad = this.gameModes[2];
        return html`
        <div id="start-menu" class=${`menu-column menu-block ${ this.showingHelp ? "display-help" : "" }`} style=${this.open ? "display:block" : "display:none"}>
            <div class="play-loading-outer ${this.playLocked ? "locked" : ""}">
                <div class="play-loading-inner">
                    <div class="play-loading-spinner"></div>
                </div>
            </div>
            <div class="play-button-container ${this.playLocked ? "locked" : ""}">
                <div id="player-options">
                    <input type="text" class="menu-option player-name-input" tabindex="0" placeholder=${this.localization.translate("index-enter-name-here")} id="player-name-input-solo" .value=${this.playerName} @input=${(e: Event) => this.playerName = (e.target as HTMLInputElement).value} @keydown=${this.onPlayerNameKeyDown} @focus=${this.onPlayerFocus} @blur=${this.onPlayerBlur} .maxLength=${this.playerMaxNameLength} />
                    <a class="btn-darken menu-option player-options-btn" id="btn-customize" @click=${this.onLoadout}></a>
                </div>
                <select id="server-select-main" class="server-select menu-option btn-hollow btn-hollow-selected" .value=${this.selectedRegion} @change=${this.onRegionChanged}>
                    <optgroup id="server-opts" label=${this.localization.translate("index-region")}>
                        ${this.regions.map(region => html`
                            <option value=${region.id}>
                                ${region.label}
                                ${region.playerCount != null ? `[${region.playerCount} ${this.localization.translate("index-players")}]` : ""}
                            </option>
                            `
                        )}
                    </optgroup>
                </select>
                <a class=${`btn-green btn-darken menu-option ${solo?.icon ? "btn-custom-mode-no-indent" : ""} ${solo?.buttonCss ?? ""}`} id="btn-start-mode-0" style=${`${solo?.icon ? `background-image:url(${solo.icon});` : ""} ${solo?.enabled === false? "display:none;" : ""}`} @click=${() => this.onPlay(0)}>${this.renderPlayButtonContent(`index-play-${solo?.buttonText ?? "solo"}`, 0)}</a>
                <div id="btns-quick-start">
                    <a class=${`btn-green btn-darken menu-option ${duo?.icon ? "btn-custom-mode-no-indent" : ""} ${duo?.buttonCss ?? ""}`} id="btn-start-mode-1" style=${`${duo?.icon ? `background-image:url(${duo.icon});` : ""} ${duo?.enabled === false ? "display:none;" : ""}`} @click=${() => this.onPlay(1)}>${this.renderPlayButtonContent(`index-play-${duo?.buttonText ?? "duo"}`, 1)}</a>
                    <a class=${`btn-green btn-darken menu-option ${squad?.icon ? "btn-custom-mode-no-indent" : ""} ${squad?.buttonCss ?? ""}`} id="btn-start-mode-2" style=${`${squad?.icon ? `background-image:url(${squad.icon});` : ""} ${squad?.enabled === false ? "display:none;" : ""}`} @click=${() => this.onPlay(2)}>${this.renderPlayButtonContent(`index-play-${squad?.buttonText ?? "squad"}`, 2)}</a>
                </div>
                <div class="btns-double-row" style=${this.supportsTeam ? "display:flex" : "display:none"}>
                    <a class="btn-darken menu-option btn-team-option" id="btn-join-team" @click=${this.onJoinTeam}>${this.localization.translate("index-join-team")}</a>
                    <a class="btn-darken menu-option btn-team-option" id="btn-create-team">${this.localization.translate("index-create-team")}</a>
                </div>
                <div id="btn-help" class="menu-option btn-darken" @click=${this.openHelp}>${this.localization.translate("index-how-to-play")}</div>
                <div id="start-help" style=${this.showingHelp ? "display:block" : "display:none"}>
                    <h1>${this.localization.translate("index-controls")}</h1>
                    <p><span class="help-action">${this.localization.translate("index-movement")}</span>: <span class="help-control">${this.localization.translate("index-movement-ctrl")}</span></p>
                    <p><span class="help-action">${this.localization.translate("index-aim")}</span>: <span class="help-control">${this.localization.translate("index-aim-control")}</span></p>
                    <p><span class="help-action">${this.localization.translate("index-punch")}</span>/<span class="help-action">${this.localization.translate("index-shoot")}</span>: <span class="help-control">${this.localization.translate("index-shoot-ctrl")}</span></p>
                    <p><span class="help-action">${this.localization.translate("index-change-weapons")}</span>: <span class="help-control">${this.localization.translate("index-change-weapons-ctrl")}</span></p>
                    <p class="hide-on-mobile"><span class="help-action">${this.localization.translate("index-stow-weapons")}</span>: <span class="help-control">${this.localization.translate("index-stow-weapons-ctrl")}</span></p>
                    <p class="hide-on-mobile"><span class="help-action">${this.localization.translate("index-swap-weapons")}</span>: <span class="help-control">${this.localization.translate("index-swap-weapons-ctrl")}</span></p>
                    <p class="hide-on-mobile"><span class="help-action">${this.localization.translate("index-swap-weapon-slots")}</span>: <span class="help-control">${this.localization.translate("index-swap-weapon-slots-ctrl")}</span></p>
                    <p><span class="help-action">${this.localization.translate("index-reload")}</span>: <span class="help-control">${this.localization.translate("index-reload-ctrl")}</span></p>
                    <p><span class="help-action">${this.localization.translate("index-scope-zoom")}</span>: <span class="help-control">${this.localization.translate("index-scope-zoom-ctrl")}</span></p>
                    <p><span class="help-action"></span>${this.localization.translate("index-pickup")}/<span class="help-action">${this.localization.translate("index-loot")}</span>/<span class="help-action">${this.localization.translate("index-revive")}</span>: <span class="help-control">${this.localization.translate("index-pickup-ctrl")}</span></p>
                    <p><span class="help-action">${this.localization.translate("index-use-medical")}</span>: <span class="help-control">${this.localization.translate("index-use-medical-ctrl")}</span></p>
                    <p><span class="help-action">${this.localization.translate("index-drop-item")}</span>: <span class="help-control">${this.localization.translate("index-drop-item-ctrl")}</span></p>
                    <p><span class="help-action">${this.localization.translate("index-cancel-action")}</span>: <span class="help-control">${this.localization.translate("index-cancel-action-ctrl")}</span></p>
                    <p><span class="help-action">${this.localization.translate("index-view-map")}</span>: <span class="help-control">${this.localization.translate("index-view-map-ctrl")}</span></p>
                    <p class="hide-on-mobile"><span class="help-action">${this.localization.translate("index-toggle-minimap")}</span>: <span class="help-control">${this.localization.translate("index-toggle-minimap-ctrl")}</span></p>
                    <p><span class="help-action">${this.localization.translate("index-use-ping")}</span>: <span class="help-control">${this.localization.translate("index-use-ping-ctrl")}</span></p>
                    <p><span class="help-action">${this.localization.translate("index-use-emote")}</span>: <span class="help-control">${this.localization.translate("index-use-emote-ctrl")}</span></p>
                    <h1>${this.localization.translate("index-how-to-play")}</h1>
                    <p>${this.localization.translate("index-tips-1-desc")}</p>
                    <h1>${this.localization.translate("index-tips-2")}</h1>
                    <p>${this.localization.translate("index-tips-2-desc")}</p>
                    <h1>${this.localization.translate("index-tips-3")}</h1>
                    <p>${this.localization.translate("index-tips-3-desc")}</p>
                    <h1>${this.localization.translate("index-tips-4")}</h1>
                    <p>${this.localization.translate("index-tips-4-desc")}</p>
                </div>
            </div>
        </div>
        `;
    }

    show() {
        this.showingHelp = false;
        this.open = true;
    }

    setPendingMode(mode: number | null) {
        this.pendingMode = mode;
    }

    setPlayLockout(lock: boolean) {
        if (this.playLockoutTimer !== undefined) {
            clearTimeout(this.playLockoutTimer);
            this.playLockoutTimer = undefined;
        }

        const delay = IS_DEV ? 0 : (lock ? 0 : 100);

        if (delay === 0) {
            this.playLocked = lock;
            return;
        }

        this.playLockoutTimer = window.setTimeout(() => {
            this.playLocked = lock;
            this.playLockoutTimer = undefined;
        }, delay);
    }
}

@customElement("settings-modal")
export class SettingsModal extends LitElement {
    createRenderRoot() {
        return this;
    }

    @property({ type: Boolean })
    open = false;

    @property({ attribute: false })
    localization!: Localization;

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
        if (!this.localization) {
            return html``;
        }
        return html`
        <div id="modal-settings" class="modal" style=${this.open ? "display:block" : "display:none"} @click=${this.onBackdropClick}>
        <div class="modal-content modal-close" @click=${(e: MouseEvent) => e.stopPropagation()}>
          <div class="modal-header">
            <span class="close close-corner" @click=${this.close}></span>
            <h2>${this.localization.translate("index-settings")}</h2>
          </div>
          <div id="modal-settings-body" class="modal-body">
            <div id="language-select-mobile-wrapper" class="modal-settings-item">
              <div class="language-select-wrap">
                <select class="language-select"></select>
              </div>
            </div>
            <div id="modal-settings-high-res" class="modal-settings-item">
              <input id="highResTex" type="checkbox"><p class="modal-settings-checkbox-text" @click=${this.toggleCheckbox}>${this.localization.translate("index-high-resolution")}</p>
            </div>
            <div id="modal-settings-interp" class="modal-settings-item">
              <input id="interpolation" type="checkbox"><p class="modal-settings-checkbox-text" @click=${this.toggleCheckbox}>${this.localization.translate("index-client-side-interp")}</p>
            </div>
              <div id="modal-settings-rotation" class="modal-settings-item hide-on-mobile">
              <input id="localRotation" type="checkbox"><p class="modal-settings-checkbox-text" @click=${this.toggleCheckbox}>${this.localization.translate("index-client-side-rotation")}</p>
            </div>
            <div class="modal-settings-item hide-on-mobile">
              <input id="screenShake" type="checkbox"><p class="modal-settings-checkbox-text" @click=${this.toggleCheckbox}>${this.localization.translate("index-screen-shake")}</p>
            </div>
            <div class="modal-settings-item">
              <input id="anonPlayerNames" type="checkbox"><p class="modal-settings-checkbox-text" @click=${this.toggleCheckbox}>${this.localization.translate("index-anon-player-names")}</p>
            </div>
            <div class="modal-settings-item slider-container main-volume-slider">
              <p class="modal-slider-text">${this.localization.translate("index-master-volume")}</p>
              <input type="range" min="0" max="100" value="50" class="slider sl-master-volume" id="">
            </div>
            <div class="modal-settings-item slider-container main-volume-slider">
              <p class="modal-slider-text">${this.localization.translate("index-sfx-volume")}</p>
              <input type="range" min="0" max="100" value="50" class="slider sl-sound-volume" id="">
            </div>
            <div class="modal-settings-item slider-container main-volume-slider">
              <p class="modal-slider-text">${this.localization.translate("index-music-volume")}</p>
              <input type="range" min="0" max="100" value="50" class="slider sl-music-volume" id="">
            </div>
            <div id="settings-links">
              <!--
              <a href="privacy.html" target="_blank" class="footer-after">${this.localization.translate("index-privacy")}</a>
              -->
              <a href="attribution.txt" target="_blank" class="footer-after">${this.localization.translate("index-attributions")}</a>
              <a href="hof.html" target="_blank">${this.localization.translate("index-hof") || "HOF"}</a>
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
            <h2>${this.localization.translate("index-customize-keybinds") || "Customize Keybinds"}</h2>
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
                  <span>${this.localization.translate("index-keybind-link")}</span>:
                </div>
                <div class="ui-modal-keybind-share-elem">
                  <div id="keybind-link-text">
                    <div id="keybind-link" @click=${this.copyKeybinds}>${this.inputBinds.toBase64()}</div>
                    <span id="keybind-copy" class="copy-item btn-darken" @click=${this.copyKeybinds}></span>
                  </div>
                </div>
              </div>
              <span class="keybind-share-paste-text">${this.localization.translate("index-keybind-paste")}</span><span>:</span>
              <div id="keybind-warning" class="link-warning" style="display:${this.showWarning ? "block" : "none"}">Invalid code!</div>
              <div class="ui-modal-keybind-share-row">
                <input type="text" class="menu-option" contenteditable="false" tabindex="0" autofocus placeholder="Paste a keybind code here" id="keybind-code-input" .value=${this.keybindCode} @input=${(e: Event) => this.keybindCode = (e.target as HTMLInputElement).value} />
                <a class="btn-game-menu btn-darken" id="btn-keybind-code-load" @click=${this.loadKeybinds}>${this.localization.translate("index-keybind-apply")}</a>
              </div>
            </div>
          </div>
          <div id="ui-modal-keybind-footer" class="modal-footer modal-footer-round">
            <a class="js-btn-keybind-share btn-game-menu btn-darken" @click=${this.toggleShare}>${this.localization.translate("game-share") || "Share"}</a>
            <a class="js-btn-keybind-restore btn-game-menu btn-darken" @click=${this.restoreDefaults}>${this.localization.translate("game-restore-defaults") || "Restore Defaults"}</a>
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

@customElement("hamburger-modal")
export class HamburgerModal extends LitElement {
    createRenderRoot() {
        return this;
    }

    @property({ type: Boolean })
    open = false;

    @property({ attribute: false })
    localization!: Localization;

    private close() {
        this.open = false;
        this.dispatchEvent(new CustomEvent("close"));
    }

    render() {
        if (!this.localization) {
            return html``;
        }
        return html`
        <div id="modal-hamburger" class="modal" style=${this.open ? "display:block" : "display:none"} @click=${this.close}>
            <div class="modal-content modal-close">
                <div class="modal-header">
                    <span class="close close-hamburger icon-hamburger"></span>
                    <h2>&nbsp;</h2>
                </div>
                <div id="modal-hamburger-body" class="modal-body">
                    <div id="modal-hamburger-leaderboards">
                        <a href="/stats" target="_blank" class="btn-leaderboard-stats-link menu-option btn-darken">${this.localization.translate("index-leaderboards")}</a>
                        </div>
                        <div class="modal-divider"></div>
                        <!-- <div class="btn-social-wrapper">
                        <a href="https://facebook.com/survev" target="_blank" class="btn-social btn-darken btn-facebook"></a>
                        <a href="https://twitter.com/survev" target="_blank" class="btn-social btn-darken btn-twitter"></a>
                        <a href="https://www.instagram.com/survev/" target="_blank" class="btn-social btn-darken btn-instagram"></a>
                        <a href="https://discord.gg/survev" target="_blank" class="btn-social btn-darken btn-discord"></a>
                        <a href="https://www.youtube.com/c/survev?sub_confirmation=1" target="_blank" class="btn-social btn-darken btn-youtube"></a>
                    </div> -->
                    <div class="modal-divider"></div>
                    <div id="modal-hamburger-bottom">
                        <a href="changelogRec.html" class="footer-after">ver ${import.meta.env.VITE_GAME_VERSION}</a>
                        <!--
                        <a href="changelog.html" class="footer-after">ver 0.8.82</a>
                        <a href="#" class="btn-cookie-settings footer-after">cookie settings</a>
                        <a href="privacy.txt" target="_blank" class="footer-after">privacy</a>
                        -->
                        <a href="attribution.txt" target="_blank">attributions</a>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    show() {
        this.open = true;
    }
}

function setupModals(inputBinds: InputBinds) {

    const startMenu = document.querySelector<StartMenu>("start-menu")!;

    const teamMobileLink = document.getElementById("team-mobile-link")!;
    const teamMobileLinkDesc = document.getElementById("team-mobile-link-desc")!;
    const teamMobileLinkWarning = document.getElementById("team-mobile-link-warning")!;
    const teamLinkInput = document.getElementById("team-link-input")! as HTMLInputElement;
    const socialShareBlock = document.getElementById("social-share-block")!;
    const newsBlock = document.getElementById("news-block")!;

    // Team mobile link
    startMenu.addEventListener("join-team", () => { // once again once more html thingies are turned into Lit components this ideally pretty much disappears :p
        document.getElementById("server-warning")!.style.display = "none";
        teamLinkInput.value = "";
        teamMobileLink.style.display = "block";
        teamMobileLinkDesc.style.display = "block";
        teamMobileLinkWarning.style.display = "none";
        newsBlock.style.display = "none";
        socialShareBlock.style.display = "none";
        document.getElementById("right-column")!.style.display = "none";
    })
    document.getElementById("btn-team-mobile-link-leave")!.addEventListener("click", () => {
        teamMobileLink.style.display = "none";
        teamLinkInput.value = "";
        newsBlock.style.display = "block";
        socialShareBlock.style.display = "block";
        document.getElementById("right-column")!.style.display = "block";
        startMenu.show();
    });

    // Auto submit link or code on enter
    teamLinkInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            document.getElementById("btn-team-mobile-link-join")!.click();
            teamLinkInput.blur();
        }
    });

    // Modals
    const startBottomRight = document.getElementById("start-bottom-right")!;
    const startTopLeft = document.getElementById("start-top-left")!;
    const startTopRight = document.getElementById("start-top-right")!;

    // Keybind Modal
    const modalKeybind = document.querySelector<KeybindModal>("keybind-modal")!;
    modalKeybind.addEventListener("close", () => {
        helpers.fadeIn(startBottomRight, "block", 200);
        helpers.fadeIn(startTopRight, "block", 200);
    });
    // no its never going to be null go away typescript :/
    document.querySelector(".btn-keybind")!.addEventListener("click", (e) => {
        e.preventDefault();
        modalKeybind.inputBinds = inputBinds;
        modalKeybind.input = inputBinds.input;
        modalKeybind.localization = startMenu.localization;
        helpers.fadeOut(startBottomRight, 200);
        helpers.fadeOut(startTopRight, 200);
        modalKeybind.show();
    });

    // Settings Modal
    const modalSettings = document.querySelector<SettingsModal>("settings-modal")!;
    modalSettings.addEventListener("close", () => {
        helpers.fadeIn(startBottomRight, "block", 200);
        helpers.fadeIn(startTopRight, "block", 200);
    });

    document.querySelectorAll(".btn-settings").forEach(btn => {
        btn.addEventListener("click", e => {
            e.preventDefault();
            helpers.fadeOut(startBottomRight, 200);
            helpers.fadeOut(startTopRight, 200);
            modalSettings.localization = startMenu.localization;
            modalSettings.open = true;
        });
    });
    // Hamburger Modal
    const modalHamburger = document.querySelector<HamburgerModal>("hamburger-modal")!;
    modalHamburger.addEventListener("close", () => {
        helpers.fadeIn(startTopLeft, "block", 200);
    })
    document.querySelector("#btn-hamburger")!.addEventListener("click", e => {
        e.preventDefault();
        helpers.fadeOut(startTopLeft, 200);
        modalHamburger.localization = startMenu.localization;
        modalHamburger.show();
    })

    // unrelated to the hamburger modal so not sure why it was so close to it...
    document.querySelectorAll(".modal-body-text").forEach(el => { // after further inspection this appears to be fully unused since nothing in the index.html matches what this would do so yea... I will just leave it for now though :p
        el.addEventListener("click", () => {
            const checkbox = el.parentElement?.querySelector<HTMLInputElement>('input[type="checkbox"]');
            if (!checkbox) return;
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        });
    });
    document.getElementById("force-refresh")?.addEventListener("click", () => {
        window.location.href = `/?t=${Date.now()}`;
    });
}
function onResize() { // ideally we would get rid of this and just mkae everything a Lit component handling its own styles and everything but for now this can stay as is
    // Add styling specific to safari in browser
    if (device.os == "ios") {
        // iPhone X+ specific
        if (device.model == "iphonex") {
            const slider = document.querySelector<HTMLElement>(".main-volume-slider")!;
            slider.style.width = device.isLandscape? "90%" : "";
        } else if (!window.navigator.standalone) {
            const startMainCenter = document.getElementById("start-main-center")!;
            const modalContent = document.querySelector<HTMLElement>("#modal-customize .modal-content")!;
            if (device.isLandscape) {
                startMainCenter.removeAttribute("style");
                modalContent.removeAttribute("style");
            } else {
                modalContent.style.transform = "translate(-50%, -50%) scale(0.45)"
                modalContent.style.top = "38%";
            }
        }
    }
    if (device.tablet) {
        // Temporarily remove the youtube links
        document.getElementById("featured-youtuber")!.remove();
        document.querySelector(".btn-youtube")!.remove();
    }
    if (device.touch) {
        // Remove full screen option from main menu
        document.getElementById("btn-start-fullscreen")!.style.display = "none";
    } else {
        document.getElementById("btn-start-fullscreen")!.style.display = "inline-block";
    }
    // Set keybind button styling
    document.querySelector<HTMLElement>(".btn-keybind")!.style.display = device.mobile ? "none" : "inline-block";
}

function applyMobileBrowserStyling(isTablet: boolean) {
    document.getElementById("team-hide-url")!.style.display = "none";
    if (isTablet) {
        document.getElementById("start-bottom-middle")!.classList.add("start-bottom-middle-tablet");
    }
}

export default {
    setupModals,
    onResize,
    applyMobileBrowserStyling,
};
