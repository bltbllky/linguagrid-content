import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const PUBLISHED = ['index.html', 'manifest.json', 'release', 'data', 'privacy', 'support', 'LICENSE-DATA.md'];

/** Copies everything served on GitHub Pages into `outDir`. */
export function buildSite(root = ROOT, outDir = join(root, 'public')): string[] {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const copied = PUBLISHED.filter((entry) => existsSync(join(root, entry)));
  for (const entry of copied) cpSync(join(root, entry), join(outDir, entry), { recursive: true });
  return copied;
}
