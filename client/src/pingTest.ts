declare const PING_TEST_URLS: Array<{
    region: string;
    zone: string;
    url: string;
    https: boolean;
}>;

export class PingTest {
    ptcDataBuf = new ArrayBuffer(1);
    tests = PING_TEST_URLS.map((config) => {
        return {
            region: config.region,
            zone: config.zone,
            url: config.url,
            https: config.https,
            ping: 9999,
            active: false,
            complete: false,
            ws: null as WebSocket | null,
            sendDelay: 0,
            sendTime: 0,
            sendCount: 0,
            recvCount: 0,
            recvCountMax: 6,
            retryCount: 0,
            retryCountMax: 1,
        };
    });

    testsStarted = 0;
    testsCompleted = 0;
    printSummary = true;

    start(regions: string[]) {
        if ("WebSocket" in window) {
            let startCount = 0;
            for (let i = 0; i < this.tests.length; i++) {
                const test = this.tests[i];
                if (!test.active && !test.complete && regions.includes(test.region)) {
                    test.active = true;
                    this.testsStarted++;
                    startCount++;
                }
            }
            if (startCount > 0) {
                this.printSummary = true;
            }
        }
    }

    update(dt: number) {
        type Test = (typeof this.tests)[number];
        const completeTest = (test: Test) => {
            test.active = false;
            test.complete = true;
            this.testsCompleted++;
        };

        const onClose = function (test: Test) {
            if (test.ws) {
                test.ws.close();
                test.ws = null;
            }
            if (!test.complete) {
                if (test.retryCount++ >= test.retryCountMax) {
                    completeTest(test);
                }
            }
        };

        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i];
            if (!test.active) {
                continue;
            }
            if (!test.ws) {
                const ws = new WebSocket(`ws${test.https ? "s" : ""}://${test.url}/ptc`);
                ws.binaryType = "arraybuffer";
                ws.onopen = function () {};
                ws.onmessage = function (_msg) {
                    const elapsed = (Date.now() - test.sendTime) / 1000;
                    test.ping = Math.min(test.ping, elapsed);
                    test.recvCount++;
                    test.sendDelay = 0.125;
                };
                ws.onerror = function (_e) {
                    onClose(test);
                };
                ws.onclose = function () {
                    onClose(test);
                };
                test.ws = ws;
                test.sendDelay = 0;
                test.sendCount = 0;
                test.recvCount = 0;
            }
            if (test.ws.readyState == test.ws.OPEN) {
                test.sendDelay -= dt;
                if (test.sendCount == test.recvCount && test.sendDelay < 0) {
                    test.sendTime = Date.now();
                    test.sendCount++;
                    try {
                        test.ws.send(this.ptcDataBuf);
                    } catch (_e) {
                        test.ws.close();
                    }
                }
                if (test.recvCount >= test.recvCountMax) {
                    completeTest(test);
                    test.ws.close();
                }
            }
        }
        if (this.printSummary && this.isComplete()) {
            const sorted = this.tests.sort((a, b) => {
                return a.ping - b.ping;
            });
            console.log("Ping test results");
            console.log("----------------------------------------");
            for (let i = 0; i < sorted.length; i++) {
                const test = sorted[i];
                console.log(
                    "region",
                    test.region,
                    "zone  ",
                    test.zone,
                    "ping  ",
                    test.ping,
                );
            }
            this.printSummary = false;
        }
    }

    isComplete() {
        return this.testsCompleted == this.testsStarted && this.testsStarted > 0;
    }

    getRegionList() {
        const regions: string[] = [];
        for (let i = 0; i < PING_TEST_URLS.length; i++) {
            const region = PING_TEST_URLS[i].region;
            if (!regions.includes(region)) {
                regions.push(region);
            }
        }
        return regions;
    }

    getRegion() {
        this.tests.sort((a, b) => {
            return a.ping - b.ping;
        });
        return this.tests[0].region;
    }

    getZones(region: string) {
        const sorted = this.tests.sort((a, b) => a.ping - b.ping);
        const zones = [];
        for (let i = 0; i < sorted.length; i++) {
            const s = sorted[i];
            if (s.region == region) {
                zones.push(s.zone);
            }
        }
        return zones;
    }
}
