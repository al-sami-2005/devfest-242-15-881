import { describe, it, expect } from 'vitest';
import { parseRequirementsJson } from '../core/validation/parser';

describe('parser', () => {
  it('rejects malformed JSON', () => {
    const result = parseRequirementsJson('{ invalid: json');
    expect(result.error).toBe('Invalid JSON format');
    expect(result.data).toBeNull();
  });

  it('rejects JSON without tender object', () => {
    const result = parseRequirementsJson(JSON.stringify({ requirements: [] }));
    expect(result.error).toBe('Missing or invalid "tender" object');
  });

  it('rejects invalid dates in tender', () => {
    const result = parseRequirementsJson(JSON.stringify({
      tender: { tender_id: "T1", title: "A", procuring_entity: "B", bidder: "C", submission_deadline: "20-10-2026" },
      requirements: []
    }));
    expect(result.error).toContain('Invalid submission_deadline format');
  });

  it('detects duplicate requirement IDs', () => {
    const result = parseRequirementsJson(JSON.stringify({
      tender: { tender_id: "T1", title: "A", procuring_entity: "B", bidder: "C", submission_deadline: "2026-10-20" },
      requirements: [
        { id: "R1", order: 1, title_en: "A", title_bn: "B", mandatory: true, has_expiry: false },
        { id: "R1", order: 2, title_en: "C", title_bn: "D", mandatory: false, has_expiry: true }
      ]
    }));
    expect(result.error).toContain('Duplicate requirement ID found: R1');
  });

  it('sorts requirements by order', () => {
    const result = parseRequirementsJson(JSON.stringify({
      tender: { tender_id: "T1", title: "A", procuring_entity: "B", bidder: "C", submission_deadline: "2026-10-20" },
      requirements: [
        { id: "R2", order: 2, title_en: "C", title_bn: "D", mandatory: false, has_expiry: true },
        { id: "R1", order: 1, title_en: "A", title_bn: "B", mandatory: true, has_expiry: false }
      ]
    }));
    expect(result.error).toBeNull();
    expect(result.data?.requirements[0].id).toBe('R1');
    expect(result.data?.requirements[1].id).toBe('R2');
  });
});
