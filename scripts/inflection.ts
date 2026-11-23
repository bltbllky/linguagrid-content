export type Inflected = (token: string, prefer?: string) => string | null;

/** Lowercase, split on spaces, strip a final `.` or `?` (and a comma after a word); hyphens and apostrophes stay inside a token. */
export function tokenize(nl: string): string[] {
  return nl
    .normalize('NFC')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((t, i, all) => (i === all.length - 1 ? t.replace(/[.?]$/, '') : t).replace(/,$/, ''));
}

const isVowel = (c: string | undefined) => c !== undefined && 'aeiou'.includes(c);
const swapEnd = (s: string, from: string, to: string) => (s.endsWith(from) ? s.slice(0, -1) + to : null);

/** From the stem of an inflected noun or adjective back to the base: undouble, lengthen, z->s, v->f. */
function baseVariants(stem: string): string[] {
  const out = new Set([stem]);
  if (/([bcdfgklmnprstz])\1$/.test(stem)) out.add(stem.slice(0, -1));
  if (stem.length >= 3 && !isVowel(stem.at(-1)) && isVowel(stem.at(-2)) && !isVowel(stem.at(-3))) {
    out.add(stem.slice(0, -2) + stem.at(-2) + stem.slice(-2));
  }
  for (const v of [...out]) {
    const s = swapEnd(v, 'z', 's');
    const f = swapEnd(v, 'v', 'f');
    if (s) out.add(s);
    if (f) out.add(f);
  }
  return [...out];
}

/** From a verb stem to the infinitive: stem+en, stem+n (doen), shortened vowel (wonen), doubled consonant (stoppen), s->z, f->v. */
function infinitives(stem: string): string[] {
  const roots = new Set([stem]);
  const short = stem.replace(/([aeou])\1([^aeiou])$/, '$1$2');
  if (short !== stem) roots.add(short);
  for (const r of [...roots]) {
    const z = swapEnd(r, 's', 'z');
    const v = swapEnd(r, 'f', 'v');
    if (z) roots.add(z);
    if (v) roots.add(v);
  }
  const out = [...roots].map((r) => r + 'en');
  out.push(stem + 'n');
  if (isVowel(stem.at(-1))) out.push(stem + stem.at(-1) + 'n'); // ga -> gaan
  if (stem.length >= 3 && !isVowel(stem.at(-1)) && isVowel(stem.at(-2)) && !isVowel(stem.at(-3))) out.push(stem + stem.at(-1) + 'en');
  return out;
}

/** Every lemma a surface form could have by the spelling rules; the caller keeps those that are words. */
export function lemmaCandidates(token: string): string[] {
  const out = new Set<string>();
  const nouns = (stem: string) => baseVariants(stem).forEach((b) => out.add(b));
  const verbs = (stem: string) => infinitives(stem).forEach((b) => out.add(b));
  const strip = (suffix: string) => (token.length > suffix.length + 1 && token.endsWith(suffix) ? token.slice(0, -suffix.length) : null);

  for (const [suffix, extra] of [['en', ''], ['eren', ''], ['s', ''], ["'s", ''], ['’s', ''], ['je', ''], ['tje', ''], ['etje', ''], ['pje', ''], ['kje', 'ing'],
    ['e', ''], ['er', ''], ['ere', ''], ['st', ''], ['ste', '']] as const) {
    const s = strip(suffix);
    if (s !== null) nouns(s + extra);
  }
  const heden = strip('heden');
  if (heden !== null) out.add(heden + 'heid');

  // verb: stem, stem+t, stem+te(n), stem+de(n), present participle, participle with or without ge-
  const stems = new Set<string>([token]);
  for (const suffix of ['t', 'te', 'ten', 'de', 'den', 'end', 'ende']) {
    const s = strip(suffix);
    if (s !== null) stems.add(s);
  }
  for (const s of [...stems, token]) {
    for (let at = s.indexOf('ge'); at >= 0; at = s.indexOf('ge', at + 1)) stems.add(s.slice(0, at) + s.slice(at + 2));
  }
  for (const s of [...stems]) {
    if (/[td]$/.test(s) && s.length > 2) stems.add(s.slice(0, -1));
  }
  stems.forEach(verbs);
  for (const s of stems) if (s.endsWith('en')) out.add(s); // strong participle: gelezen -> lezen
  out.delete(token);
  return [...out];
}

/**
 * The inflection check of ADR-026 rule 2(b): `token` must be in the OpenTaal wordlist and the spelling rules
 * (plural -en/-s/-'s/-eren, diminutive -je/-tje/-etje/-pje/-kje, verb stem/-t/-te/-de/ge-...-t/-d/-end, adjective -e/-er/-st,
 * with undoubling, vowel lengthening, z/s and f/v) must lead to a lemma in `lemmas`. Irregular forms (ging, zag, kwam ...) are not matched.
 */
export function makeInflected(openTaal: ReadonlySet<string>, lemmas: ReadonlySet<string>): Inflected {
  return (token, prefer) => {
    if (!openTaal.has(token)) return null;
    const found = lemmaCandidates(token).filter((c) => lemmas.has(c));
    if (prefer !== undefined && found.includes(prefer)) return prefer;
    return found[0] ?? null;
  };
}
