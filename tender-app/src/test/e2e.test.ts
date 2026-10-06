import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseRequirementsJson } from '../core/validation/parser';
import { processUploadedFiles, removeDocument } from '../core/files/engine';
import { assignFile, unassignFile, setExpiryDate, MatchingState } from '../core/matching/engine';
import { getDerivedChecklist, getPackageReadiness } from '../core/matching/selectors';
import { generateTenderPackage } from '../core/pdf/generator';

describe('End-to-End Workflow', () => {
  let jsonStr: string;
  const loadSampleFile = (filename: string, mimeType: string): File => {
    const path = resolve(__dirname, '../../../problem-pack/sample-pack/documents', filename);
    const buffer = readFileSync(path);
    return new File([buffer], filename, { type: mimeType });
  };

  beforeAll(() => {
    const jsonPath = resolve(__dirname, '../../../problem-pack/sample-pack/requirements.json');
    jsonStr = readFileSync(jsonPath, 'utf-8');
  });

  it('completes the full successful workflow', async () => {
    // 1. Load Requirements
    const parsed = parseRequirementsJson(jsonStr);
    expect(parsed.error).toBeNull();
    const tenderData = parsed.data!;
    
    // 2. Upload Documents
    const files = [
      loadSampleFile('trade_license_2026.pdf', 'application/pdf'),
      loadSampleFile('03_tin_certificate.pdf', 'application/pdf'),
      loadSampleFile('04_vat_certificate.pdf', 'application/pdf'),
      loadSampleFile('bank_solvency.pdf', 'application/pdf'),
      loadSampleFile('experience_cert.pdf', 'application/pdf'),
      loadSampleFile('02_technical_proposal.pdf', 'application/pdf'),
      loadSampleFile('01_financial_proposal.pdf', 'application/pdf'),
      loadSampleFile('scan_0042.pdf', 'application/pdf'),
      loadSampleFile('experience_cert (1).pdf', 'application/pdf') // Real sample-pack duplicate
    ];
    let { documents, batchError } = await processUploadedFiles(files, []);
    expect(batchError).toBeNull();
    expect(documents.length).toBe(9);
    
    // 3. Detect duplicate
    const dups = documents.filter(d => d.isDuplicate);
    expect(dups.length).toBe(2);

    let state: MatchingState = { assignments: {} };
    const validReqs = tenderData.requirements.map(r => r.id);

    // 4. Assign documents
    state = assignFile(state, 'R01', documents[0].id, documents, validReqs).state;
    state = assignFile(state, 'R02', documents[1].id, documents, validReqs).state;
    state = assignFile(state, 'R03', documents[2].id, documents, validReqs).state;
    state = assignFile(state, 'R04', documents[3].id, documents, validReqs).state;
    state = assignFile(state, 'R05', documents[4].id, documents, validReqs).state;
    state = assignFile(state, 'R08', documents[5].id, documents, validReqs).state;
    state = assignFile(state, 'R09', documents[6].id, documents, validReqs).state;
    state = assignFile(state, 'R10', documents[7].id, documents, validReqs).state;

    // 5. Calculate statuses
    let checklist = getDerivedChecklist(tenderData, state, documents, 'en');
    let readiness = getPackageReadiness(checklist);
    expect(readiness.canGenerate).toBe(false); // Expiry dates needed
    
    // 6. Resolve blockers (Enter expiry)
    state = setExpiryDate(state, 'R01', '2027-01-01');
    state = setExpiryDate(state, 'R04', '2027-01-01');
    
    checklist = getDerivedChecklist(tenderData, state, documents, 'en');
    readiness = getPackageReadiness(checklist);
    expect(readiness.canGenerate).toBe(true);

    // 7. Generate package
    const result = await generateTenderPackage(tenderData, checklist);
    expect(result.error).toBeNull();
    expect(result.pdfBytes).toBeInstanceOf(Uint8Array);
  });

  it('rejects generation if an assigned document expires before deadline', async () => {
    const tenderData = parseRequirementsJson(jsonStr).data!;
    const files = [loadSampleFile('trade_license_2026.pdf', 'application/pdf')];
    const resultDocs = await processUploadedFiles(files, []);
    const documents = resultDocs.documents;
    
    let state: MatchingState = { assignments: {} };
    state = assignFile(state, 'R01', documents[0].id, documents, tenderData.requirements.map(r => r.id)).state;
    
    // Set expired date (deadline is 2026-10-20)
    state = setExpiryDate(state, 'R01', '2026-10-19');
    
    const checklist = getDerivedChecklist(tenderData, state, documents, 'en');
    const readiness = getPackageReadiness(checklist);
    
    expect(readiness.canGenerate).toBe(false);
    expect(readiness.blockingReasons.some(r => r.status === 'expired')).toBe(true);
    
    const result = await generateTenderPackage(tenderData, checklist);
    expect(result.pdfBytes).toBeNull();
    expect(result.error).toContain('blocking');
  });
});
