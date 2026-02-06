import { normalizeToE164 } from '@/lib/phone/normalize';

describe('normalizeToE164', () => {
  test('normalizes properly for +34', () => {
    expect(normalizeToE164('+34', '612345678')).toBe('+34612345678');
  });

  test('strips non-digit characters', () => {
    expect(normalizeToE164('+1', '(415) 555-2671')).toBe('+14155552671');
  });

  test('returns null for too short', () => {
    expect(normalizeToE164('+44', '123')).toBeNull();
  });

  test('returns null for missing country', () => {
    expect(normalizeToE164(undefined, '612345678')).toBeNull();
  });
});
