import { Logger } from "../../../shared/utils/logger.ts";
import { Config } from "../config.ts";

export async function logErrorToWebhook(from: "server" | "client", ...messages: any[]) {
    const url = from === "server" ? Config.errorLoggingWebhook : Config.clientErrorLoggingWebhook;
    if (!url) return;

    try {
        const msg = messages
            .map((msg) => {
                if (msg instanceof Error) {
                    return `\`\`\`${msg.cause}\n${msg.stack}\`\`\``;
                }
                if (typeof msg === "object") {
                    return `\`\`\`json\n${JSON.stringify(msg, null, 2).replaceAll("`", "\\`")}\`\`\``;
                }
                return `${msg}`;
            })
            .join("\n");

        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                embeds: [
                    {
                        color: 0xff0000,
                        title: `${from} error`,
                        timestamp: new Date().toISOString(),
                        description: msg,
                        footer: {
                            text: `Region: ${Config.gameServer.thisRegion}`,
                        },
                    },
                ],
            }),
        });
    } catch (err) {
        // dont use defaultLogger.error here to not log it recursively :)
        console.error("Failed to log error to webhook", err);
    }
}

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
