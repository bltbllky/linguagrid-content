import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { makeInflected } from './inflection.ts';
import { lemmaPos, loadFunctionWords } from './sentence-check.ts';
import { loadSentenceStage, sentenceStageReport, validateSentenceStage } from './sentence-stage.ts';
import type { SentenceFileRow, SentenceStage } from './sentence-stage.ts';
import type { Pos, Word } from './validate.ts';

const w = (pos: Pos, lemma_nl: string, cefr: Word['cefr']): Word => ({ id: `${pos}-${lemma_nl}`, lemma_nl, pos, cefr, source: 'own' });
const WORDS = [
  w('noun', 'huis', 'A1'), w('noun', 'man', 'A1'), w('noun', 'boom', 'A1'), w('noun', 'kind', 'A1'), w('noun', 'foto', 'A1'),
  w('verb', 'wonen', 'A1'), w('verb', 'werken', 'A1'), w('noun', 'vergadering', 'B1'),
];
const OPENTAAL = new Set(['huis', 'huizen', 'woon', 'mannen', 'bomen', 'werkt']);
const env = {
  words: WORDS,
  annotations: [{ word_id: 'noun-huis', article: 'het' as const, category_id: 'c', reviewed: true }],
  inflected: makeInflected(OPENTAAL, lemmaPos(WORDS)),
  functionWords: loadFunctionWords(),
};
const good = (): SentenceFileRow => ({
  word_id: 'noun-huis', nl: 'Ik woon in een huis.', form: 'huis', distractors: ['man', 'boom', 'kind'], reviewed: false,
});
const stage = (rows = [good()], translations: SentenceStage['translations'] = {}): SentenceStage => ({ rows, translations });
const errors = (s: SentenceStage) => validateSentenceStage(s, env);

describe('validateSentenceStage', () => {
  it('a valid row passes; an empty stage passes', () => {
    assert.deepEqual(errors(stage()), []);
    assert.deepEqual(errors(stage([])), []);
    assert.deepEqual(errors(stage([good()], { tr: [{ word_id: 'noun-huis', text: 'Bir evde oturuyorum.', reviewed: false }] })), []);
  });

  it('a checkSentence failure is reported with the word id and code', () => {
    const row = { ...good(), nl: 'Ik woon in een huis 2.' };
    assert.ok(errors(stage([row])).includes('sentences: noun-huis: digit 2'));
  });

  it('a word id that is not a live or staged A1 or A2 word', () => {
    assert.deepEqual(errors(stage([{ ...good(), word_id: 'noun-nergens' }])), ['sentences: noun-nergens: word_id_not_a1a2']);
    assert.deepEqual(errors(stage([{ ...good(), word_id: 'noun-vergadering' }])), ['sentences: noun-vergadering: word_id_not_a1a2']);
  });

  it('two rows for one word', () => {
    assert.deepEqual(errors(stage([good(), good()])), ['sentences: noun-huis: duplicate_row']);
  });

  it('a translation without a sentence, a duplicate translation, and an empty text', () => {
    const tr = [{ word_id: 'noun-man', text: 'adam', reviewed: false }];
    assert.deepEqual(errors(stage([good()], { tr })), ['sentences/translations/tr: noun-man: translation_without_sentence']);
    const twice = { word_id: 'noun-huis', text: 'x', reviewed: false };
    assert.deepEqual(errors(stage([good()], { tr: [twice, twice] })), ['sentences/translations/tr: noun-huis: duplicate_translation']);
    assert.deepEqual(errors(stage([good()], { tr: [{ ...twice, text: ' ' }] })), ['sentences/translations/tr: noun-huis: empty_text']);
  });

  it('distractors: three distinct surface forms of the same part of speech, none equal to form', () => {
    const run = (distractors: string[]) => errors(stage([{ ...good(), distractors }]));
    assert.deepEqual(run(['man', 'boom']), ['sentences: noun-huis: distractor_count']);
    assert.deepEqual(run(['man', 'boom', 'kind', 'foto']), ['sentences: noun-huis: distractor_count']);
    assert.deepEqual(run(['man', 'man', 'boom']), ['sentences: noun-huis: distractor_duplicate man']);
    assert.deepEqual(run(['huis', 'boom', 'kind']), ['sentences: noun-huis: distractor_is_form huis']);
    assert.deepEqual(run(['man', 'boom', 'zxqv']), ['sentences: noun-huis: distractor_unknown zxqv']);
    assert.deepEqual(run(['man', 'boom', 'wonen']), ['sentences: noun-huis: distractor_pos wonen']);
    assert.deepEqual(run(['mannen', 'bomen', 'kind']), []); // inflected surface forms of nouns
  });

  it('a reviewed row needs a review_source and the other way round; schema violations stop the checks', () => {
    assert.deepEqual(errors(stage([{ ...good(), reviewed: true }])), ['sentences: noun-huis: reviewed without review_source']);
    assert.deepEqual(errors(stage([{ ...good(), review_source: 'owner' }])), ['sentences: noun-huis: review_source without reviewed']);
    const bad = errors(stage([{ ...good(), extra: 1 } as never]));
    assert.ok(bad[0].startsWith('sentences: '), bad[0]);
  });
});

describe('loadSentenceStage and the report', () => {
  it('reads the files, and an absent directory is an empty stage', () => {
    const root = mkdtempSync(join(tmpdir(), 'sent-'));
    assert.deepEqual(loadSentenceStage(root), { rows: [], translations: {} });
    mkdirSync(join(root, 'data', 'sentences', 'translations'), { recursive: true });
    writeFileSync(join(root, 'data', 'sentences', 'sentences.json'), JSON.stringify([good()]));
    writeFileSync(join(root, 'data', 'sentences', 'translations', 'tr.json'), JSON.stringify([]));
    assert.deepEqual(loadSentenceStage(root), { rows: [good()], translations: { tr: [] } });
  });

  it('the report counts sentences and reviewed rows per language', () => {
    assert.deepEqual(sentenceStageReport(stage([])), ['Sentences stage: 0 sentences']);
    const s = stage([good()], { tr: [{ word_id: 'noun-huis', text: 'x', reviewed: true, review_source: 'owner' }] });
    assert.deepEqual(sentenceStageReport(s), ['Sentences stage: 1 sentences', 'tr: 1 translated, 1 reviewed / 1 sentences']);
  });
});
