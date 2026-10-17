import type { Content, TranslationFile } from '../validate.ts';

export function validContent(): Content {
  return {
    categories: [{ id: 'health', cefr: 'A1', order: 1 }],
    words: [
      { id: 'noun-tandarts', lemma_nl: 'tandarts', pos: 'noun', cefr: 'A1', source: 'nt2lex' },
      { id: 'verb-lopen', lemma_nl: 'lopen', pos: 'verb', cefr: 'A1', source: 'nt2lex' },
    ],
    annotations: [
      { word_id: 'noun-tandarts', article: 'de', category_id: 'health', reviewed: true, review_source: 'owner' },
      { word_id: 'verb-lopen', article: null, category_id: 'health', reviewed: false },
    ],
    translations: {
      tr: {
        lang: 'tr',
        words: [
          { word_id: 'noun-tandarts', text: 'diş hekimi', reviewed: true, review_source: 'owner' },
          { word_id: 'verb-lopen', text: 'yürümek', reviewed: false },
        ],
        categories: [{ category_id: 'health', title: 'Sağlık' }],
      },
    },
    manifest: { content_version: 1, min_app_version: { ios: '0.1.0', android: '0.1.0' }, files: [] },
  };
}

/** An English file that covers only part of the fixture words. */
export function partialEnglish(): TranslationFile {
  return { lang: 'en', words: [{ word_id: 'noun-tandarts', text: 'dentist', reviewed: true, review_source: 'owner' }], categories: [] };
}
