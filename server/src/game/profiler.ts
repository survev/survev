import { styleText } from "node:util";
import type { Logger } from "../../../shared/utils/logger";

interface Sample {
    name: string;
    started: number;
    ended: number;
    took: number;
}

interface Stack {
    name: string;
    started: number;
}

export class Profiler {
    samples: Record<string, Sample> = {};
    stack: Array<Stack> = [];

    addSample(name: string) {
        this.stack.push({
            name,
            started: performance.now(),
        });
    }

    endSample() {
        const now = performance.now();
        const last = this.stack.pop()!;

        this.samples[last.name] = {
            name: last.name,
            started: last.started,
            ended: now,
            took: now - last.started,
        };
    }

    getStats() {
        return Object.values(this.samples)
            .sort((b, a) => {
                return a.took - b.took;
            })
            .map((s) => {
                return `${`${s.took.toFixed(2)}ms`.padEnd(8)} ${s.name}`;
            })
            .join("\n");
    }

    flush() {
        this.samples = {};
        this.stack = [];
    }
}

export class TickProfiler {
    profileTick = 0;

    private _tickStart = 0;

    private _dt = 0;
    private _dtHistory: number[] = [];

    get dt() {
        return this._dt;
    }

    private _mspt = 0;
    private _msptHistory: number[] = [];

    get mspt() {
        return this._mspt;
    }

    name: string;
    debugEnabled: boolean;

    constructor(name: string, debugEnabled: boolean) {
        this.name = name;
        this.debugEnabled = debugEnabled;
    }

    beginTick() {
        const now = performance.now();
        this._dt = now - (this._tickStart || now);
        this._tickStart = now;

        if (this.debugEnabled) {
            this._dtHistory.push(this._dt);
        }
    }

    endTick() {
        const now = performance.now();
        const tickTime = now - this._tickStart;
        this._mspt = tickTime;

        if (this.debugEnabled) {
            this._msptHistory.push(tickTime);
        }
    }

    getStats() {
        this._dtHistory.sort((a, b) => a - b);
        const dtSum = this._dtHistory.reduce((a, b) => a + b, 0);
        const dtAvg = dtSum / this._dtHistory.length;
        const dtMin = this._dtHistory[0];
        const dtMax = this._dtHistory[this._dtHistory.length - 1];
        const dtMed = this._dtHistory[Math.floor(this._dtHistory.length * 0.5)];
        const dtP95 = this._dtHistory[Math.floor(this._dtHistory.length * 0.95)];
        this._dtHistory.length = 0;

        this._msptHistory.sort((a, b) => a - b);
        const msptSum = this._msptHistory.reduce((a, b) => a + b, 0);
        const msptAvg = msptSum / this._msptHistory.length;
        const msptMin = this._msptHistory[0];
        const msptMax = this._msptHistory[this._msptHistory.length - 1];
        const msptMed = this._msptHistory[Math.floor(this._msptHistory.length * 0.5)];
        const msptP95 = this._msptHistory[Math.floor(this._msptHistory.length * 0.95)];
        this._msptHistory.length = 0;

        return {
            dt: this._dt,
            dtMin,
            dtMax,
            dtAvg,
            dtMed,
            dtP95,
            mspt: this._mspt,
            msptMin,
            msptMax,
            msptAvg,
            msptMed,
            msptP95,
        };
    }

    printStats(
        logger: Logger,
        stats: ReturnType<this["getStats"]>,
        expectedTps: number,
    ) {
        const expectedDt = 1000 / expectedTps;
        const formatNumber = (dt: number) => {
            let color: "green" | "red" | "yellow" = "green";
            if (dt > (expectedDt * 2)) {
                color = "red";
            } else if (dt > (expectedDt + (expectedDt / 3))) {
                color = "yellow";
            }
            return styleText(color, dt.toFixed(2).padStart(5));
        };

        logger.debug(`--- ${this.name} tick stats:`);

        logger.debug(
            "dt  :",
            "min:",
            formatNumber(stats.dtMin),
            "max:",
            formatNumber(stats.dtMax),
            "avg:",
            formatNumber(stats.dtAvg),
            "med:",
            formatNumber(stats.dtMed),
            "p95:",
            formatNumber(stats.dtP95),
        );
        logger.debug(
            "mspt:",
            "min:",
            formatNumber(stats.msptMin),
            "max:",
            formatNumber(stats.msptMax),
            "avg:",
            formatNumber(stats.msptAvg),
            "med:",
            formatNumber(stats.msptMed),
            "p95:",
            formatNumber(stats.msptP95),
        );
    }
}
