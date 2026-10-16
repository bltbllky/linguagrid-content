import { loadContent, translationReport, validateContent } from '../validate.ts';

const content = loadContent();
const errors = validateContent(content);
for (const e of errors) console.error(`✖ ${e}`);
if (!errors.length) for (const line of translationReport(content)) console.log(line);
console.log(errors.length ? `${errors.length} problem(s)` : '✔ content is valid');
process.exit(errors.length ? 1 : 0);
