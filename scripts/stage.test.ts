import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { exportReview } from './export-review.ts';
import { applyReview } from './import-review.ts';
import { applyRoundtrip } from './import-roundtrip.ts';
import { partialEnglish, validContent } from './fixtures/valid.ts';
import { loadStage, mergeStage, promoteStage, stageFiles, stageReport, takeStage, validateStage, withoutNt2lex } from './stage.ts';
import type { Stage } from './stage.ts';
import { loadContent, validateContent } from './validate.ts';
import type { Annotation, Content, TranslationFile, Word } from './validate.ts';

function stage(): Stage {
  return {
    name: 'b1',
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
    assert.throws(() => loadStage('c1', dir), /Unknown stage "c1"; staged: b1, a1a2, b2, core/);
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
    assert.throws(() => takeStage(['--stage'], dir), /Usage: .*--stage b1\|a1a2\|b2/);
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

/** The A1/A2 extras: one A1 word in the live A1 category, no categories of its own. */
function extras(): Stage {
  return {
    name: 'a1a2',
    words: [{ id: 'noun-dinsdag', lemma_nl: 'dinsdag', pos: 'noun', cefr: 'A1', source: 'own' }],
    categories: [],
    annotations: [{ word_id: 'noun-dinsdag', article: 'de', category_id: 'health', reviewed: false }],
    translations: { tr: { lang: 'tr', words: [{ word_id: 'noun-dinsdag', text: 'salı', reviewed: false }], categories: [] } },
  };
}

function b2(): Stage {
  const s = stage();
  s.name = 'b2';
  s.words[0].cefr = 'B2';
  s.categories = [{ id: 'b2-law', cefr: 'B2', order: 40 }];
  s.annotations![0].category_id = 'b2-law';
  s.translations.tr!.categories = [{ category_id: 'b2-law', title: 'Recht' }];
  return s;
}

describe('stage profiles', () => {
  it('accepts the A1A2 extras', () => {
    assert.deepEqual(validateStage(validContent(), extras()), { errors: [], incomplete: [] });
  });

  it('checks the A1A2 level, categories and category level', () => {
    const a = extras();
    a.words[0].cefr = 'B1';
    assert.ok(validateStage(validContent(), a).errors.includes('noun-dinsdag: level B1 in the A1A2 stage'));
    const b = extras();
    const live = validContent();
    live.categories.push({ id: 'a2-home', cefr: 'A2', order: 2 });
    live.translations.tr.categories.push({ category_id: 'a2-home', title: 'Thuis' });
    b.annotations![0].category_id = 'a2-home';
    assert.ok(validateStage(live, b).errors.includes('noun-dinsdag: A1 word in category "a2-home" of level A2'));
    const c = extras();
    c.categories = [{ id: 'a1-own', cefr: 'A1', order: 3 }];
    assert.ok(validateStage(validContent(), c).errors.includes('a1-own: the A1A2 stage uses live categories only'));
  });

  it('rejects a lemma staged in another stage', () => {
    const errors = validateStage(validContent(), extras(), [{ ...stage(), words: [{ ...stage().words[0], id: 'noun-dins', lemma_nl: 'dinsdag' }] }]).errors;
    assert.ok(errors.includes('noun-dinsdag: lemma "dinsdag" is already staged in b1 (noun-dins)'));
  });

  it('applies the B1 rules to B2 with level B2', () => {
    assert.deepEqual(validateStage(validContent(), b2()), { errors: [], incomplete: [] });
    const a = b2();
    a.words[0].cefr = 'B1';
    assert.ok(validateStage(validContent(), a).errors.includes('noun-gemeente: level B1 in the B2 stage'));
    const b = b2();
    b.categories[0].id = 'b1-services';
    b.annotations![0].category_id = 'b1-services';
    b.translations.tr!.categories[0].category_id = 'b1-services';
    assert.ok(validateStage(validContent(), b, [stage()]).errors.includes('b1-services: category id is already staged in b1'));
  });

  it('reports the A1A2 stage with its own words only', () => {
    const lines = stageReport(validContent(), extras());
    assert.equal(lines[0], 'A1A2 stage: 1 words (1 nouns, 0 verbs, 0 adjectives), 0 categories');
    assert.ok(lines.includes('tr A1: 1 translated, 0 reviewed (0 by round trip) / 1 words'));
  });

  it('writes the A1A2 files under data/a1a2/ and no categories', () => {
    const s = extras();
    const files = stageFiles(mergeStage(validContent(), s), s);
    assert.ok(Object.keys(files).every((key) => key.startsWith('data/a1a2/')));
    assert.ok(!Object.keys(files).some((key) => key.includes('categories')));
  });

  it('loads an absent b2 folder as an empty stage named b2', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lgc-'));
    const s = loadStage('b2', dir);
    assert.equal(s.name, 'b2');
    assert.deepEqual(s.words, []);
  });
});

describe('loadStage names', () => {
  it('refuses prototype names', () => {
    assert.throws(() => loadStage('constructor'), /Unknown stage "constructor"/);
  });
});

describe('promoteStage (T-153)', () => {
  it('moves the A1/A2 extras into the live files and removes the staged ones', () => {
    const live = validContent();
    const { files, remove } = promoteStage(live, [], extras());
    assert.deepEqual(files['data/words-own.json'], extras().words);
    const annotations = files['data/annotations.json'] as Annotation[];
    assert.deepEqual(annotations.slice(0, live.annotations.length), live.annotations);
    assert.equal(annotations.at(-1)!.word_id, 'noun-dinsdag');
    assert.equal(annotations.at(-1)!.text_tr, 'salı');
    const tr = files['data/translations/tr.json'] as TranslationFile;
    assert.deepEqual(tr.words.map((t) => t.word_id), [...live.translations.tr.words.map((t) => t.word_id), 'noun-dinsdag']);
    assert.deepEqual(tr.categories, live.translations.tr.categories);
    assert.deepEqual(remove, ['data/a1a2/words.json', 'data/a1a2/annotations.json', 'data/a1a2/translations']);
  });

  it('appends after the live own words on a later promotion', () => {
    const earlier: Word = { id: 'noun-woensdag', lemma_nl: 'woensdag', pos: 'noun', cefr: 'A1', source: 'own' };
    const { files } = promoteStage(validContent(), [earlier], extras());
    assert.deepEqual((files['data/words-own.json'] as Word[]).map((w) => w.id), ['noun-woensdag', 'noun-dinsdag']);
  });

  it('leaves the merged result valid', () => {
    const live = validContent();
    const { files } = promoteStage(live, [], extras());
    const merged = {
      ...live,
      words: [...live.words, ...(files['data/words-own.json'] as Word[])],
      annotations: files['data/annotations.json'] as Annotation[],
      translations: { ...live.translations, tr: files['data/translations/tr.json'] as TranslationFile },
    };
    assert.deepEqual(validateContent(merged), []);
  });

  it('writes the deprecated text_tr and title_tr equal to tr.json, in live key order (T-034)', () => {
    for (const [s, ids] of [[stage(), ['noun-gemeente']], [extras(), ['noun-dinsdag']]] as const) {
      const { files } = promoteStage(validContent(), [], s);
      const tr = files['data/translations/tr.json'] as TranslationFile;
      const annotations = files['data/annotations.json'] as Annotation[];
      for (const id of ids) {
        const row = annotations.find((x) => x.word_id === id)!;
        assert.equal(row.text_tr, tr.words.find((t) => t.word_id === id)!.text);
        assert.deepEqual(Object.keys(row), ['word_id', 'text_tr', 'article', 'category_id', 'reviewed']);
      }
      const categories = (files['data/categories.json'] ?? []) as { id: string; title_tr?: string }[];
      for (const c of categories.filter((x) => s.categories.some((y) => y.id === x.id))) assert.equal(c.title_tr, tr.categories.find((t) => t.category_id === c.id)?.title);
    }
  });

  it('refuses B2', () => {
    assert.throws(() => promoteStage(validContent(), [], { ...stage(), name: 'b2' }), /Only a1a2, b1 and core are promoted here/);
  });

  describe('B1 (T-197)', () => {
    const after = () => {
      const live = validContent();
      const { files, remove } = promoteStage(live, [], stage());
      const merged = {
        ...live,
        words: [...live.words, ...(files['data/words-own.json'] as Word[])],
        categories: files['data/categories.json'] as typeof live.categories,
        annotations: files['data/annotations.json'] as Annotation[],
        translations: { ...live.translations, tr: files['data/translations/tr.json'] as TranslationFile },
      };
      return { files, remove, merged };
    };

    it('moves words, categories and category titles into the live files', () => {
      const { files, remove } = after();
      assert.deepEqual((files['data/words-own.json'] as Word[]).map((w) => w.id), ['noun-gemeente']);
      assert.equal((files['data/categories.json'] as { id: string }[]).at(-1)!.id, 'b1-services');
      const tr = files['data/translations/tr.json'] as TranslationFile;
      assert.deepEqual(tr.categories.at(-1), { category_id: 'b1-services', title: 'Kamu hizmetleri' });
      assert.equal(tr.words.at(-1)!.word_id, 'noun-gemeente');
      assert.deepEqual(remove, ['data/b1/words.json', 'data/b1/categories.json', 'data/b1/annotations.json', 'data/b1/translations']);
    });

    it('leaves the merged result valid', () => {
      assert.deepEqual(validateContent(after().merged), []);
    });

    it('keeps rejecting an extras word in a B1 category', () => {
      const extra = extras();
      extra.annotations![0].category_id = 'b1-services';
      const { errors } = validateStage(after().merged, extra);
      assert.ok(errors.includes(`noun-dinsdag: ${extra.words[0].cefr} word in category "b1-services" of level B1`), errors.join('\n'));
    });
  });
});

describe('core stage (ADR-022)', () => {
  /** A core stage that keeps the launch word `noun-tandarts` as an own word, with its annotation and text. */
  function core(): Stage {
    return {
      name: 'core',
      words: [{ id: 'noun-tandarts', lemma_nl: 'tandarts', pos: 'noun', cefr: 'A1', source: 'own' }],
      categories: [],
      annotations: [{ word_id: 'noun-tandarts', article: 'de', category_id: 'health', reviewed: true, review_source: 'owner' }],
      translations: { tr: { lang: 'tr', words: [{ word_id: 'noun-tandarts', text: 'diş hekimi', reviewed: true, review_source: 'owner' }], categories: [] } },
    };
  }

  it('accepts a core word that reuses a launch id and lemma', () => {
    assert.deepEqual(validateStage(validContent(), core()), { errors: [], incomplete: [] });
  });

  it('still rejects a lemma of words-own.json', () => {
    const live = validContent();
    live.words.push({ id: 'noun-gemeente', lemma_nl: 'gemeente', pos: 'noun', cefr: 'B1', source: 'own' });
    live.annotations.push({ word_id: 'noun-gemeente', article: 'de', category_id: 'health', reviewed: false });
    live.translations.tr.words.push({ word_id: 'noun-gemeente', text: 'belediye', reviewed: false });
    const s = core();
    s.words.push({ id: 'noun-gemeente2', lemma_nl: 'gemeente', pos: 'noun', cefr: 'A2', source: 'own' });
    s.annotations!.push({ word_id: 'noun-gemeente2', article: 'de', category_id: 'health', reviewed: false });
    s.translations.tr!.words.push({ word_id: 'noun-gemeente2', text: 'belediye', reviewed: false });
    assert.ok(validateStage(live, s).errors.includes('noun-gemeente2: lemma "gemeente" is already in noun-gemeente'));
  });

  it('rejects a lemma that core shares with another stage, in both directions', () => {
    const extra: Stage = { ...extras(), words: [{ ...extras().words[0], id: 'noun-tand', lemma_nl: 'tandarts' }] };
    assert.ok(validateStage(validContent(), core(), [extra]).errors.includes('noun-tandarts: lemma "tandarts" is already staged in a1a2 (noun-tand)'));
    assert.ok(validateStage(validContent(), extra, [core()]).errors.includes('noun-tand: lemma "tandarts" is already staged in core (noun-tandarts)'));
  });

  it('checks the category level of a core word', () => {
    const live = validContent();
    live.categories.push({ id: 'a1-home', cefr: 'A1', order: 2 });
    live.translations.tr.categories.push({ category_id: 'a1-home', title: 'Thuis' });
    const s = core();
    s.words[0].cefr = 'A2';
    s.annotations![0].category_id = 'a1-home';
    assert.ok(validateStage(live, s).errors.includes('A2 word in category "a1-home" of level A1'.replace(/^/, 'noun-tandarts: ')));
  });

  it('withoutNt2lex drops nt2lex words with their annotations and texts, and keeps categories', () => {
    const live = validContent();
    live.words[1].source = 'own';
    const base = withoutNt2lex(live);
    assert.deepEqual(base.words.map((w) => w.id), ['verb-lopen']);
    assert.deepEqual(base.annotations.map((a) => a.word_id), ['verb-lopen']);
    assert.deepEqual(base.translations.tr.words.map((t) => t.word_id), ['verb-lopen']);
    assert.deepEqual(base.categories, live.categories);
    assert.deepEqual(base.translations.tr.categories, live.translations.tr.categories);
  });

  it('is a stage name that loadStage knows', () => {
    assert.equal(loadStage('core').name, 'core');
  });

  it('mergeStage does not duplicate a kept launch id', () => {
    const ids = mergeStage(validContent(), core()).words.map((w) => w.id);
    assert.equal(ids.filter((id) => id === 'noun-tandarts').length, 1);
  });

  describe('promoteStage', () => {
    /** Keeps `noun-tandarts` (launch, now own), adds `noun-fiets`; `verb-lopen` is retired. */
    function promoted(): Stage {
      const c = core();
      c.words.push({ id: 'noun-fiets', lemma_nl: 'fiets', pos: 'noun', cefr: 'A2', source: 'own' });
      c.annotations!.push({ word_id: 'noun-fiets', article: 'de', category_id: 'health', reviewed: true, review_source: 'owner' });
      c.translations.tr!.words.push({ word_id: 'noun-fiets', text: 'bisiklet', reviewed: true, review_source: 'owner' });
      return c;
    }

    it('empties data/words.json, drops every nt2lex id and appends the core rows', () => {
      const live = validContent();
      const { files, remove } = promoteStage(live, [], promoted());
      assert.deepEqual(files['data/words.json'], []);
      assert.deepEqual((files['data/words-own.json'] as Word[]).map((w) => w.id), ['noun-tandarts', 'noun-fiets']);
      assert.deepEqual((files['data/annotations.json'] as Annotation[]).map((a) => a.word_id), ['noun-tandarts', 'noun-fiets']);
      const tr = files['data/translations/tr.json'] as TranslationFile;
      assert.deepEqual(tr.words.map((t) => t.word_id), ['noun-tandarts', 'noun-fiets']);
      assert.equal((files['data/annotations.json'] as Annotation[])[1].text_tr, 'bisiklet');
      assert.deepEqual(tr.categories, live.translations.tr.categories);
      assert.ok(remove.includes('data/a2-selection.json') && remove.includes('data/core/words.json'));
      assert.equal('data/categories.json' in files, false);
    });

    it('rewrites a live language the stage lacks without its NT2Lex texts', () => {
      const live = validContent();
      live.translations.en = partialEnglish();
      const { files } = promoteStage(live, [], promoted());
      const en = files['data/translations/en.json'] as TranslationFile;
      assert.equal(en.lang, 'en');
      assert.deepEqual(en.words, []);
      assert.deepEqual(en.categories, live.translations.en!.categories);
    });

    it('leaves a valid merged result', () => {
      const live = validContent();
      const { files } = promoteStage(live, [], promoted());
      const merged: Content = {
        ...live,
        words: [...(files['data/words.json'] as Word[]), ...(files['data/words-own.json'] as Word[])],
        annotations: files['data/annotations.json'] as Annotation[],
        translations: { ...live.translations, tr: files['data/translations/tr.json'] as TranslationFile },
      };
      assert.deepEqual(validateContent(merged), []);
    });
  });
});
