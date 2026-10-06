import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseRequirementsJson } from '../core/validation/parser';
import { getDerivedChecklist, getPackageReadiness } from '../core/matching/selectors';
import { assignFile, MatchingState, setExpiryDate } from '../core/matching/engine';
import { UploadedDocument } from '../core/types';
import { generateTenderPackage, getPackageFilename } from '../core/pdf/generator';
import { PDFDocument } from 'pdf-lib';

describe('PDF Package Generation Engine', () => {
  let tenderData: any;
  let allDocuments: UploadedDocument[] = [];
  const loadSampleFile = (filename: string, mimeType: string): File => {
    const path = resolve(__dirname, '../../../problem-pack/sample-pack/documents', filename);
    const buffer = readFileSync(path);
    return new File([buffer], filename, { type: mimeType });
  };

  beforeAll(() => {
    const jsonPath = resolve(__dirname, '../../../problem-pack/sample-pack/requirements.json');
    const jsonStr = readFileSync(jsonPath, 'utf-8');
    tenderData = parseRequirementsJson(jsonStr).data;

    // Load actual PDFs
    const tradeLicense = loadSampleFile('trade_license_2026.pdf', 'application/pdf');
    const tinCert = loadSampleFile('03_tin_certificate.pdf', 'application/pdf');
    const vatCert = loadSampleFile('04_vat_certificate.pdf', 'application/pdf');
    const bankSolvency = loadSampleFile('bank_solvency.pdf', 'application/pdf');
    const experienceCert = loadSampleFile('experience_cert.pdf', 'application/pdf');
    const techProposal = loadSampleFile('02_technical_proposal.pdf', 'application/pdf');
    const finProposal = loadSampleFile('01_financial_proposal.pdf', 'application/pdf');
    const signedDecl = loadSampleFile('scan_0042.pdf', 'application/pdf');

    allDocuments = [
      { id: 'd1', file: tradeLicense, filename: 'trade_license_2026.pdf', status: 'success', contentHash: 'h1' },
      { id: 'd2', file: tinCert, filename: '03_tin_certificate.pdf', status: 'success', contentHash: 'h2' },
      { id: 'd3', file: vatCert, filename: '04_vat_certificate.pdf', status: 'success', contentHash: 'h3' },
      { id: 'd4', file: bankSolvency, filename: 'bank_solvency.pdf', status: 'success', contentHash: 'h4' },
      { id: 'd5', file: experienceCert, filename: 'experience_cert.pdf', status: 'success', contentHash: 'h5' },
      { id: 'd6', file: techProposal, filename: '02_technical_proposal.pdf', status: 'success', contentHash: 'h6' },
      { id: 'd7', file: finProposal, filename: '01_financial_proposal.pdf', status: 'success', contentHash: 'h7' },
      { id: 'd8', file: signedDecl, filename: 'scan_0042.pdf', status: 'success', contentHash: 'h8' }
    ] as UploadedDocument[];
  });

  it('refuses to generate if blocking statuses exist', async () => {
    const state: MatchingState = { assignments: {} }; // Everything missing
    const checklist = getDerivedChecklist(tenderData, state, allDocuments, 'en');
    
    const result = await generateTenderPackage(tenderData, checklist);
    
    expect(result.pdfBytes).toBeNull();
    expect(result.error).toContain('blocking');
  });

  it('generates the correctly ordered package with the exact page count', async () => {
    let state: MatchingState = { assignments: {} };
    const validReqs = tenderData.requirements.map((r: any) => r.id);

    // Map according to requirements.json order
    // R01: Trade License (needs expiry)
    // R02: TIN
    // R03: VAT
    // R04: Bank Solvency (needs expiry)
    // R05: Experience
    // R06: Audited Financial (optional, skip)
    // R07: Manufacturer Auth (optional, skip)
    // R08: Tech Proposal
    // R09: Fin Proposal
    // R10: Signed Declaration
    state = assignFile(state, 'R01', 'd1', allDocuments, validReqs).state;
    state = setExpiryDate(state, 'R01', '2027-01-01'); // valid
    
    state = assignFile(state, 'R02', 'd2', allDocuments, validReqs).state;
    state = assignFile(state, 'R03', 'd3', allDocuments, validReqs).state;
    
    state = assignFile(state, 'R04', 'd4', allDocuments, validReqs).state;
    state = setExpiryDate(state, 'R04', '2027-01-01'); // valid
    
    state = assignFile(state, 'R05', 'd5', allDocuments, validReqs).state;
    state = assignFile(state, 'R08', 'd6', allDocuments, validReqs).state;
    state = assignFile(state, 'R09', 'd7', allDocuments, validReqs).state;
    state = assignFile(state, 'R10', 'd8', allDocuments, validReqs).state;

    const checklist = getDerivedChecklist(tenderData, state, allDocuments, 'en');
    const readiness = getPackageReadiness(checklist);
    if (!readiness.canGenerate) console.log('BLOCKING REASONS:', readiness.blockingReasons);
    const result = await generateTenderPackage(tenderData, checklist);
    
    if (result.error) console.log('ERROR:', result.error);
    expect(result.error).toBeNull();
    expect(result.pdfBytes).toBeInstanceOf(Uint8Array);
    
    // Parse the generated PDF to verify pages
    const generatedPdf = await PDFDocument.load(result.pdfBytes!);
    const totalPages = generatedPdf.getPageCount();
    
    // Expected: 1 cover page + 15 sample document pages = 16 pages
    expect(totalPages).toBe(16);

    // Filename check
    expect(result.filename).toBe('T-2026-0417_Package.pdf');
  });

  it('fails gracefully when a source file is corrupted/unreadable', async () => {
    // Create a bad file
    const badFile = new File(['bad data'], 'bad.pdf', { type: 'application/pdf' });
    const badDoc = { id: 'd_bad', file: badFile, filename: 'bad.pdf', status: 'success', contentHash: 'h_bad' } as UploadedDocument;
    
    const docs = [...allDocuments, badDoc];
    let state: MatchingState = { assignments: {} };
    const validReqs = tenderData.requirements.map((r: any) => r.id);

    // Same good state as above
    state = assignFile(state, 'R01', 'd1', docs, validReqs).state;
    state = setExpiryDate(state, 'R01', '2027-01-01');
    state = assignFile(state, 'R02', 'd2', docs, validReqs).state;
    state = assignFile(state, 'R03', 'd3', docs, validReqs).state;
    state = assignFile(state, 'R04', 'd4', docs, validReqs).state;
    state = setExpiryDate(state, 'R04', '2027-01-01');
    state = assignFile(state, 'R05', 'd5', docs, validReqs).state;
    state = assignFile(state, 'R08', 'd6', docs, validReqs).state;
    state = assignFile(state, 'R09', 'd7', docs, validReqs).state;
    
    // But assign the bad file to R10
    state = assignFile(state, 'R10', 'd_bad', docs, validReqs).state;

    const checklist = getDerivedChecklist(tenderData, state, docs, 'en');
    const result = await generateTenderPackage(tenderData, checklist);
    
    expect(result.pdfBytes).toBeNull();
    expect(result.error).toContain('Cannot load or parse file: bad.pdf');
  });
});
