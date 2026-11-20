import { describe, expect, it } from 'vitest';
import { convertDurationToSeconds, formatSecondsToDuration, roundSeconds } from './formatTime';

describe('convertDurationToSeconds', () => {
  it.each([
    ['PT4M13S', 253],
    ['PT1H2M3S', 3723],
    ['PT45S', 45],
    ['PT10M', 600],
  ])('converts %s to %i seconds', (input, expected) => {
    expect(convertDurationToSeconds(input)).toBe(expected);
  });
});

describe('formatSecondsToDuration', () => {
  it('formats under an hour as MM:SS', () => {
    expect(formatSecondsToDuration(253.9)).toBe('04:13');
  });

  it('formats an hour or more as HH:MM:SS', () => {
    expect(formatSecondsToDuration(3723)).toBe('01:02:03');
  });
});

describe('roundSeconds', () => {
  it('rounds to milliseconds', () => {
    expect(roundSeconds(166.61218337538818)).toBe(166.612);
  });

  it('accepts numeric strings', () => {
    expect(roundSeconds('12.3456')).toBe(12.346);
  });
});
