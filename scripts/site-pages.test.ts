import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'nl', 'en'];
const SITE = 'https://ugeb.nl/linguagrid';
const DIRS = ['privacy', 'support'];
const read = (file: string): string => readFileSync(join(ROOT, file), 'utf8');
// The eight GitHub Pages paths: six language pages plus the two index pages, which target tr.html.
const PAGES = DIRS.flatMap((dir) => [
  ...LANGS.map((lang) => ({ file: `${dir}/${lang}.html`, lang, target: `${SITE}/${dir}/${lang}.html` })),
  { file: `${dir}/index.html`, lang: 'tr', target: `${SITE}/${dir}/tr.html` },
]);

describe('site pages', () => {
  it('contain no placeholder address', () => {
    for (const file of ['index.html', ...PAGES.map((page) => page.file)]) {
      assert.ok(!read(file).includes('example.invalid'), `${file} has the placeholder`);
    }
  });

  it('redirect each of the eight pages to its ugeb.nl twin with refresh, canonical and a visible link', () => {
    for (const { file, lang, target } of PAGES) {
      const html = read(file);
      assert.ok(html.includes(`<html lang="${lang}">`), `${file} lacks lang="${lang}"`);
      assert.ok(
        html.includes(`<meta http-equiv="refresh" content="0; url=${target}">`),
        `${file} lacks the meta refresh to ${target}`,
      );
      assert.ok(html.includes(`<link rel="canonical" href="${target}">`), `${file} lacks the canonical ${target}`);
      assert.ok(html.includes(`<a href="${target}">`), `${file} lacks the visible link to ${target}`);
    }
  });

  it('link the privacy and support pages from the root only to ugeb.nl', () => {
    const html = read('index.html');
    for (const dir of DIRS) {
      for (const lang of LANGS) {
        assert.ok(html.includes(`href="${SITE}/${dir}/${lang}.html"`), `root lacks the ugeb.nl ${dir}/${lang} link`);
      }
      assert.ok(!html.includes(`href="${dir}/`), `root keeps a relative ${dir}/ link`);
    }
  });

  it('keep no mailto link on the privacy and support pages (the address lives on ugeb.nl)', () => {
    for (const { file } of PAGES) {
      assert.ok(!read(file).includes('mailto:'), `${file} has a mailto link`);
    }
  });
});
