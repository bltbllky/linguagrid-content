import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validContent } from './fixtures/valid.ts';
import { exportReview } from './export-review.ts';

describe('exportReview', () => {
  it('lists the words of one level with article, translation, category and decision', () => {
    const csv = exportReview(validContent(), 'A1');
    assert.equal(
      csv,
      [
        'id,dutch,article,turkish,category,decision',
        'noun-tandarts,tandarts,de,diş hekimi,Sağlık,OK',
        'verb-lopen,lopen,,yürümek,Sağlık,',
        '',
      ].join('\n'),
    );
  });

  it('quotes values containing commas or quotes and skips other levels', () => {
    const content = validContent();
    content.annotations[0].text_tr = 'kart, "harita"';
    content.words[1].cefr = 'A2';
    const lines = exportReview(content, 'A1').trim().split('\n');
    assert.equal(lines.length, 2);
    assert.equal(lines[1], 'noun-tandarts,tandarts,de,"kart, ""harita""",Sağlık,OK');
  });

  it('leaves fields empty for words without annotations', () => {
    const content = validContent();
    content.annotations = [];
    assert.equal(exportReview(content, 'A1').split('\n')[1], 'noun-tandarts,tandarts,,,,');
  });
});
