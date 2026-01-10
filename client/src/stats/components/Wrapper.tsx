import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import slugify from "slugify";
import { createSignal, For, onMount, Show } from "solid-js";
import { ConfigManager } from "../../config";
import { device } from "../../device";
import { helpers } from "../../helpers";
import { type AcceptedLocales, acceptedLanguages, statsLocalization } from "../js/utils";
import { MainView } from "./MainView";
import { PlayerView } from "./PlayerView";

export const statsConfig = new ConfigManager();
statsConfig.load(() => {});

export function Wrapper() {
    const urlParams = new URLSearchParams(window.location.search);
    const [isPlayerView] = createSignal(urlParams.get("slug") != null);

    return (
        <div id="wrapper">
            <Navbar />
            <div id="contentMain">
                {/* <!-- Background --> */}
                <div id="leaderboard-bg" class="stats-bg"></div>

                <div id="adsLeaderBoardTop" style="display: none">
                    {/* <!-- Top ad --> */}
                    <div id="ad-block-top" class="container mt-3">
                        <div class="ad-block-top-leaderboard">
                            {/* <!-- Tag ID: survevio_728x90_leaderboard --> */}
                            <div id="survevio_728x90_leaderboard_top"></div>
                        </div>

                        <div class="ad-block-top-med-rect">
                            {/* <!-- Tag ID: survevio_300x250_leaderboard --> */}
                            <div id="survevio_300x250_leaderboard_top"></div>
                        </div>
                    </div>
                </div>

                <div id="adsPlayerTop" style="display: none">
                    <div id="ad-block-top" class="container mt-3">
                        <div class="ad-block-top-leaderboard">
                            {/* <!-- Tag ID: survevio_728x90_playerprofile --> */}
                            <div id="survevio_728x90_playerprofile_top"></div>
                        </div>

                        <div class="ad-block-top-med-rect">
                            {/* <!-- Tag ID: survevio_300x250_playerprofile --> */}
                            <div id="survevio_300x250_playerprofile_top"></div>
                        </div>
                    </div>
                </div>
                <div id="content">
                    <Show when={!isPlayerView()}>
                        <MainView
                            gameModes={helpers.getGameModes()}
                            phoneDetected={device.mobile && !device.tablet}
                        />
                    </Show>
                    <Show when={isPlayerView()}>
                        <PlayerView phoneDetected={device.mobile && !device.tablet} />
                    </Show>
                </div>
                <div id="adsLeaderBoardBottom" style="display: none" class="col-12">
                    <div class="ad-block-bot-med-rect">
                        {/* <!-- Tag ID: survevio_300x250_leaderboard --> */}
                        <div id="survevio_300x250_leaderboard_bottom"></div>
                    </div>
                </div>

                <div id="adsPlayerBottom" style="display: none" class="col-12">
                    <div class="ad-block-bot-med-rect">
                        {/* <!-- Tag ID: survevio_300x250_playerprofile --> */}
                        <div id="survevio_300x250_playerprofile_bottom"></div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export function Navbar() {
    const [statsProfile, setStatsProfile] = createSignal(false);
    onMount(() => {
        // Load slug for "My Profile" link
        try {
            const config = JSON.parse(localStorage.getItem("survev_config")!);
            if (config.profile && config.profile.slug) {
                setStatsProfile(config.profile.slug);
            }
        } catch (_err) {}
    });

    return (
        <nav class="navbar navbar-expand-md navbar-dark bg-dark">
            <div class="container">
                <button class="btn btn-outline-success my-2 my-sm-0" type="button">
                    <a class="nav-link-bright" href="/" data-l10n="index-play-survevio">
                        Play survev.io!
                    </a>
                </button>
                <button
                    class="navbar-toggler"
                    type="button"
                    data-toggle="collapse"
                    data-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse ml-lg-2" id="navbarSupportedContent">
                    <ul class="navbar-nav mr-auto">
                        <li class="nav-item m-lg-auto m-1">
                            <a
                                class="nav-link-bright"
                                href="/stats"
                                data-l10n="index-leaderboards"
                            >
                                Leaderboards
                            </a>
                        </li>
                        <Show when={statsProfile()}>
                            <li class="nav-item m-lg-auto m-1">
                                <a
                                    class="nav-link-bright"
                                    href={`/stats/?slug=${statsProfile()}`}
                                    data-l10n="index-my-stats"
                                >
                                    My Stats
                                </a>
                            </li>
                        </Show>
                    </ul>
                    <ul class="navbar-nav ml-auto mr-1">
                        <LanguageDropdown />
                    </ul>
                    <Search />
                </div>
            </div>
        </nav>
    );
}
function LanguageDropdown() {
    const [selectedLanguage, setSelectedLanguage] = createSignal<AcceptedLocales>(
        (statsConfig.get("language") as AcceptedLocales) || "en",
    );

    onMount(() => {
        statsLocalization.setLocale(selectedLanguage());
    });

    return (
        <div id="language-select" class="nav-item dropdown">
            <DropdownMenu modal={false}>
                <DropdownMenu.Trigger
                    class="nav-link dropdown-toggle"
                    as="a"
                    href="#"
                    id="selected-language"
                >
                    {selectedLanguage().toUpperCase()}
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        class="solid-dropdown-menu"
                        aria-labelledby="navbarDropdown"
                    >
                        <For each={acceptedLanguages}>
                            {(value) => (
                                <DropdownMenu.Item
                                    class="dropdown-item dropdown-language"
                                    as="button"
                                    onSelect={() => {
                                        setSelectedLanguage(value);
                                        statsLocalization.setLocale(value);
                                        statsLocalization.localizeIndex();
                                        statsConfig.set("language", value);
                                    }}
                                >
                                    {value.toLocaleUpperCase()}
                                </DropdownMenu.Item>
                            )}
                        </For>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu>
        </div>
    );
}

function Search() {
    const [searchTerm, setSearchTerm] = createSignal("");

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const slug = slugify(searchTerm());
                window.location.href = `/stats/?slug=${slug}`;
            }}
            id="search-players"
            class="form-inline my-2 my-lg-0"
        >
            <input
                class="form-control mr-sm-2"
                type="search"
                placeholder="Search Players"
                aria-label="Search"
                data-l10n="index-search-players"
                onInput={(e) => setSearchTerm(e.currentTarget.value.trim())}
                value={searchTerm()}
            />
            <button
                class="btn btn-outline-success my-2 my-sm-0"
                type="submit"
                data-l10n="index-go"
            >
                Go
            </button>
        </form>
    );
}

function Footer() {
    return (
        <div id="footer" class="footer">
            <div class="container">
                <div class="row">
                    <div id="footer-copyright" class="col-lg-8 col-12">
                        © 2025 survev.io.
                    </div>
                    <div class="col-lg-4 col-12">
                        <div id="footer-social-links">
                            {/* <a href='https://facebook.com/surveviogame' target='_blank' class='btn-social btn-darken btn-facebook'></a>
              <a href='https://twitter.com/survevio' target='_blank' class='btn-social btn-darken btn-twitter'></a>
              <a href='https://reddit.com/r/survevio' target='_blank' class='btn-social btn-darken btn-reddit'></a> */}
                            <a
                                href="https://discord.gg/75RAK3p3K2"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn-social btn-darken btn-discord"
                            ></a>
                            <a
                                href="https://ko-fi.com/survev"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn-social btn-darken btn-kofi"
                            ></a>
                            {/* <!-- <a href='https://www.youtube.com/c/survevio?sub_confirmation=1' target='_blank' class='btn-social btn-darken btn-youtube'></a> --> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
