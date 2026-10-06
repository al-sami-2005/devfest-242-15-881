import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { processUploadedFiles } from '../core/files/engine';
// Let's use the real files from the hackathon sample pack!
const loadSampleFile = (filename: string, mimeType: string): File => {
  const path = resolve(__dirname, '../../../problem-pack/sample-pack/documents', filename);
  const buffer = readFileSync(path);
  return new File([buffer], filename, { type: mimeType });
};

describe('engine integration with sample files', () => {
  it('detects PNG as non-PDF', async () => {
    const png = loadSampleFile('company_logo.png', 'image/png');
    const { documents, batchError } = await processUploadedFiles([png], []);
    
    expect(batchError).toBeNull();
    expect(documents).toHaveLength(1);
    expect(documents[0].status).toBe('error');
    expect(documents[0].error?.code).toBe('NOT_PDF');
  });

  it('identifies exact duplicates successfully', async () => {
    const exp1 = loadSampleFile('experience_cert.pdf', 'application/pdf');
    const exp2 = loadSampleFile('experience_cert (1).pdf', 'application/pdf');

    const { documents } = await processUploadedFiles([exp1, exp2], []);

    expect(documents).toHaveLength(2);
    expect(documents[0].status).toBe('success');
    expect(documents[1].status).toBe('success');
    
    // They should have the same hash
    expect(documents[0].contentHash).toBe(documents[1].contentHash);
    
    // They should both be marked as duplicate
    expect(documents[0].isDuplicate).toBe(true);
    expect(documents[1].isDuplicate).toBe(true);
    
    // They should belong to the same duplicate group
    expect(documents[0].duplicateGroup).toBe(documents[1].duplicateGroup);
    
    // Page count validation (experience cert actually has 2 pages)
    expect(documents[0].pageCount).toBe(2);
  }, 10000); // Give it extra time for PDF parsing

  it('rejects tampered file failing pdf signature but ending with .pdf', async () => {
    // We mock a PDF file that actually contains text content not starting with %PDF-
    const fakePdf = new File(['just some text data'], 'fake.pdf', { type: 'application/pdf' });
    const { documents } = await processUploadedFiles([fakePdf], []);

    expect(documents).toHaveLength(1);
    expect(documents[0].status).toBe('error');
    expect(documents[0].error?.code).toBe('NOT_PDF');
    expect(documents[0].error?.message).toContain('signature');
  });
});
