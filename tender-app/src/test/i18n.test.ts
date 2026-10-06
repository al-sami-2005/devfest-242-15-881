import { describe, it, expect } from 'vitest';
import { getRequirementTitle } from '../core/i18n';
import { Requirement } from '../core/types';

describe('i18n', () => {
  it('returns correct language title', () => {
    const req: Requirement = {
      id: 'R1',
      order: 1,
      title_en: 'English Title',
      title_bn: 'Bangla Title',
      mandatory: true,
      has_expiry: false
    };

    expect(getRequirementTitle(req, 'en')).toBe('English Title');
    expect(getRequirementTitle(req, 'bn')).toBe('Bangla Title');
  });
});
