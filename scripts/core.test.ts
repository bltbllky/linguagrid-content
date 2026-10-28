import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { carryOver, overlapRows } from './core.ts';
import { validContent } from './fixtures/valid.ts';
import type { Word } from './validate.ts';

const w = (id: string, cefr: Word['cefr'], source: Word['source'] = 'own'): Word => {
  const [pos, lemma_nl] = id.split('-');
  return { id, lemma_nl, pos: pos as Word['pos'], cefr, source };
};

describe('overlapRows', () => {
  it('classes kept, level-move, new and retired, sorted by class then id', () => {
    const launch = [w('noun-huis', 'A1', 'nt2lex'), w('verb-lopen', 'A1', 'nt2lex'), w('noun-kaas', 'A2', 'nt2lex')];
    const core = [w('noun-huis', 'A1'), w('verb-lopen', 'A2'), w('noun-fiets', 'A2')];
    assert.deepEqual(overlapRows(launch, core), [
      { id: 'noun-huis', dutch: 'huis', pos: 'noun', launch_level: 'A1', core_level: 'A1', class: 'kept' },
      { id: 'verb-lopen', dutch: 'lopen', pos: 'verb', launch_level: 'A1', core_level: 'A2', class: 'level-move' },
      { id: 'noun-fiets', dutch: 'fiets', pos: 'noun', launch_level: '', core_level: 'A2', class: 'new' },
      { id: 'noun-kaas', dutch: 'kaas', pos: 'noun', launch_level: 'A2', core_level: '', class: 'retired' },
    ]);
  });

  it('treats the same lemma under another part of speech as one retired and one new id', () => {
    const rows = overlapRows([w('noun-werk', 'A1', 'nt2lex')], [w('verb-werk', 'A1')]);
    assert.deepEqual(rows.map((r) => [r.id, r.class]), [['verb-werk', 'new'], ['noun-werk', 'retired']]);
  });
});

describe('carryOver', () => {
  const live = () => {
    const c = validContent();
    c.words[0] = { ...c.words[0], id: 'noun-huis', lemma_nl: 'huis' };
    c.annotations[0].word_id = 'noun-huis';
    c.annotations[0].text_tr = 'ev';
    c.translations.tr.words[0].word_id = 'noun-huis';
    return c;
  };

  it('carries a kept word with its review state and text', () => {
    const { annotations, translations } = carryOver(live(), [w('noun-huis', 'A1')]);
    assert.deepEqual(annotations, [{ word_id: 'noun-huis', article: 'de', category_id: 'health', reviewed: true, review_source: 'owner' }]);
    assert.deepEqual(translations.tr, [{ word_id: 'noun-huis', text: 'diş hekimi', reviewed: true, review_source: 'owner' }]);
  });

  it('un-reviews a level move but keeps article and text', () => {
    const { annotations, translations } = carryOver(live(), [w('noun-huis', 'A2')]);
    assert.deepEqual(annotations, [{ word_id: 'noun-huis', article: 'de', category_id: 'health', reviewed: false }]);
    assert.equal(translations.tr[0].text, 'diş hekimi');
  });

  it('gives a new word no row', () => {
    const { annotations, translations } = carryOver(live(), [w('noun-fiets', 'A2')]);
    assert.deepEqual(annotations, []);
    assert.deepEqual(translations.tr, []);
  });
});
