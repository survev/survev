import { createModAPI, ModAPI } from "./ModAPI";

const modAPI: ModAPI = window.__MYGAME_MOD_API__ ?? createModAPI();

window.__MYGAME_MOD_API__ = modAPI;

export { modAPI };
