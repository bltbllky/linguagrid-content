import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { generate, pickSample, type SourceWord } from '../audio.ts';

const root = join(import.meta.dirname, '..', '..');
const USAGE =
  'Usage: npm run generate-audio -- (--sample N | --ids a,b | (nothing: all words)) --out DIR --model PATH.onnx [--bitrate 48000] [--seed 20261114] [--overrides FILE.json]\n' +
  'Needs `piper` (pip install piper-tts) and macOS `afconvert` on PATH. --out audio writes into the repo; anything else stays outside it.';

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args.splice(at, 2)[1] : undefined;
};
const read = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;

try {
  const out = flag('out');
  const model = flag('model');
  if (!out || !model) throw new Error(USAGE);
  const sample = flag('sample');
  const ids = flag('ids')?.split(',').filter(Boolean);
  const bitrate = Number(flag('bitrate') ?? 48000);
  const seed = Number(flag('seed') ?? 20261114);
  const overridesFile = flag('overrides');
  if (!Number.isInteger(bitrate) || !Number.isInteger(seed) || (sample && !Number.isInteger(Number(sample)))) throw new Error(USAGE);

  type Row = { id: string; lemma_nl: string; pos: string; cefr: string };
  const rows = ['words.json', 'words-own.json'].flatMap((f) => (existsSync(join(root, 'data', f)) ? read<Row[]>(join(root, 'data', f)) : []));
  const articles = new Map(read<{ word_id: string; article: 'de' | 'het' | null }[]>(join(root, 'data', 'annotations.json')).map((a) => [a.word_id, a.article]));
  const words: SourceWord[] = rows.map((r) => ({ ...r, article: articles.get(r.id) ?? null }));
  const usable = words.filter((w) => /^[a-z0-9-]+$/.test(w.id));
  if (usable.length < words.length) console.warn(`skipping ${words.length - usable.length} ids outside [a-z0-9-]`);

  const { sizes } = generate(
    {
      words: sample ? pickSample(usable, Number(sample), seed) : usable,
      ids,
      out: resolve(out),
      model: resolve(model),
      bitrate,
      overrides: overridesFile ? read<Record<string, string>>(overridesFile) : {},
    },
    {
      run: (cmd, cmdArgs, input) => {
        const r = spawnSync(cmd, cmdArgs, { input, stdio: ['pipe', 'inherit', 'inherit'] });
        if (r.status !== 0) throw new Error(`${cmd} failed (${r.error?.message ?? `exit ${r.status}`})`);
      },
      readFile: (p) => readFileSync(p),
      writeFile: (p, d) => writeFileSync(p, d),
      mkdirs: (...dirs) => dirs.forEach((d) => mkdirSync(d, { recursive: true })),
      tmpDir: mkdtempSync(join(tmpdir(), 'lg-audio-')),
    },
  );
  console.log(`wrote ${sizes.files} files, ${sizes.totalBytes} bytes to ${out}`);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
