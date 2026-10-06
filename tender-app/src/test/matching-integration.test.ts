import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseRequirementsJson } from '../core/validation/parser';
import { getDerivedChecklist, getPackageReadiness } from '../core/matching/selectors';
import { assignFile, MatchingState, setExpiryDate } from '../core/matching/engine';
import { UploadedDocument } from '../core/types';

describe('Sample Pack Verification', () => {
  let tenderData: any;
  const deadline = '2026-10-20';

  beforeAll(() => {
    const jsonPath = resolve(__dirname, '../../../problem-pack/sample-pack/requirements.json');
    const jsonStr = readFileSync(jsonPath, 'utf-8');
    const parsed = parseRequirementsJson(jsonStr);
    if (parsed.error) {
      throw new Error(`Parse failed: ${parsed.error}`);
    }
    tenderData = parsed.data;
  });

  it('verifies exact statuses according to sample requirements', () => {
    // R1: Trade License (mandatory, has_expiry)
    // R4: Bank Solvency (mandatory, has_expiry)
    // R6: Audited Financial Statement (optional, no expiry)
    // R8: Technical Proposal (mandatory, no expiry)
    
    // We mock the documents since we already tested file upload logic
    const allDocuments: UploadedDocument[] = [
      { id: 'doc_old_trade', contentHash: 'h1', status: 'success' } as UploadedDocument,
      { id: 'doc_new_trade', contentHash: 'h2', status: 'success' } as UploadedDocument,
      { id: 'doc_bank', contentHash: 'h3', status: 'success' } as UploadedDocument,
      { id: 'doc_tech', contentHash: 'h4', status: 'success' } as UploadedDocument,
      { id: 'doc_tech_dup', contentHash: 'h4', status: 'success' } as UploadedDocument, // exactly duplicate content
    ];

    let state: MatchingState = { assignments: {} };
    const validReqs = tenderData.requirements.map((r: any) => r.id);

    // 1. Unmatched mandatory requirement -> MISSING
    // Before assigning anything, R01 is missing
    let checklist = getDerivedChecklist(tenderData, state, allDocuments, 'en');
    let r1 = checklist.find(c => c.requirement.id === 'R01')!;
    expect(r1.status).toBe('missing');

    // 2. Unmatched optional requirement -> NOT_PROVIDED
    let r6 = checklist.find(c => c.requirement.id === 'R06')!;
    expect(r6.status).toBe('not-provided');

    // 3. Old Trade License + expiry -> EXPIRED
    state = assignFile(state, 'R01', 'doc_old_trade', allDocuments, validReqs).state;
    state = setExpiryDate(state, 'R01', '2026-10-19'); // Before deadline
    checklist = getDerivedChecklist(tenderData, state, allDocuments, 'en');
    r1 = checklist.find(c => c.requirement.id === 'R01')!;
    expect(r1.status).toBe('expired');
    
    // 4. Newer Trade License + expiry -> OK
    // Replace assignment
    state = assignFile(state, 'R01', 'doc_new_trade', allDocuments, validReqs).state;
    // Expiry should have been cleared
    checklist = getDerivedChecklist(tenderData, state, allDocuments, 'en');
    r1 = checklist.find(c => c.requirement.id === 'R01')!;
    expect(r1.status).toBe('expiry-date-needed');
    
    // Set valid expiry
    state = setExpiryDate(state, 'R01', '2026-10-21');
    checklist = getDerivedChecklist(tenderData, state, allDocuments, 'en');
    r1 = checklist.find(c => c.requirement.id === 'R01')!;
    expect(r1.status).toBe('ok');

    // 5. Bank Solvency with valid expiry -> OK
    state = assignFile(state, 'R04', 'doc_bank', allDocuments, validReqs).state;
    state = setExpiryDate(state, 'R04', '2026-10-20'); // Exact deadline is valid
    checklist = getDerivedChecklist(tenderData, state, allDocuments, 'en');
    let r4 = checklist.find(c => c.requirement.id === 'R04')!;
    expect(r4.status).toBe('ok');

    // 6. Matching expiry-required file without entering expiry -> EXPIRY_DATE_NEEDED
    // Already checked above when replacing Trade License

    // 7. Duplicate copies cannot be used for different requirements
    state = assignFile(state, 'R08', 'doc_tech', allDocuments, validReqs).state; // Technical proposal
    const result = assignFile(state, 'R09', 'doc_tech_dup', allDocuments, validReqs); // Financial proposal attempting to use duplicate
    expect(result.conflict?.type).toBe('DUPLICATE_CONTENT_ASSIGNED');

    // 8. Technical Proposal should not suddenly require expiry (follow requirements.json)
    // R08 has has_expiry = false
    checklist = getDerivedChecklist(tenderData, state, allDocuments, 'en');
    let r8 = checklist.find(c => c.requirement.id === 'R08')!;
    expect(r8.status).toBe('ok'); // It matched, and doesn't need expiry
  });
});
