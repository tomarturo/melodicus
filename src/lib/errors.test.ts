import { describe, expect, it } from 'vitest';
import { errorCause, errorMessage } from './errors';

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

describe('errorCause', () => {
  it('drops a leading "Could not …:" so it doesn’t repeat the toast title', () => {
    expect(errorCause(new Error('Could not delete the loop: database is down'))).toBe('Database is down');
    expect(errorCause(new Error('network unreachable'))).toBe('Network unreachable');
  });
});
