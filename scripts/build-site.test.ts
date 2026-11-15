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

  describe('audio', () => {
    const setup = () => {
      const root = mkdtempSync(join(tmpdir(), 'lgc-'));
      mkdirSync(join(root, 'audio', 'A1'), { recursive: true });
      return root;
    };

    it('copies the indexes and the m4a files with the same paths and bytes', () => {
      const root = setup();
      const bytes = Buffer.from([0, 1, 2, 255]);
      writeFileSync(join(root, 'audio', 'index.json'), '{"levels":["A1"]}');
      writeFileSync(join(root, 'audio', 'A1', 'index.json'), '{"level":"A1"}');
      writeFileSync(join(root, 'audio', 'A1', 'noun-huis-een.m4a'), bytes);
      const out = join(root, 'public');

      assert.deepEqual(buildSite(root, out), ['audio']);
      assert.equal(readFileSync(join(out, 'audio', 'index.json'), 'utf8'), '{"levels":["A1"]}');
      assert.equal(readFileSync(join(out, 'audio', 'A1', 'index.json'), 'utf8'), '{"level":"A1"}');
      assert.deepEqual(readFileSync(join(out, 'audio', 'A1', 'noun-huis-een.m4a')), bytes);
    });

    it('does not copy overrides.json or README.md', () => {
      const root = setup();
      writeFileSync(join(root, 'audio', 'index.json'), '{}');
      writeFileSync(join(root, 'audio', 'overrides.json'), '{}');
      writeFileSync(join(root, 'audio', 'README.md'), '# audio');
      writeFileSync(join(root, 'audio', 'A1', 'notes.txt'), 'x');
      const out = join(root, 'public');

      buildSite(root, out);
      assert.ok(existsSync(join(out, 'audio', 'index.json')));
      assert.ok(!existsSync(join(out, 'audio', 'overrides.json')));
      assert.ok(!existsSync(join(out, 'audio', 'README.md')));
      assert.ok(!existsSync(join(out, 'audio', 'A1', 'notes.txt')));
    });

    it('writes no public/audio when there is no audio folder', () => {
      const root = mkdtempSync(join(tmpdir(), 'lgc-'));
      writeFileSync(join(root, 'manifest.json'), '{}');
      const out = join(root, 'public');

      assert.deepEqual(buildSite(root, out), ['manifest.json']);
      assert.ok(!existsSync(join(out, 'audio')));
    });

    it('copies AUDIO-LICENCE.md as the notice', () => {
      const root = setup();
      writeFileSync(join(root, 'audio', 'AUDIO-LICENCE.md'), '# licence');
      const out = join(root, 'public');

      buildSite(root, out);
      assert.equal(readFileSync(join(out, 'audio', 'AUDIO-LICENCE.md'), 'utf8'), '# licence');
    });
  });
});
