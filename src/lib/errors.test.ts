import { describe, expect, it } from 'vitest';
import { errorMessage } from './errors';

describe('errorMessage', () => {
  it('reads Error instances', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('reads plain objects with a message, like Supabase errors', () => {
    expect(errorMessage({ message: 'row-level security', code: '42501' })).toBe('row-level security');
  });

  it('stringifies anything else', () => {
    expect(errorMessage('offline')).toBe('offline');
  });
});
