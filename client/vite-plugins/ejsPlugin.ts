import ejs from "ejs";
import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import type { Plugin } from "vite";

export function ejsPlugin(): Plugin {
    return {
        name: "ejs",
        async transform(_code, id) {
            if (id.endsWith(".ejs")) {
                const src = await readFile(id, "utf-8");
                const code = ejs
                    .compile(src, {
                        client: true,
                        strict: true,
                        rmWhitespace: true,
                        // skip uglifyjs since vite will minify it anyway
                        beautify: true,
                        localsName: "env",
                        filename: relative(import.meta.dirname, id),
                    })
                    .toString();
                return `export default ${code}`;
            }
        },
    };
}
