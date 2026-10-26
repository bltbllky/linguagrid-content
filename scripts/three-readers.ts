import { parseCsv } from './import-review.ts';
import { agree, type SameLang } from './same.ts';

export interface ReleaseInput {
  lang: SameLang;
  result: string;
  findings: string;
  deepl: string;
  otherFindings?: string;
  hold?: string[];
}
export interface ReleaseOutput {
  result: string;
  findings: string;
  released: string[];
  held: { id: string; why: string }[];
  counts: { read: number; eligible: number; released: number };
}

export const RELEASED = 'Released: three readers agree (ADR-019).';

const COLUMNS = {
  tr: { field: 'text', current: 'tr_existing', pivot: 'tr_blind', blind: 'tr_blind_nl' },
  en: { field: 'english', current: 'en_existing', pivot: 'en_blind_tr', blind: 'en_blind_nl' },
};

const quote = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
const toCsv = (rows: string[][]) => rows.map((r) => r.map(quote).join(',')).join('\n') + '\n';

function table(text: string): { header: string[]; rows: string[][] } {
  const [header = [], ...rows] = parseCsv(text.replace(/^﻿/, ''));
  return { header, rows: rows.filter((r) => r.length > 1 || (r[0] ?? '') !== '') };
}

/**
 * ADR-019 rules 1 and 3: an `owner` row whose only finding is an `unsure` text finding, with both
 * classes `match`, is released (`OK`) when the current text, both blind readings and the DeepL reading agree.
 */
export function releaseRows(input: ReleaseInput): ReleaseOutput {
  const { lang } = input;
  const col = COLUMNS[lang];
  const res = table(input.result);
  const need = ['id', 'verdict', 'class', 'class_nl', col.current, col.pivot, col.blind];
  if (lang === 'tr') need.push('article_check');
  if (need.some((c) => !res.header.includes(c))) {
    throw new Error(`Not a round-trip sheet; expected columns ${need.join(', ')}`);
  }
  const at = (c: string) => res.header.indexOf(c);
  const fin = table(input.findings);
  for (const c of ['id', 'field', 'suggestion', 'reason', 'severity']) {
    if (!fin.header.includes(c)) throw new Error('Not a findings file; expected columns id, field, suggestion, reason, severity');
  }
  const f = (c: string) => fin.header.indexOf(c);

  const byId = new Map<string, string[][]>();
  for (const r of fin.rows) byId.set(r[f('id')], [...(byId.get(r[f('id')]) ?? []), r]);
  const otherTable = table(input.otherFindings ?? '');
  const other = new Set(otherTable.rows.map((r) => r[otherTable.header.indexOf('id')]));
  const hold = new Set(input.hold ?? []);

  const dl = table(input.deepl);
  const readings = new Map<string, string>();
  for (const r of dl.rows) if (r[dl.header.indexOf('lang')] === lang) readings.set(r[dl.header.indexOf('id')], r[dl.header.indexOf('mt')] ?? '');

  let dCol = at('deepl');
  let sCol = at('deepl_same');
  const header = [...res.header];
  if (dCol < 0) header.push('deepl'), (dCol = header.length - 1);
  if (sCol < 0) header.push('deepl_same'), (sCol = header.length - 1);

  const released: string[] = [];
  const held: { id: string; why: string }[] = [];
  const counts = { read: 0, eligible: 0, released: 0 };
  const rows = res.rows.map((row) => {
    const r = Array.from({ length: header.length }, (_, i) => row[i] ?? '');
    const id = r[at('id')];
    const verdict = r[at('verdict')].trim();
    const wasReleased = verdict === 'OK' && r[sCol] === 'yes';
    if (verdict !== 'owner' && !wasReleased) return r;
    const reading = readings.get(id) ?? '';
    r[dCol] = reading;
    r[sCol] = '';
    if (reading) counts.read++;

    const why = ineligible(id, byId.get(id) ?? [], r);
    if (why) {
      if (wasReleased) r[at('verdict')] = 'owner';
      held.push({ id, why });
      return r;
    }
    counts.eligible++;
    if (!reading) {
      if (wasReleased) r[at('verdict')] = 'owner';
      held.push({ id, why: 'no-reading' });
      return r;
    }
    const ok = agree(r[at(col.current)], [r[at(col.pivot)], r[at(col.blind)], reading], lang);
    r[sCol] = ok ? 'yes' : 'no';
    if (ok) {
      r[at('verdict')] = 'OK';
      released.push(id);
      counts.released++;
    } else {
      if (wasReleased) r[at('verdict')] = 'owner';
      held.push({ id, why: 'differ' });
    }
    return r;
  });

  function ineligible(id: string, found: string[][], r: string[]): string | undefined {
    const [one] = found;
    if (found.length !== 1 || one[f('field')].trim() !== col.field) return 'not-text';
    if (one[f('severity')].trim() !== 'unsure') return 'severity';
    if (/^remove/i.test(one[f('suggestion')].trim())) return 'removal';
    if (r[at('class')].trim() !== 'match' || r[at('class_nl')].trim() !== 'match') return 'class';
    if (lang === 'tr' && id.startsWith('noun-') && r[at('article_check')].trim() !== 'match') return 'article';
    if (hold.has(id)) return 'hold';
    if (other.has(id)) return 'shared';
    return undefined;
  }

  const done = new Set(released);
  const findings = fin.rows.map((r) => {
    const out = [...r];
    const reason = out[f('reason')].split(RELEASED).join('').replace(/\s+$/, '').replace(/^\s+/, '');
    out[f('reason')] = done.has(r[f('id')]) ? (reason ? `${reason} ${RELEASED}` : RELEASED) : reason;
    return out;
  });

  return { result: toCsv([header, ...rows]), findings: toCsv([fin.header, ...findings]), released, held, counts };
}
