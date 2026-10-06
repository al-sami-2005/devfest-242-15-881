import { TenderData, Requirement } from '../types';
import { isValidISODate } from './dateUtils';

export interface ParseResult {
  data: TenderData | null;
  error: string | null;
}

export const parseRequirementsJson = (jsonString: string): ParseResult => {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { data: null, error: 'Invalid JSON format' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { data: null, error: 'JSON root must be an object' };
  }

  const { tender, requirements } = parsed;

  if (!tender || typeof tender !== 'object') {
    return { data: null, error: 'Missing or invalid "tender" object' };
  }

  const requiredTenderFields = ['tender_id', 'title', 'procuring_entity', 'bidder', 'submission_deadline'];
  for (const field of requiredTenderFields) {
    if (typeof tender[field] !== 'string' || !tender[field].trim()) {
      return { data: null, error: `Missing or invalid tender field: ${field}` };
    }
  }

  if (!isValidISODate(tender.submission_deadline)) {
    return { data: null, error: 'Invalid submission_deadline format (expected YYYY-MM-DD)' };
  }

  if (!Array.isArray(requirements)) {
    return { data: null, error: '"requirements" must be an array' };
  }

  const seenIds = new Set<string>();
  const parsedRequirements: Requirement[] = [];

  for (let i = 0; i < requirements.length; i++) {
    const req = requirements[i];
    if (!req || typeof req !== 'object') {
      return { data: null, error: `Requirement at index ${i} is not an object` };
    }

    if (typeof req.id !== 'string' || !req.id.trim()) {
      return { data: null, error: `Requirement at index ${i} missing or invalid "id"` };
    }

    if (seenIds.has(req.id)) {
      return { data: null, error: `Duplicate requirement ID found: ${req.id}` };
    }
    seenIds.add(req.id);

    if (typeof req.order !== 'number') {
      return { data: null, error: `Requirement ${req.id} missing or invalid "order"` };
    }

    if (typeof req.title_en !== 'string' || !req.title_en.trim()) {
      return { data: null, error: `Requirement ${req.id} missing or invalid "title_en"` };
    }

    if (typeof req.title_bn !== 'string' || !req.title_bn.trim()) {
      return { data: null, error: `Requirement ${req.id} missing or invalid "title_bn"` };
    }

    if (typeof req.mandatory !== 'boolean') {
      return { data: null, error: `Requirement ${req.id} missing or invalid "mandatory"` };
    }

    if (typeof req.has_expiry !== 'boolean') {
      return { data: null, error: `Requirement ${req.id} missing or invalid "has_expiry"` };
    }

    parsedRequirements.push({
      id: req.id,
      order: req.order,
      title_en: req.title_en,
      title_bn: req.title_bn,
      mandatory: req.mandatory,
      has_expiry: req.has_expiry,
    });
  }

  // Sort requirements by order for use, but we don't modify the original array in place
  parsedRequirements.sort((a, b) => a.order - b.order);

  return {
    data: {
      tender: {
        tender_id: tender.tender_id,
        title: tender.title,
        procuring_entity: tender.procuring_entity,
        bidder: tender.bidder,
        submission_deadline: tender.submission_deadline,
      },
      requirements: parsedRequirements
    },
    error: null,
  };
};
