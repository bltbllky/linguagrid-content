// One-off (T-029): moves the Turkish texts and titles into data/translations/tr.json, checked before writing.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { checkMigration, migrateTranslations } from '../migrate-translations.ts';

const root = join(import.meta.dirname, '..', '..');
const read = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const before = { annotations: read('data/annotations.json'), categories: read('data/categories.json') };
const migrated = migrateTranslations(before.annotations, before.categories);
const problems = checkMigration(before, migrated);
if (problems.length) throw new Error(`Migration check failed:\n${problems.join('\n')}`);
mkdirSync(join(root, 'data', 'translations'), { recursive: true });
writeFileSync(join(root, 'data/translations/tr.json'), JSON.stringify(migrated.tr, null, 2) + '\n');
// annotations.json / categories.json keep their deprecated text_tr / title_tr copies until T-034.
console.log(`Moved ${migrated.tr.words.length} Turkish texts and ${migrated.tr.categories.length} titles; check passed.`);
