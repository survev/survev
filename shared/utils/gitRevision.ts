import { execSync } from "child_process";

export let GIT_VERSION = "Unknown";
try {
    GIT_VERSION = execSync("git rev-parse HEAD").toString().trim();
} catch (error) {
    console.error(`Failed to parse git revision: `, error);
}
