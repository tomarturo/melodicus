import { describe, expect, it, vi } from 'vitest';
import { isNewAccount } from './AuthContext';

vi.mock('../supabaseClient', () => ({ supabase: {} }));

describe('isNewAccount', () => {
  it('is true when the code just confirmed the email', () => {
    expect(isNewAccount({ email_confirmed_at: '2026-11-24T10:00:00.000Z', last_sign_in_at: '2026-11-24T10:00:01.200Z' })).toBe(true);
  });

  it('is false for someone who confirmed their email earlier', () => {
    expect(isNewAccount({ email_confirmed_at: '2026-10-01T10:00:00Z', last_sign_in_at: '2026-11-24T10:00:00Z' })).toBe(false);
  });

  it('is false when either time is missing', () => {
    expect(isNewAccount({ email_confirmed_at: undefined, last_sign_in_at: '2026-11-24T10:00:00Z' })).toBe(false);
    expect(isNewAccount(null)).toBe(false);
  });
});
