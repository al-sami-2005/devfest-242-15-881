import { readFileSync } from 'fs';
import { getPdfPageCount } from './src/core/pdf/pageCount.js';

async function test() {
  const buffer = readFileSync('../problem-pack/sample-pack/documents/01_financial_proposal.pdf');
  const file = new File([buffer], '01_financial_proposal.pdf', { type: 'application/pdf' });
  const count = await getPdfPageCount(file);
  console.log('Pages:', count);
}
test().catch(console.error);
