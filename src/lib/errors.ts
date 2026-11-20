/**
 * A message for anything caught in a catch block. Supabase errors are plain
 * objects with a message, not always Error instances, so both are handled.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return String(error);
}
