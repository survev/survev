import { api } from "./api.ts";

class ErrorLog {
    private requests = 0;
    private enabled = true;
    private throttle = false;
    private throttleTimeout = 0;
    private errorLogCount = 0;

    update() {
        const time = new Date().getTime();
        if (this.throttle) {
            if (time > this.throttleTimeout) {
                this.throttle = false;
                this.requests = 0;
            }
        } else {
            this.requests = Math.max(this.requests - 1, 0);
        }
    }

    private sample() {
        return Math.random() <= 0.01;
    }

    private store(loc: string, data: unknown) {
        if (!this.enabled) return;

        this.requests++;

        if (this.requests > 5) {
            this.throttleTimeout = new Date().getTime() + 180 * 1000;
            this.throttle = true;
            return;
        }
        fetch(api.resolveUrl("/api/report_error"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                loc,
                data,
            }),
        });
    }

    storeGeneric(parent: string, child: unknown) {
        // account errors don't give any useful information.. :/
        // they just happen when a network request fails
        // so disable them for now
        if (parent === "account") return;
        if (this.sample()) {
            this.store("storeGeneric", {
                parent: parent,
                child: child,
            });
        }
    }

    logWindowOnError(error: object) {
        if (this.errorLogCount < 2) {
            this.store("windowOnError", error);
            this.errorLogCount++;
        }
    }

    logError(error: string, data?: unknown) {
        this.store("errorLog", { error, data });
    }
}

export const errorLogManager = new ErrorLog();
setInterval(() => {
    errorLogManager.update();
}, 1000);
