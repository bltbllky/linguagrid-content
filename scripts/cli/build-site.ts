import { buildSite } from '../build-site.ts';

console.log(`Published: ${buildSite().join(', ')}`);
