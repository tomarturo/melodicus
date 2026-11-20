import { z } from 'zod';
import { roundSeconds } from '../../utils/formatTime';
import type { NewSection } from '../sections/types';

// Share links carry loops in the URL fragment, which browsers never send to a
// server:
//
//   /video/<id>#v1=34.512-52.1:Intro,60-75:Solo%20A,112.2-130
//
// Each loop is start-end in seconds (to the millisecond), optionally followed
// by :name with the name URL-encoded. The v1= prefix leaves room for other
// formats later. Older links used ?sections=<base64 JSON>; decodeLegacyShare
// keeps those working.

const MAX_NAME_LENGTH = 100;
const MAX_LOOPS = 200;

const SharedLoopSchema = z
  .object({
    name: z.string().max(MAX_NAME_LENGTH).nullable(),
    start_time: z.number().finite().nonnegative(),
    end_time: z.number().finite(),
  })
  .refine((loop) => loop.end_time > loop.start_time);

const formatSeconds = (seconds: number) => String(roundSeconds(seconds));

/** The fragment (without '#') that encodes these loops. */
export function encodeShareFragment(loops: NewSection[]): string {
  const items = loops.map((loop) => {
    const times = `${formatSeconds(loop.start_time)}-${formatSeconds(loop.end_time)}`;
    return loop.name ? `${times}:${encodeURIComponent(loop.name)}` : times;
  });
  return `v1=${items.join(',')}`;
}

export function buildShareUrl(origin: string, videoId: string, loops: NewSection[]): string {
  return `${origin}/video/${encodeURIComponent(videoId)}#${encodeShareFragment(loops)}`;
}

const TIME_PATTERN = /^\d+(\.\d+)?$/;

/**
 * Loops from a v1 fragment (with or without the leading '#'). Items that don't
 * parse are skipped. Returns null when the fragment isn't a v1 share at all.
 */
export function decodeShareFragment(hash: string): NewSection[] | null {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!fragment.startsWith('v1=')) return null;

  const loops = fragment
    .slice(3)
    .split(',')
    .slice(0, MAX_LOOPS)
    .flatMap((item): NewSection[] => {
      const separator = item.indexOf(':');
      const times = separator === -1 ? item : item.slice(0, separator);
      const [start = '', end = '', ...extra] = times.split('-');
      if (extra.length > 0 || !TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) return [];

      let name: string | null = null;
      if (separator !== -1) {
        try {
          name = decodeURIComponent(item.slice(separator + 1)) || null;
        } catch {
          return [];
        }
      }

      const result = SharedLoopSchema.safeParse({ name, start_time: Number(start), end_time: Number(end) });
      return result.success ? [result.data] : [];
    });

  return loops;
}

// The pre-v1 links carried full section objects, with either snake_case or
// camelCase times.
const LegacyLoopSchema = z
  .object({
    name: z.string().nullable().optional(),
    start_time: z.coerce.number().optional(),
    end_time: z.coerce.number().optional(),
    startTime: z.coerce.number().optional(),
    endTime: z.coerce.number().optional(),
  })
  .transform((loop) => ({
    name: loop.name ? loop.name.slice(0, MAX_NAME_LENGTH) : null,
    start_time: loop.start_time ?? loop.startTime ?? NaN,
    end_time: loop.end_time ?? loop.endTime ?? NaN,
  }))
  .pipe(SharedLoopSchema);

/** Loops from an old `?sections=<base64>` link, or null if there's nothing usable. */
export function decodeLegacyShare(search: string): NewSection[] | null {
  const encoded = new URLSearchParams(search).get('sections');
  if (!encoded) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
  if (!Array.isArray(raw)) return null;
  return raw.slice(0, MAX_LOOPS).flatMap((item) => {
    const result = LegacyLoopSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}

/** Shared loops from a URL's hash or query, whichever format it uses. */
export function decodeSharedLoops(location: { hash: string; search: string }): NewSection[] | null {
  return decodeShareFragment(location.hash) ?? decodeLegacyShare(location.search);
}
