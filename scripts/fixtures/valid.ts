import type { Content } from '../validate.ts';

export function validContent(): Content {
  return {
    categories: [{ id: 'health', title_tr: 'Sağlık', cefr: 'A1', order: 1 }],
    words: [
      { id: 'noun-tandarts', lemma_nl: 'tandarts', pos: 'noun', cefr: 'A1', source: 'nt2lex' },
      { id: 'verb-lopen', lemma_nl: 'lopen', pos: 'verb', cefr: 'A1', source: 'nt2lex' },
    ],
    annotations: [
      { word_id: 'noun-tandarts', text_tr: 'diş hekimi', article: 'de', category_id: 'health', reviewed: true },
      { word_id: 'verb-lopen', text_tr: 'yürümek', article: null, category_id: 'health', reviewed: false },
    ],
    manifest: { content_version: 1, min_app_version: { ios: '0.1.0', android: '0.1.0' }, files: [] },
  };
}
