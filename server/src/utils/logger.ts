import { Logger } from "../../../shared/utils/logger";
import { Config } from "../config";
import { logErrorToWebhook } from "./serverHelpers";

const logCfg = Config.logging;

export class ServerLogger extends Logger {
    constructor(prefix: string) {
        super(logCfg, prefix);
    }

    override error(...message: any[]): void {
        super.error(...message);
        if (!this.config.errorLogs) return;
        logErrorToWebhook("server", ...message);
    }
}

export const defaultLogger = new ServerLogger("Generic");
