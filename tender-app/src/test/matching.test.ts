import { describe, it, expect } from 'vitest';
import { assignFile, unassignFile, setExpiryDate, MatchingState } from '../core/matching/engine';
import { getRequirementStatus, getDerivedChecklist, getPackageReadiness } from '../core/matching/selectors';
import { Requirement, UploadedDocument, TenderData } from '../core/types';

describe('Matching Engine', () => {
  const allDocuments: UploadedDocument[] = [
    { id: 'doc1', contentHash: 'hash1', status: 'success' } as UploadedDocument,
    { id: 'doc2', contentHash: 'hash2', status: 'success' } as UploadedDocument,
    { id: 'doc3', contentHash: 'hash1', status: 'success' } as UploadedDocument, // duplicate of doc1
  ];
  
  const reqIds = ['R1', 'R2', 'R3'];

  it('assigns file cleanly', () => {
    let state: MatchingState = { assignments: {} };
    const result = assignFile(state, 'R1', 'doc1', allDocuments, reqIds);
    expect(result.conflict).toBeNull();
    expect(result.state.assignments['R1'].documentId).toBe('doc1');
  });

  it('prevents duplicate assignment of same file', () => {
    let state: MatchingState = { assignments: { R1: { requirementId: 'R1', documentId: 'doc1', expiryDate: null } } };
    const result = assignFile(state, 'R2', 'doc1', allDocuments, reqIds);
    expect(result.conflict?.type).toBe('FILE_ALREADY_ASSIGNED');
  });

  it('prevents assignment of duplicate content', () => {
    let state: MatchingState = { assignments: { R1: { requirementId: 'R1', documentId: 'doc1', expiryDate: null } } };
    const result = assignFile(state, 'R2', 'doc3', allDocuments, reqIds);
    expect(result.conflict?.type).toBe('DUPLICATE_CONTENT_ASSIGNED');
  });

  it('clears expiry date when file is replaced', () => {
    let state: MatchingState = { assignments: { R1: { requirementId: 'R1', documentId: 'doc1', expiryDate: '2026-01-01' } } };
    const result = assignFile(state, 'R1', 'doc2', allDocuments, reqIds);
    expect(result.conflict).toBeNull();
    expect(result.state.assignments['R1'].expiryDate).toBeNull(); // should be cleared
  });

  it('keeps expiry date if re-assigning same file', () => {
    let state: MatchingState = { assignments: { R1: { requirementId: 'R1', documentId: 'doc1', expiryDate: '2026-01-01' } } };
    const result = assignFile(state, 'R1', 'doc1', allDocuments, reqIds);
    expect(result.state.assignments['R1'].expiryDate).toBe('2026-01-01');
  });

  it('unassign clears file and expiry', () => {
    let state: MatchingState = { assignments: { R1: { requirementId: 'R1', documentId: 'doc1', expiryDate: '2026-01-01' } } };
    const newState = unassignFile(state, 'R1');
    expect(newState.assignments['R1'].documentId).toBeNull();
    expect(newState.assignments['R1'].expiryDate).toBeNull();
  });
});

describe('Status Engine', () => {
  const deadline = '2026-10-20';
  
  it('mandatory + unmatched -> MISSING (blocking)', () => {
    const req: Requirement = { id: 'R1', order: 1, title_en: '', title_bn: '', mandatory: true, has_expiry: false };
    const { status, isBlocking } = getRequirementStatus(req, undefined, deadline);
    expect(status).toBe('missing');
    expect(isBlocking).toBe(true);
  });

  it('optional + unmatched -> NOT_PROVIDED (not blocking)', () => {
    const req: Requirement = { id: 'R1', order: 1, title_en: '', title_bn: '', mandatory: false, has_expiry: false };
    const { status, isBlocking } = getRequirementStatus(req, undefined, deadline);
    expect(status).toBe('not-provided');
    expect(isBlocking).toBe(false);
  });

  it('matched + no expiry required -> OK', () => {
    const req: Requirement = { id: 'R1', order: 1, title_en: '', title_bn: '', mandatory: true, has_expiry: false };
    const { status, isBlocking } = getRequirementStatus(req, { requirementId: 'R1', documentId: 'doc1', expiryDate: null }, deadline);
    expect(status).toBe('ok');
    expect(isBlocking).toBe(false);
  });

  it('matched + expiry required + empty -> EXPIRY_DATE_NEEDED (blocking)', () => {
    const req: Requirement = { id: 'R1', order: 1, title_en: '', title_bn: '', mandatory: true, has_expiry: true };
    const { status, isBlocking } = getRequirementStatus(req, { requirementId: 'R1', documentId: 'doc1', expiryDate: null }, deadline);
    expect(status).toBe('expiry-date-needed');
    expect(isBlocking).toBe(true);
  });

  it('matched + expiry earlier than deadline -> EXPIRED (blocking)', () => {
    const req: Requirement = { id: 'R1', order: 1, title_en: '', title_bn: '', mandatory: true, has_expiry: true };
    const { status, isBlocking } = getRequirementStatus(req, { requirementId: 'R1', documentId: 'doc1', expiryDate: '2026-10-19' }, deadline);
    expect(status).toBe('expired');
    expect(isBlocking).toBe(true);
  });

  it('matched + expiry equal to deadline -> OK', () => {
    const req: Requirement = { id: 'R1', order: 1, title_en: '', title_bn: '', mandatory: true, has_expiry: true };
    const { status, isBlocking } = getRequirementStatus(req, { requirementId: 'R1', documentId: 'doc1', expiryDate: '2026-10-20' }, deadline);
    expect(status).toBe('ok');
    expect(isBlocking).toBe(false);
  });

  it('matched + expiry after deadline -> OK', () => {
    const req: Requirement = { id: 'R1', order: 1, title_en: '', title_bn: '', mandatory: true, has_expiry: true };
    const { status, isBlocking } = getRequirementStatus(req, { requirementId: 'R1', documentId: 'doc1', expiryDate: '2026-10-21' }, deadline);
    expect(status).toBe('ok');
    expect(isBlocking).toBe(false);
  });
});

describe('Checklist and Readiness', () => {
  it('correctly maps readiness and blocking reasons', () => {
    const tenderData: TenderData = {
      tender: { tender_id: 'T1', title: 'Test', procuring_entity: 'E', bidder: 'B', submission_deadline: '2026-10-20' },
      requirements: [
        { id: 'R1', order: 1, title_en: 'Mandatory Missing', title_bn: '', mandatory: true, has_expiry: false },
        { id: 'R2', order: 2, title_en: 'Optional', title_bn: '', mandatory: false, has_expiry: false },
      ]
    };

    const state: MatchingState = { assignments: {} };
    const allDocs: UploadedDocument[] = [];

    const checklist = getDerivedChecklist(tenderData, state, allDocs, 'en');
    const readiness = getPackageReadiness(checklist);

    expect(readiness.canGenerate).toBe(false);
    expect(readiness.blockingReasons).toHaveLength(1);
    expect(readiness.blockingReasons[0].requirementId).toBe('R1');
  });
});
