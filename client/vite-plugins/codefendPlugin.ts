import * as codefend from "codefend";
import type { Rollup } from "vite";

function randomString() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    const length = Math.floor(Math.random() * 4) + 3;
    while (result.length < length) {
        result += chars.at(Math.floor(Math.random() * chars.length));
    }
    return result;
}
const previousStrings = new Set();
function uniqueString() {
    let string = randomString();
    while (previousStrings.has(string)) {
        string = randomString();
    }
    previousStrings.add(string);
    return string;
}

export function codefendPlugin(): Rollup.Plugin {
    const runtimeOptions = codefend.buildRuntimeOptions();
    return {
        name: "codefend-plugin",
        renderChunk(code) {
            return codefend.obfuscate(
                code,
                {
                    prefix: "_0x",
                    static: [],
                    ignore: [],
                    pool: Array.from({ length: 500 }, uniqueString),
                },
                {
                    name: "codeOnly",
                    regexList: [
                        {
                            name: "main",
                            regex: /(?<![a-zA-Z0-9])m((_[a-zA-Z0-9]+)+)/g,
                        },
                    ],
                },
                runtimeOptions,
            );
        },
        generateBundle() {
            codefend.stats({ stats: false }, runtimeOptions);
        },
    };
}
