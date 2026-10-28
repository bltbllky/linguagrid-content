import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { carryOver, overlapRows } from '../core.ts';
import { loadContent } from '../validate.ts';
import type { Word } from '../validate.ts';

const root = join(import.meta.dirname, '..', '..');
const read = <T>(file: string): T => JSON.parse(readFileSync(join(root, file), 'utf8'));
const json = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
const write = (file: string, text: string) => {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
};

function overlap() {
  const launch = read<Word[]>('data/words.json').filter((w) => w.source === 'nt2lex');
  const rows = overlapRows(launch, read<Word[]>('data/core/words.json'));
  const header = 'id,dutch,pos,launch_level,core_level,class';
  write('review/core/overlap.csv', [header, ...rows.map((r) => [r.id, r.dutch, r.pos, r.launch_level, r.core_level, r.class].join(','))].join('\n') + '\n');
  const count = (cls: string, level?: string) => rows.filter((r) => r.class === cls && (!level || r.core_level === level)).length;
  console.log(
    `kept ${count('kept')} (A1 ${count('kept', 'A1')}, A2 ${count('kept', 'A2')}), level-move ${count('level-move')}, new ${count('new')}, retired ${count('retired')}`,
  );
  console.log(`Wrote review/core/overlap.csv (${rows.length} rows)`);
}

function carry() {
  const core = read<Word[]>('data/core/words.json');
  const { annotations, translations } = carryOver(loadContent(), core);
  const files = [['data/core/annotations.json', annotations] as const, ...Object.entries(translations).map(([lang, words]) => [`data/core/translations/${lang}.json`, { lang, words, categories: [] }] as const)];
  for (const [file] of files) {
    if (existsSync(join(root, file))) {
      console.error(`✖ ${file} exists; carry runs once`);
      process.exit(1);
    }
  }
  for (const [file, value] of files) write(file, json(value));
  console.log(`Carried ${annotations.length} annotations into data/core/ (${Object.keys(translations).join(', ')})`);
}

const modes = { '--overlap': overlap, '--carry': carry };
const mode = process.argv[2] as keyof typeof modes;
if (process.argv.length !== 3 || !(mode in modes)) {
  console.error('Usage: npm run core -- --overlap | --carry');
  process.exit(1);
}
modes[mode]();
