<script lang="ts">
    import slugify from "slugify";

    import { ConfigManager } from "$lib/modules/ConfigManager.svelte.ts";
    import { type Locale, Locales, Localization } from "$lib/modules/Localization.svelte.ts";

    const { config, localization }: { config: ConfigManager; localization: Localization } = $props();

    let rawPlayer = $state("");
    const playerToSearch = $derived(slugify(rawPlayer));
</script>

<header>
    <nav class="navbar navbar-expand-lg bg-dark" data-bs-theme="dark">
        <div class="container">
            <button class="btn btn-outline-success text-muted">
                <a href="/">{localization.translate("index-play-survevio")}</a>
            </button>
            <button
                class="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#stats-navbar"
                aria-controls="stats-navbar"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="stats-navbar">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <li class="nav-item">
                        <a class="nav-link" aria-current="page" href="/stats/">{
                            localization.translate("index-leaderboards")
                        }</a>
                    </li>
                </ul>
                <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                    <li class="nav-item dropdown">
                        <!-- svelte-ignore a11y_invalid_attribute -->
                        <a
                            class="nav-link dropdown-toggle d-flex align-items-center text-uppercase"
                            href="#"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <img src="/img/ui/globe.svg" alt="Globe icon" class="me-2">
                            {localization.locale}
                        </a>
                        <ul class="dropdown-menu">
                            {#each Object.entries(Locales) as [key, value], i (i)}
                                <!-- svelte-ignore a11y_invalid_attribute -->
                                <li>
                                    <a
                                        class="dropdown-item"
                                        href="#"
                                        onclick={e => (e.preventDefault(), config.set("language", key as Locale), localization.setLocale(key as Locale))}
                                    >{value}</a>
                                </li>
                            {/each}
                        </ul>
                    </li>
                    <form
                        class="d-flex"
                        role="search"
                        onsubmit={e => (e.preventDefault(), window.location.assign(`/stats/?slug=${playerToSearch}`), rawPlayer = "")}
                    >
                        <input
                            class="form-control me-2"
                            type="search"
                            placeholder={localization.translate("index-search-players")}
                            aria-label={localization.translate("index-search-players")}
                            required
                            bind:value={rawPlayer}
                        >
                        <button class="btn btn-outline-success" type="submit">
                            {localization.translate("index-go")}
                        </button>
                    </form>
                </ul>
            </div>
        </div>
    </nav>
</header>

<style>
    button {
        white-space: nowrap;
    }

    button a {
        text-decoration: none;
        color: inherit;
        transition: 0.2s;
    }

    button:hover a {
        color: white !important;
    }

    img {
        width: 24px;
        height: 24px;
    }
</style>
