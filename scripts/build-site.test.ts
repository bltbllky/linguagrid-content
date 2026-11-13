import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { buildSite } from './build-site.ts';

describe('buildSite', () => {
  it('copies the manifest, data and licence into the output folder and skips missing entries', () => {
    const root = mkdtempSync(join(tmpdir(), 'lgc-'));
    mkdirSync(join(root, 'data'));
    writeFileSync(join(root, 'data', 'words.json'), '[]');
    writeFileSync(join(root, 'manifest.json'), '{}');
    writeFileSync(join(root, 'LICENSE-DATA.md'), '# licences');
    const out = join(root, 'public');

    assert.deepEqual(buildSite(root, out), ['manifest.json', 'data', 'LICENSE-DATA.md']);
    assert.ok(existsSync(join(out, 'manifest.json')));
    assert.ok(existsSync(join(out, 'data', 'words.json')));
    assert.ok(!existsSync(join(out, 'privacy')));
  });

  it('publishes the Pages root and the support pages', () => {
    const root = mkdtempSync(join(tmpdir(), 'lgc-'));
    mkdirSync(join(root, 'support'));
    writeFileSync(join(root, 'index.html'), '<h1>LinguaGrid</h1>');
    writeFileSync(join(root, 'support', 'en.html'), '<h1>Support</h1>');
    writeFileSync(join(root, 'manifest.json'), '{}');
    const out = join(root, 'public');

    assert.deepEqual(buildSite(root, out), ['index.html', 'manifest.json', 'support']);
    assert.ok(existsSync(join(out, 'index.html')));
    assert.ok(existsSync(join(out, 'support', 'en.html')));
  });

  it('publishes the privacy redirect pages unchanged', () => {
    const root = mkdtempSync(join(tmpdir(), 'lgc-'));
    mkdirSync(join(root, 'privacy'));
    const redirect = '<meta http-equiv="refresh" content="0; url=https://ugeb.nl/linguagrid/privacy/tr.html">';
    writeFileSync(join(root, 'privacy', 'tr.html'), redirect);
    const out = join(root, 'public');

    assert.deepEqual(buildSite(root, out), ['privacy']);
    assert.equal(readFileSync(join(out, 'privacy', 'tr.html'), 'utf8'), redirect);
  });
});
