/*
MIT License

Copyright (c) 2023 gyeongseok.seo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import type { Plugin } from 'vite';

interface StripBlockPluginOptions {
  start?: string;
  end?: string;
}

const regexCharsRegex = /[-[\]{}()*+?.,\\^$\\/|#]/g;

const escapeRegexChars = (comment: string) => {
  return comment && regexCharsRegex.test(comment) ? comment.replace(regexCharsRegex, '\\$&') : comment;
};

export const stripBlockPlugin = (options: StripBlockPluginOptions): Plugin => {
  // ref: https://github.com/jballant/webpack-strip-block
  return {
    name: 'vite-plugin-strip-block',
    enforce: 'pre',
    transform(code, id) {
      // is not 'js, jsx, ts, tsx' file then bypass
      if (!/\.([jt]sx?)$/.test(id)) {
        return code;
      }
      const startComment = escapeRegexChars(options.start || 'develblock:start');
      const endComment = escapeRegexChars(options.end || 'develblock:end');

      const startWhitespaceMatcher = '';
      const endWhitespaceMatcher = '';

      const regexPattern = new RegExp(
        startWhitespaceMatcher +
        '\\/\\* ?' +
        startComment +
        ' ?\\*\\/[\\s\\S]*?\\/\\* ?' +
        endComment +
        ' ?\\*\\/' +
        endWhitespaceMatcher,
        'g',
      );

      return code.replace(regexPattern, '');
    },
  };
};
