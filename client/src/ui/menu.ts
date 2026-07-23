import $ from "jquery";
import { device } from "../device.ts";
import { helpers } from "../helpers.ts";
import type { InputBinds, InputBindUi } from "../inputBinds.ts";
import { MenuModal } from "./menuModal.ts";
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("copy-toast")
export class CopyToast extends LitElement {
    @property()
    text = "";

    @property({ type: Number })
    x = 0;

    @property({ type: Number })
    y = 0;

    connectedCallback() {
        super.connectedCallback();

        setTimeout(() => {
            this.remove();
        }, 550);
    }

    render() {
        return html`
            <div class="toast" style="left:${this.x}px; top:${this.y}px;">
                ${this.text}
            </div>`;
    }

    static styles = css`
        @keyframes toast {
            0% {
                opacity: 0;
                transform: translateY(25px);
            }
            
            50% {
                opacity: 1;
                transform: translateY(0);
            }

            100% {
                opacity: 0;
                transform: translateY(-25px);
            }
        }
    
        .toast {
            position: absolute;
            animation: toast 550ms forwards;
        }
    `;
}

function createToast( // yes eventually we will get rid of this function (or at the very least the Jquery...) but it is a incremental migration so...
    text: string,
    container: JQuery<HTMLElement>,
    parent: JQuery<HTMLElement>,
    event: JQuery.ClickEvent,
) {
    const toast = document.createElement("copy-toast") as CopyToast;

    toast.text = text;
    toast.x = event.pageX;
    toast.y = parent.offset()!.top;

    container[0].appendChild(toast);
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
              <input id="highResTex" type="checkbox"><p class="modal-settings-checkbox-text" data-l10n="index-high-resolution" @click${this.toggleCheckbox}>High resolution (check to increase visual quality)</p>
            </div>
            <div id="modal-settings-interp" class="modal-settings-item">
              <input id="interpolation" type="checkbox"><p class="modal-settings-checkbox-text" data-l10n="index-client-side-interp" @click${this.toggleCheckbox}>Client side interpolation</p>
            </div>
              <div id="modal-settings-rotation" class="modal-settings-item hide-on-mobile">
              <input id="localRotation" type="checkbox"><p class="modal-settings-checkbox-text" data-l10n="index-client-side-rotation" @click${this.toggleCheckbox}>Client side player rotation</p>
            </div>
            <div class="modal-settings-item hide-on-mobile">
              <input id="screenShake" type="checkbox"><p class="modal-settings-checkbox-text" data-l10n="index-screen-shake" @click${this.toggleCheckbox}>Screen shake</p>
            </div>
            <div class="modal-settings-item">
              <input id="anonPlayerNames" type="checkbox"><p class="modal-settings-checkbox-text" data-l10n="index-anon-player-names" @click${this.toggleCheckbox}>Anonymize player names</p>
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

function setupModals(inputBinds: InputBinds, inputBindUi: InputBindUi) {
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
    const modalKeybind = new MenuModal($("#ui-modal-keybind"));
    modalKeybind.onShow(() => {
        startBottomRight.fadeOut(200);
        startTopRight.fadeOut(200);

        // Reset the share section
        $("#ui-modal-keybind-share").css("display", "none");
        $("#keybind-warning").css("display", "none");
        $("#ui-modal-keybind-list").css("height", "420px");
        $("#keybind-code-input").html("");
        inputBindUi.refresh();
    });
    modalKeybind.onHide(() => {
        startBottomRight.fadeIn(200);
        startTopRight.fadeIn(200);
        inputBindUi.cancelBind();
    });
    $(".btn-keybind").on("click", () => {
        modalKeybind.show();
        return false;
    });

    // Share button
    $(".js-btn-keybind-share").on("click", () => {
        // Toggle the share screen
        if ($("#ui-modal-keybind-share").css("display") == "block") {
            $("#ui-modal-keybind-share").css("display", "none");
            $("#ui-modal-keybind-list").css("height", "420px");
        } else {
            $("#ui-modal-keybind-share").css("display", "block");
            $("#ui-modal-keybind-list").css("height", "275px");
        }
    });

    // Copy keybind code
    $("#keybind-link, #keybind-copy").on("click", (e) => {
        createToast("Copied!", modalKeybind.selector, $("#keybind-link"), e);
        const t = $("#keybind-link").html();
        helpers.copyTextToClipboard(t);
    });

    // Apply keybind code
    $("#btn-keybind-code-load").on("click", (e) => {
        const code = $("#keybind-code-input").val()!;
        $("#keybind-code-input").val("");
        const success = inputBinds.fromBase64(String(code));
        $("#keybind-warning").css("display", success ? "none" : "block");
        if (success) {
            createToast("Loaded!", modalKeybind.selector, $("#btn-keybind-code-load"), e);
            inputBinds.saveBinds();
        }
        inputBindUi.refresh();
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
