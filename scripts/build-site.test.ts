import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
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
});
