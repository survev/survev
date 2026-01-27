import { createModAPI, type ModAPI } from "./ModAPI";

const modAPI: ModAPI = window.survevModAPI ?? createModAPI();

window.survevModAPI = modAPI;

export { modAPI };
