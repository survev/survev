// dont use this on client because nodejs module lol
// but its used by server, bot and atlas builder so i put it on shared

import { styleText } from "node:util";

interface LoggerConfig {
    /**
     * If the logger class should include the date.
     * Useful to disable it when using logging tools that add a date by default (like journalctl)
     */
    logDate: boolean;

    // logging categories enabled

    /**
     * Information logs
     */
    infoLogs: boolean;

    /**
     * Debug logs, disabled by default on production
     */
    debugLogs: boolean;

    /**
     * Warning logs
     */
    warnLogs: boolean;

    /**
     * Error logs, will also log to a webhook if `errorLoggingWebhook` is set.
     */
    errorLogs: boolean;
}

export class Logger {
    config: LoggerConfig;
    prefix: string;

    constructor(config: LoggerConfig, prefix: string) {
        this.config = config;
        this.prefix = prefix;
    }

    private log(logFn = console.log, ...message: any[]): void {
        if (this.config.logDate) {
            const date = new Date();
            const dateString = `[${date.toISOString().substring(0, 10)} ${date.toLocaleTimeString()}]`;

            logFn(
                styleText("cyan", dateString),
                styleText("green", this.prefix),
                "|",
                ...message,
            );
        } else {
            logFn(styleText("green", this.prefix), "|", ...message);
        }
    }

    info(...message: any[]): void {
        if (!this.config.infoLogs) return;
        this.log(console.info, styleText("blue", "[INFO]"), ...message);
    }

    debug(...message: any[]): void {
        if (!this.config.debugLogs) return;
        this.log(
            console.debug,
            // not a typo, just want it to align with the others :D
            styleText("magenta", "[DEBG]"),
            ...message,
        );
    }

    warn(...message: any[]): void {
        if (!this.config.warnLogs) return;
        this.log(console.warn, styleText("yellow", "[WARN]"), ...message);
    }

    error(...message: any[]): void {
        if (!this.config.errorLogs) return;
        this.log(console.error, styleText("red", "[ERROR]"), ...message);
    }
}
