import { mount } from "svelte";

import StatsApp from "../App.svelte";

const app = mount(StatsApp, {
    target: document.querySelector("#app")!,
});

export default app;
