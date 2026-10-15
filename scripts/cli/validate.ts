import { loadContent, validateContent } from '../validate.ts';

const errors = validateContent(loadContent());
for (const e of errors) console.error(`✖ ${e}`);
console.log(errors.length ? `${errors.length} problem(s)` : '✔ content is valid');
process.exit(errors.length ? 1 : 0);
