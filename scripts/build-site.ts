import { cpSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const PUBLISHED = ['index.html', 'manifest.json', 'release', 'data', 'privacy', 'support', 'LICENSE-DATA.md'];

/** Audio allow-list: the two indexes, the licence notice (ADR-009) and the m4a files; not overrides.json or README.md. */
function isPublishedAudio(audioRoot: string, path: string): boolean {
  if (statSync(path).isDirectory()) return true;
  const parts = relative(audioRoot, path).split(sep);
  if (parts.length === 1) return parts[0] === 'index.json' || parts[0] === 'AUDIO-LICENCE.md';
  return parts.length === 2 && (parts[1] === 'index.json' || parts[1].endsWith('.m4a'));
}

/** Copies everything served on GitHub Pages into `outDir`. */
export function buildSite(root = ROOT, outDir = join(root, 'public')): string[] {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const copied = PUBLISHED.filter((entry) => existsSync(join(root, entry)));
  for (const entry of copied) cpSync(join(root, entry), join(outDir, entry), { recursive: true });
  const audio = join(root, 'audio');
  if (existsSync(audio)) {
    cpSync(audio, join(outDir, 'audio'), { recursive: true, filter: (src) => isPublishedAudio(audio, src) });
    copied.push('audio');
  }
  return copied;
}
