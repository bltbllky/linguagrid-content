import type { Content } from './validate.ts';

export interface ReviewResult {
  content: Content;
  excluded: { id: string; reason: string }[];
  summary: { ok: number; corrected: number; removed: number; pending: number };
}

/** Minimal RFC 4180 CSV parser (quoted fields, doubled quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') row.push(field), (field = '');
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field), rows.push(row), (row = []), (field = '');
    } else field += ch;
  }
  if (field || row.length) row.push(field), rows.push(row);
  return rows;
}

/**
 * Applies the owner's review sheet. Decision values: `OK`, `REMOVE`, or corrections separated by
 * ";" — `de` / `het` fixes the article, any other text replaces the Turkish translation.
 */
export function applyReview(content: Content, csv: string): ReviewResult {
  const [header, ...rows] = parseCsv(csv);
  const idCol = header.indexOf('id');
  const decisionCol = header.indexOf('decision');
  const notes = new Map(content.annotations.map((a) => [a.word_id, { ...a }]));
  const removed = new Set<string>();
  const summary = { ok: 0, corrected: 0, removed: 0, pending: 0 };

  for (const row of rows) {
    const id = row[idCol];
    const decision = (row[decisionCol] ?? '').trim();
    const note = notes.get(id);
    if (!note) throw new Error(`Unknown word id in review: ${id}`);
    if (!decision) summary.pending++;
    else if (decision.toUpperCase() === 'OK') (note.reviewed = true), summary.ok++;
    else if (decision.toUpperCase() === 'REMOVE') removed.add(id), summary.removed++;
    else {
      for (const part of decision.split(';').map((p) => p.trim())) {
        if (part === 'de' || part === 'het') note.article = part;
        else if (part) note.text_tr = part;
      }
      note.reviewed = true;
      summary.corrected++;
    }
  }
  return {
    content: {
      ...content,
      words: content.words.filter((w) => !removed.has(w.id)),
      annotations: [...notes.values()].filter((a) => !removed.has(a.word_id)),
    },
    excluded: [...removed].map((id) => ({ id, reason: 'removed in review' })),
    summary,
  };
}
