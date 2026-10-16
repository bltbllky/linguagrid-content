import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkMigration, migrateTranslations } from './migrate-translations.ts';

const legacy = () => ({
  annotations: [
    { word_id: 'noun-tandarts', text_tr: 'diş hekimi', article: 'de' as const, category_id: 'health', reviewed: true },
    { word_id: 'verb-lopen', text_tr: 'yürümek', article: null, category_id: 'health', reviewed: false },
  ],
  categories: [
    { id: 'health', title_tr: 'Sağlık', cefr: 'A1' as const, order: 1 },
    { id: 'home', title_tr: 'Ev', cefr: 'A1' as const, order: 2 },
  ],
});
const migrate = () => migrateTranslations(legacy().annotations, legacy().categories);

describe('migrateTranslations', () => {
  it('moves every Turkish text, title and review state into tr.json and keeps the neutral fields', () => {
    const { annotations, categories, tr } = migrate();
    assert.deepEqual(tr.words, [
      { word_id: 'noun-tandarts', text: 'diş hekimi', reviewed: true },
      { word_id: 'verb-lopen', text: 'yürümek', reviewed: false },
    ]);
    assert.deepEqual(tr.categories, [
      { category_id: 'health', title: 'Sağlık' },
      { category_id: 'home', title: 'Ev' },
    ]);
    assert.equal(tr.lang, 'tr');
    assert.deepEqual(annotations[0], { word_id: 'noun-tandarts', article: 'de', category_id: 'health', reviewed: true });
    assert.deepEqual(categories[1], { id: 'home', cefr: 'A1', order: 2 });
    assert.deepEqual(checkMigration(legacy(), migrate()), []);
  });
});

describe('checkMigration', () => {
  it('reports every changed text, title, review state, neutral field, missing or added entry', () => {
    const cases: [(m: ReturnType<typeof migrate>) => void, string][] = [
      [(m) => (m.tr.words[0].text = 'diş doktoru'), 'noun-tandarts: changed by the migration'],
      [(m) => (m.tr.words[1].reviewed = true), 'verb-lopen: changed by the migration'],
      [(m) => (m.annotations[0].reviewed = false), 'noun-tandarts: changed by the migration'],
      [(m) => (m.annotations[0].article = 'het'), 'noun-tandarts: changed by the migration'],
      [(m) => m.annotations.pop(), 'verb-lopen: changed by the migration'],
      [(m) => (m.tr.categories[1].title = 'Konut'), 'home: changed by the migration'],
      [(m) => m.tr.categories.pop(), 'home: changed by the migration'],
      [(m) => (m.categories[0].order = 5), 'health: changed by the migration'],
      [(m) => m.tr.words.push({ word_id: 'noun-ghost', text: 'hayalet', reviewed: false }), 'noun-ghost: added by the migration'],
    ];
    for (const [change, expected] of cases) {
      const after = migrate();
      change(after);
      assert.deepEqual(checkMigration(legacy(), after), [expected]);
    }
  });
});
