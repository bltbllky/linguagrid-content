export type SameLang = 'tr' | 'en';

/** ADR-019 rule 2: the alternatives of a prompt text, normalised, for the three-reader agreement. */
export function headWords(text: string, lang: SameLang): string[] {
  let t = text.normalize('NFC').toLocaleLowerCase(lang).trim();
  while (/\([^()]*\)/.test(t)) t = t.replace(/\([^()]*\)/g, ' ');
  t = t.replace(/\([^)]*$/, ' ').replace(/\)/g, ' '); // an unclosed or stray bracket
  t = t.replace(/(?<=\p{L})-(?=\p{L})/gu, '');
  const out: string[] = [];
  for (const part of t.split(/[,;/]/)) {
    let a = part.replace(/\s+/g, ' ').trim();
    if (lang === 'en') a = a.replace(/^(to|the|a|an) /, '');
    if (a && !out.includes(a)) out.push(a);
  }
  return out;
}

/** True when the two texts share at least one alternative; a text with none is never `same`. */
export function same(a: string, b: string, lang: SameLang): boolean {
  const right = new Set(headWords(b, lang));
  return headWords(a, lang).some((w) => right.has(w));
}

/** True when there is at least one reading and each reading is `same` as the current text. */
export function agree(current: string, readings: readonly string[], lang: SameLang): boolean {
  return readings.length > 0 && readings.every((r) => same(current, r, lang));
}
