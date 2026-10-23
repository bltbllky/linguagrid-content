import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { exportReview } from './export-review.ts';
import { applyReview } from './import-review.ts';
import { applyRoundtrip } from './import-roundtrip.ts';
import { partialEnglish, validContent } from './fixtures/valid.ts';
import { loadStage, mergeStage, stageFiles, stageReport, takeStage, validateStage } from './stage.ts';
import type { Stage } from './stage.ts';
import { loadContent } from './validate.ts';
import type { Annotation, TranslationFile, Word } from './validate.ts';

function stage(): Stage {
  return {
    level: 'B1',
    words: [{ id: 'noun-gemeente', lemma_nl: 'gemeente', pos: 'noun', cefr: 'B1', source: 'own' }],
    categories: [{ id: 'b1-services', cefr: 'B1', order: 32 }],
    annotations: [{ word_id: 'noun-gemeente', article: 'de', category_id: 'b1-services', reviewed: false }],
    translations: {
      tr: {
        lang: 'tr',
        words: [{ word_id: 'noun-gemeente', text: 'belediye', reviewed: false }],
        categories: [{ category_id: 'b1-services', title: 'Kamu hizmetleri' }],
      },
    },
  };
}

const run = (s: Stage) => validateStage(validContent(), s);

describe('validateStage', () => {
  it('accepts a valid stage', () => {
    assert.deepEqual(run(stage()), { errors: [], incomplete: [] });
  });

  it('rejects a non-B1 level and a non-own source', () => {
    const a = stage();
    a.words[0].cefr = 'A2';
    assert.ok(run(a).errors.includes('noun-gemeente: level A2 in the B1 stage'));
    const b = stage();
    b.words[0].source = 'nt2lex';
    assert.ok(run(b).errors.includes('noun-gemeente: source nt2lex in the B1 stage (own selection only; B1 is not NT2Lex-derived)'));
  });

  it('rejects a lemma that is live, under any part of speech', () => {
    const s = stage();
    s.words.push({ id: 'noun-lopen', lemma_nl: 'lopen', pos: 'noun', cefr: 'B1', source: 'own' });
    s.annotations!.push({ word_id: 'noun-lopen', article: 'het', category_id: 'b1-services', reviewed: false });
    s.translations.tr!.words.push({ word_id: 'noun-lopen', text: 'yürüyüş', reviewed: false });
    assert.ok(run(s).errors.includes('noun-lopen: lemma "lopen" is already in verb-lopen'));
  });

  it('rejects a lemma staged twice', () => {
    const s = stage();
    s.words = [
      { id: 'noun-eten', lemma_nl: 'eten', pos: 'noun', cefr: 'B1', source: 'own' },
      { id: 'verb-eten', lemma_nl: 'eten', pos: 'verb', cefr: 'B1', source: 'own' },
    ];
    s.annotations = [
      { word_id: 'noun-eten', article: 'het', category_id: 'b1-services', reviewed: false },
      { word_id: 'verb-eten', article: null, category_id: 'b1-services', reviewed: false },
    ];
    s.translations.tr!.words = [
      { word_id: 'noun-eten', text: 'yemek', reviewed: false },
      { word_id: 'verb-eten', text: 'yemek yemek', reviewed: false },
    ];
    assert.ok(run(s).errors.includes('verb-eten: lemma "eten" is staged twice (noun-eten)'));
  });

  it('checks staged categories', () => {
    const a = stage();
    a.categories[0].cefr = 'A2';
    assert.ok(run(a).errors.includes('b1-services: staged category must be B1'));
    const b = stage();
    b.categories.push({ id: 'health', cefr: 'B1', order: 33 });
    assert.ok(run(b).errors.includes('health: category id is already live'));
  });

  it('rejects a staged word in a live category', () => {
    const s = stage();
    s.annotations![0].category_id = 'health';
    assert.ok(run(s).errors.includes('noun-gemeente: B1 word in a non-B1 category "health"'));
  });

  it('applies the live rules', () => {
    const a = stage();
    Object.assign(a.words[0], { id: 'noun-gemeentehuizen', lemma_nl: 'gemeentehuizen' });
    a.annotations![0].word_id = 'noun-gemeentehuizen';
    a.translations.tr!.words[0].word_id = 'noun-gemeentehuizen';
    assert.ok(run(a).errors.some((e) => e.includes('longer than 12 letters')));
    const b = stage();
    b.annotations![0].article = null;
    assert.ok(run(b).errors.includes('noun-gemeente: noun without de/het article'));
  });

  it('reports absent files as incomplete, not as errors', () => {
    const a = stage();
    delete a.annotations;
    assert.deepEqual(run(a), { errors: [], incomplete: ['noun-gemeente: missing annotation'] });
    const b = stage();
    b.translations = {};
    const r = run(b);
    assert.deepEqual(r.errors, []);
    assert.deepEqual(r.incomplete.sort(), ['b1-services: missing Turkish category title', 'noun-gemeente: missing Turkish translation']);
  });

  it('treats a gap in an existing Turkish file as an error', () => {
    const s = stage();
    s.translations.tr!.words = [];
    const r = run(s);
    assert.ok(r.errors.includes('noun-gemeente: missing Turkish translation'));
    assert.deepEqual(r.incomplete, []);
  });
});

describe('mergeStage and loadStage', () => {
  it('merges per language, a missing side counting as empty', () => {
    const s = stage();
    s.translations.en = { lang: 'en', words: [{ word_id: 'noun-gemeente', text: 'municipality', reviewed: false }], categories: [] };
    const merged = mergeStage(validContent(), s);
    assert.equal(merged.words.length, 3);
    assert.equal(merged.translations.tr.words.length, 3);
    assert.equal(merged.translations.en?.words.length, 1);
  });

  function root(withStage: boolean): string {
    const dir = mkdtempSync(join(tmpdir(), 'lgc-'));
    const live = validContent();
    const put = (file: string, value: unknown) => {
      mkdirSync(join(file, '..'), { recursive: true });
      writeFileSync(file, JSON.stringify(value));
    };
    put(join(dir, 'data', 'words.json'), live.words);
    put(join(dir, 'data', 'annotations.json'), live.annotations);
    put(join(dir, 'data', 'categories.json'), live.categories);
    put(join(dir, 'data', 'translations', 'tr.json'), live.translations.tr);
    put(join(dir, 'manifest.json'), live.manifest);
    if (withStage) put(join(dir, 'data', 'b1', 'words.json'), stage().words);
    return dir;
  }

  it('is ignored by loadContent and read by loadStage', () => {
    const dir = root(true);
    assert.ok(!loadContent(dir).words.some((w) => w.id === 'noun-gemeente'));
    assert.ok(loadStage('b1', dir).words.some((w) => w.id === 'noun-gemeente'));
    assert.throws(() => loadStage('b2', dir), /Unknown stage "b2"/);
  });

  it('returns an empty stage without data/b1', () => {
    const s = loadStage('b1', root(false));
    assert.deepEqual(s.words, []);
    assert.deepEqual(s.categories, []);
    assert.equal(s.annotations, undefined);
  });

  it('takes --stage and its name out of the arguments', () => {
    const dir = root(true);
    const args = ['--stage', 'b1', 'b1'];
    const s = takeStage(args, dir);
    assert.deepEqual(args, ['b1']);
    assert.ok(s?.words.some((w) => w.id === 'noun-gemeente'));
    const plain = ['a1'];
    assert.equal(takeStage(plain, dir), undefined);
    assert.deepEqual(plain, ['a1']);
    assert.throws(() => takeStage(['--stage'], dir), /Usage: .*--stage b1/);
  });
});

describe('stageReport', () => {
  it('summarises the stage and its B1 coverage', () => {
    const lines = stageReport(validContent(), stage());
    assert.equal(lines[0], 'B1 stage: 1 words (1 nouns, 0 verbs, 0 adjectives), 1 categories');
    assert.ok(lines.some((l) => l.startsWith('tr B1: 1 translated, 0 reviewed (0 by round trip) / 1 words')));
  });
});

describe('stageFiles', () => {
  it('keys only data/b1/ paths; a round-trip OK marks the staged Turkish word and drops deprecated text_tr', () => {
    const s = stage();
    s.annotations![0].text_tr = 'belediye';
    const { content } = applyRoundtrip(mergeStage(validContent(), s), 'id,verdict\nnoun-gemeente,OK\n', 'tr');
    const files = stageFiles(content, s);
    assert.ok(Object.keys(files).every((key) => key.startsWith('data/b1/')));
    assert.deepEqual((files['data/b1/words.json'] as Word[]).map((w) => w.id), ['noun-gemeente']);
    const tr = files['data/b1/translations/tr.json'] as TranslationFile;
    assert.deepEqual(tr.words, [{ word_id: 'noun-gemeente', text: 'belediye', reviewed: true, review_source: 'roundtrip' }]);
    const annotations = files['data/b1/annotations.json'] as Annotation[];
    assert.deepEqual(annotations.map((a) => a.word_id), ['noun-gemeente']);
    assert.ok(annotations.every((a) => !('text_tr' in a)));
  });

  it('writes the changed staged English file and never a live English word', () => {
    const s = stage();
    s.translations.en = { lang: 'en', words: [{ word_id: 'noun-gemeente', text: 'municipality', reviewed: false }], categories: [] };
    const live = validContent();
    live.translations.en = partialEnglish();
    const { content } = applyRoundtrip(mergeStage(live, s), 'id,verdict\nnoun-gemeente,OK\n', 'en');
    const files = stageFiles(content, s);
    const en = files['data/b1/translations/en.json'] as TranslationFile;
    assert.deepEqual(en.words, [{ word_id: 'noun-gemeente', text: 'municipality', reviewed: true, review_source: 'roundtrip' }]);
    assert.deepEqual((files['data/b1/translations/tr.json'] as TranslationFile).words[0].reviewed, false);
  });

  it('drops a word the owner removed from every staged file', () => {
    const s = stage();
    const sheet = 'id,dutch,article,turkish,category,decision\nnoun-gemeente,gemeente,de,belediye,Kamu hizmetleri,REMOVE\n';
    const { content, excluded } = applyReview(mergeStage(validContent(), s), sheet);
    assert.deepEqual(excluded, [{ id: 'noun-gemeente', reason: 'removed in review' }]);
    const files = stageFiles(content, s);
    assert.deepEqual(files['data/b1/words.json'], []);
    assert.deepEqual(files['data/b1/annotations.json'], []);
    assert.deepEqual((files['data/b1/translations/tr.json'] as TranslationFile).words, []);
  });

  it('has no annotations key when the stage has no annotations file', () => {
    const s = stage();
    delete s.annotations;
    const files = stageFiles(mergeStage(validContent(), s), s);
    assert.ok(!('data/b1/annotations.json' in files));
  });
});

describe('exportReview for the stage', () => {
  it('lists the staged B1 words and no live word', () => {
    const csv = exportReview(mergeStage(validContent(), stage()), 'B1');
    const rows = csv.split('\n');
    assert.ok(rows.includes('noun-gemeente,gemeente,de,belediye,Kamu hizmetleri,'));
    assert.ok(!csv.includes('noun-tandarts'));
  });
});
