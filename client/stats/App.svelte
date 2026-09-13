<script lang="ts">
    import { onMount } from "svelte";
    import { SvelteMap, SvelteURLSearchParams } from "svelte/reactivity";

    import { StatsAds, StatsState } from "./src/helpers.ts";

    import Footer from "./src/components/Footer.svelte";
    import Header from "./src/components/Header.svelte";
    import Leaderboard from "./src/components/Leaderboard.svelte";
    import Player from "./src/components/Player.svelte";

    import { ConfigManager } from "$lib/modules/ConfigManager.svelte.ts";
    import { type Locale, Localization } from "$lib/modules/Localization.svelte.ts";

    import type { SDKManager } from "../src/sdk/sdk-manager.ts";

    import "$lib/scss/index.scss";

    const adMap = new SvelteMap<StatsAds, boolean>();
    for (const ad of Object.values(StatsAds)) adMap.set(ad, false);

    const visibleAds: StatsAds[] = [];
    const hiddenAds: StatsAds[] = [];

    const config = new ConfigManager();
    const localization = new Localization();

    const params = new SvelteURLSearchParams(window.location.search);

    let statsState = $derived<StatsState>(
        params.get("slug") ? StatsState.Player : StatsState.Leaderboard,
    );

    // This is intentionally done to prevent the leaderboard component from flashing while loading a player page.
    statsState = StatsState.Loading as StatsState;

    function updateAds(isPhone: boolean, sdk: SDKManager): void {
        visibleAds.length = 0;
        hiddenAds.length = 0;

        if (statsState === StatsState.Leaderboard) {
            if (isPhone) visibleAds.push(StatsAds.BottomCenterLB);
            else visibleAds.push(StatsAds.TopCenterLB, StatsAds.TopRightLB);
        } else {
            if (isPhone) visibleAds.push(StatsAds.BottomCenterPlayer);
            else visibleAds.push(StatsAds.TopCenterPlayer, StatsAds.TopRightPlayer);
        }

        for (const key of adMap.keys()) adMap.set(key, false);
        for (let i = 0; i < visibleAds.length; i++) adMap.set(visibleAds[i], true);

        sdk.showNitroPlacements(visibleAds);
        sdk.hideNitroPlacementsById([...adMap.entries()].filter(x => !x[1]).map(x => x[0]));
    }

    onMount(async () => {
        import("bootstrap/js/dist/collapse.js");
        import("bootstrap/js/dist/dropdown.js");

        const { Device } = await import("$lib/modules/Device.svelte.ts");
        const { SDK } = await import("../src/sdk/sdk.ts");

        config.load(() => {
            // TODO: Finish & merge language files so we can remove this sanity check.
            const configLang = config.get("language");
            if (configLang && localization.acceptedLocales.includes(configLang as Locale)) {
                localization.setLocale(configLang as Locale);
            }

            statsState = params.get("slug") ? StatsState.Player : StatsState.Leaderboard;

            const device = new Device();
            SDK.ensureNitroReady()
                .catch(() => {})
                .finally(() => updateAds(device.mobile && !device.tablet, SDK));
        });
    });
</script>

<Header {config} {localization} />
<main>
    <div></div>
    {#if statsState === StatsState.Leaderboard}
        <Leaderboard {adMap} {localization} />
    {:else if statsState === StatsState.Player}
        <Player {adMap} {localization} />
    {/if}
</main>
<Footer />

<style>
    div {
        background-image: url("/img/ui/stats_splash.png");
        width: 100%;
        height: 400px;
        position: absolute;
        background-size: cover;
        z-index: -1;
        transform: translateY(-56px);
    }
</style>
