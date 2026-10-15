import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validContent } from './fixtures/valid.ts';
import { buildRelease } from './build-release.ts';

describe('buildRelease', () => {
  it('includes only reviewed words and bumps the content version', () => {
    const release = buildRelease(validContent(), { minimums: {}, allowPartial: false });
    assert.equal(release.manifest.content_version, 2);
    assert.deepEqual(
      JSON.parse(release.files['words.json']).map((w: { id: string }) => w.id),
      ['noun-tandarts'],
    );
    assert.equal(JSON.parse(release.files['annotations.json']).length, 1);
  });

  it('lists every file with its sha256 under the versioned release path', () => {
    const release = buildRelease(validContent(), { minimums: {}, allowPartial: false });
    assert.deepEqual(
      release.manifest.files.map((f) => f.path),
      ['release/2/words.json', 'release/2/annotations.json', 'release/2/categories.json'],
    );
    assert.ok(release.manifest.files.every((f) => /^[0-9a-f]{64}$/.test(f.sha256)));
  });

  it('keeps min_app_version untouched', () => {
    const content = validContent();
    content.manifest.min_app_version = { ios: '1.2.0', android: '1.3.0' };
    const release = buildRelease(content, { minimums: {}, allowPartial: false });
    assert.deepEqual(release.manifest.min_app_version, { ios: '1.2.0', android: '1.3.0' });
  });

  it('fails below the minimum reviewed words per level unless partial releases are allowed', () => {
    const options = { minimums: { A1: 400 }, allowPartial: false };
    assert.throws(() => buildRelease(validContent(), options), /A1: 1 reviewed words \(minimum 400\)/);
    assert.doesNotThrow(() => buildRelease(validContent(), { ...options, allowPartial: true }));
  });
});
