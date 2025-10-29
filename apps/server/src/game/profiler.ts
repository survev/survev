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
