import { mount } from "svelte";

import SvelteApp from "./App.svelte";

mount(SvelteApp, {
    target: document.querySelector("#app")!,
});
