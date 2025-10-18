import $ from "jquery";
import { device } from "../device";
import { helpers } from "../helpers";
import type { InputBinds, InputBindUi } from "../inputBinds";
import { MenuModal } from "./menuModal";

function createToast(
    text: string,
    container: JQuery<HTMLElement>,
    parent: JQuery<HTMLElement>,
    event: JQuery.ClickEvent,
) {
    const copyToast = $("<div/>", {
        class: "copy-toast",
        html: text,
    });
    container.append(copyToast);
    copyToast.css({
        left: event.pageX - parseInt(copyToast.css("width")) / 2,
        top: parent.offset()!.top,
    });
    copyToast.animate(
        {
            top: "-=25",
            opacity: 1,
        },
        {
            queue: false,
            duration: 300,
            complete: function () {
                $(this).fadeOut(250, function () {
                    $(this).remove();
                });
            },
        },
    );
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
    const modalSettings = new MenuModal($("#modal-settings"));
    modalSettings.onShow(() => {
        startBottomRight.fadeOut(200);
        startTopRight.fadeOut(200);
    });
    modalSettings.onHide(() => {
        startBottomRight.fadeIn(200);
        startTopRight.fadeIn(200);
    });
    $(".btn-settings").on("click", () => {
        modalSettings.show();
        return false;
    });
    $(".modal-settings-text").on("click", function (_e) {
        const checkbox = $(this).siblings("input:checkbox");
        checkbox.prop("checked", !checkbox.is(":checked"));
        checkbox.trigger("change");
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
