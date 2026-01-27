import { createModAPI, type ModAPI } from "./ModAPI";

const modAPI: ModAPI = window.survevModAPI ?? createModAPI();

window.survevModAPI = modAPI;

console.log("Come view the survevModAPI docs at (add the link here later...)");

export { modAPI };
