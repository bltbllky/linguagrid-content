import { STAGES, loadStage, stageReport, validateStage } from '../stage.ts';
import type { StageName } from '../stage.ts';
import { fileSourceIssues, loadContent, translationReport, validateContent } from '../validate.ts';

const content = loadContent();
const stageName = process.argv.includes('--stage') ? process.argv[process.argv.indexOf('--stage') + 1] : undefined;
if (stageName) {
  const stage = loadStage(stageName);
  const others = (Object.keys(STAGES) as StageName[]).filter((n) => n !== stage.name).map((n) => loadStage(n));
  const { errors, incomplete } = validateStage(content, stage, others);
  for (const e of errors) console.error(`✖ ${e}`);
  if (incomplete.length) {
    const groups = new Map<string, number>();
    for (const m of incomplete) {
      const gap = m.slice(m.indexOf(': ') + 2);
      groups.set(gap, (groups.get(gap) ?? 0) + 1);
    }
    console.log(`… incomplete: ${[...groups].map(([gap, n]) => `${n} ${gap}`).join(', ')}`);
  }
  for (const line of stageReport(content, stage)) console.log(line);
  console.log(errors.length ? `${errors.length} problem(s)` : `✔ ${stage.name.toUpperCase()} stage is valid`);
  process.exit(errors.length ? 1 : 0);
}
const errors = [...fileSourceIssues(), ...validateContent(content)];
for (const e of errors) console.error(`✖ ${e}`);
if (!errors.length) for (const line of translationReport(content)) console.log(line);
console.log(errors.length ? `${errors.length} problem(s)` : '✔ content is valid');
process.exit(errors.length ? 1 : 0);
