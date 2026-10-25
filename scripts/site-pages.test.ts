import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'nl', 'en'];
const read = (file: string): string => readFileSync(join(ROOT, file), 'utf8');
const SUPPORT = LANGS.map((lang) => `support/${lang}.html`);
const PRIVACY = LANGS.map((lang) => `privacy/${lang}.html`);

describe('site pages', () => {
  it('contain no placeholder address', () => {
    for (const file of ['index.html', 'support/index.html', ...SUPPORT, ...PRIVACY]) {
      assert.ok(!read(file).includes('example.invalid'), `${file} has the placeholder`);
    }
  });

  it('show one and the same email address on the support and privacy pages', () => {
    const addresses = new Set<string>();
    for (const file of [...SUPPORT, ...PRIVACY]) {
      const found = [...read(file).matchAll(/mailto:([^"?]+)/g)].map((m) => m[1]);
      if (file.startsWith('support/')) assert.ok(found.length >= 1, `${file} has no mailto link`);
      for (const address of found) addresses.add(address);
    }
    assert.equal(addresses.size, 1, [...addresses].join(', '));
  });

  it('use ugebdev@gmail.com as the one contact address on the six pages', () => {
    const addresses = new Set<string>();
    for (const file of [...SUPPORT, ...PRIVACY]) {
      for (const m of read(file).matchAll(/mailto:([^"?]+)/g)) addresses.add(m[1]);
    }
    assert.deepEqual([...addresses], ['ugebdev@gmail.com']);
  });

  it('give each support page its language, privacy link and language switcher', () => {
    for (const lang of LANGS) {
      const html = read(`support/${lang}.html`);
      assert.ok(html.includes(`<html lang="${lang}">`));
      assert.ok(html.includes(`href="../privacy/${lang}.html"`));
      for (const other of LANGS) assert.ok(html.includes(`href="${other}.html"`));
    }
  });

  it('link the support and privacy pages from the root without a redirect', () => {
    const html = read('index.html');
    for (const lang of LANGS) {
      assert.ok(html.includes(`href="support/${lang}.html"`));
      assert.ok(html.includes(`href="privacy/${lang}.html"`));
    }
    assert.ok(!html.includes('http-equiv="refresh"'));
  });
});
