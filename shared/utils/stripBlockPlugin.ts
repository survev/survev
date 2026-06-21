// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) 2023 gyeongseok.seo
// copied from https://github.com/gseok/vite-plugin-strip-block

import type { Plugin } from "rolldown";
import { RolldownMagicString } from "rolldown";

interface StripBlockPluginOptions {
    start?: string;
    end?: string;
}

const escapeRe = (s: string) => s.replace(/[-[\]{}()*+?.,\\^$\\/|#]/g, "\\$&");

export const stripBlockPlugin = (options: StripBlockPluginOptions): Plugin => {
    // ref: https://github.com/jballant/webpack-strip-block
    const startEsc = escapeRe(options.start || "develblock:start");
    const endEsc = escapeRe(options.end || "develblock:end");
    const regexPattern = new RegExp(
        `\\/\\* ?${startEsc} ?\\*\\/[\\s\\S]*?\\/\\* ?${endEsc} ?\\*\\/`,
        "g",
    );

    return {
        name: "vite-plugin-strip-block",
        // needed for vite
        enforce: "pre",
        transform(code, id) {
            // is not 'js, jsx, ts, tsx' file then bypass
            if (!/\.([jt]sx?)$/.test(id)) {
                return null;
            }
            regexPattern.lastIndex = 0;
            const s = new RolldownMagicString(code);
            let match: RegExpExecArray | null;
            while ((match = regexPattern.exec(code)) !== null) {
                s.remove(match.index, match.index + match[0].length);
            }
            return {
                code: s.toString(),
                map: s.generateMap({ hires: true }).toString(),
            };
        },
    } as Plugin;
};
