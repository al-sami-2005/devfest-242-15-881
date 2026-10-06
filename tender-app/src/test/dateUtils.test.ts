import { describe, it, expect } from 'vitest';
import { isExpiryValid, isValidISODate } from '../core/validation/dateUtils';

describe('dateUtils', () => {
  describe('isValidISODate', () => {
    it('returns true for valid ISO dates', () => {
      expect(isValidISODate('2026-10-20')).toBe(true);
    });
    it('returns false for invalid formats', () => {
      expect(isValidISODate('20-10-2026')).toBe(false);
      expect(isValidISODate('2026/10/20')).toBe(false);
      expect(isValidISODate('invalid')).toBe(false);
    });
    it('returns false for invalid calendar dates', () => {
      expect(isValidISODate('2026-02-30')).toBe(false);
    });
  });

  describe('isExpiryValid', () => {
    const deadline = '2026-10-20';

    it('returns false if expiry is before deadline (expired)', () => {
      expect(isExpiryValid('2026-10-19', deadline)).toBe(false);
      expect(isExpiryValid('2025-10-20', deadline)).toBe(false);
    });

    it('returns true if expiry is exactly on the deadline', () => {
      expect(isExpiryValid('2026-10-20', deadline)).toBe(true);
    });

    it('returns true if expiry is after the deadline', () => {
      expect(isExpiryValid('2026-10-21', deadline)).toBe(true);
      expect(isExpiryValid('2027-01-01', deadline)).toBe(true);
    });
  });
});
