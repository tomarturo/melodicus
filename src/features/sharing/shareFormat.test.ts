import { describe, expect, it } from 'vitest';
import { buildShareUrl, decodeLegacyShare, decodeShareFragment, decodeSharedLoops, encodeShareFragment } from './shareFormat';

const loops = [
  { name: 'Intro', start_time: 34.512, end_time: 52.1 },
  { name: null, start_time: 60, end_time: 75 },
  { name: 'Solo, part 2: fast-bit ✨', start_time: 112.2, end_time: 130 },
];

// The encoder the app used before v1, so old links can be rebuilt in tests.
const legacyLink = (sections: unknown) => `?sections=${btoa(encodeURIComponent(JSON.stringify(sections)))}`;

describe('v1 share fragments', () => {
  it('encodes loops compactly', () => {
    expect(encodeShareFragment(loops.slice(0, 2))).toBe('v1=34.512-52.1:Intro,60-75');
  });

  it('round-trips names with commas, colons, hyphens and emoji', () => {
    expect(decodeShareFragment(`#${encodeShareFragment(loops)}`)).toEqual(loops);
  });

  it('rounds times to the millisecond', () => {
    expect(encodeShareFragment([{ name: null, start_time: 166.61218337538818, end_time: 170 }])).toBe('v1=166.612-170');
  });

  it('builds a link to the video page', () => {
    expect(buildShareUrl('https://melodicus.xyz', 'abc12345678', loops.slice(1, 2))).toBe(
      'https://melodicus.xyz/video/abc12345678#v1=60-75',
    );
  });

  it('skips items that are malformed or out of order, keeping the rest', () => {
    expect(decodeShareFragment('#v1=10-20:Good,abc,30-25:Backwards,-5-10,40-50:%E0%A4%A,60-70')).toEqual([
      { name: 'Good', start_time: 10, end_time: 20 },
      { name: null, start_time: 60, end_time: 70 },
    ]);
  });

  it('returns null for fragments that are not v1 shares', () => {
    expect(decodeShareFragment('')).toBeNull();
    expect(decodeShareFragment('#v2=1-2')).toBeNull();
    expect(decodeShareFragment('#section-heading')).toBeNull();
  });
});

describe('legacy ?sections= links', () => {
  it('decodes the old base64 format, including camelCase times', () => {
    const search = legacyLink([
      { id: 1, name: 'Verse', start_time: 5, end_time: 15, video_id: 'abc', video_title: 'Song' },
      { name: '', startTime: '20', endTime: '30' },
    ]);
    expect(decodeLegacyShare(search)).toEqual([
      { name: 'Verse', start_time: 5, end_time: 15 },
      { name: null, start_time: 20, end_time: 30 },
    ]);
  });

  it('skips unusable entries and rejects garbage', () => {
    expect(decodeLegacyShare(legacyLink([{ name: 'No times' }, { start_time: 1, end_time: 2 }]))).toEqual([
      { name: null, start_time: 1, end_time: 2 },
    ]);
    expect(decodeLegacyShare('?sections=not-base64!!')).toBeNull();
    expect(decodeLegacyShare('?other=1')).toBeNull();
  });
});

describe('decodeSharedLoops', () => {
  it('prefers the v1 fragment and falls back to the legacy query', () => {
    expect(decodeSharedLoops({ hash: '#v1=1-2', search: legacyLink([{ start_time: 5, end_time: 6 }]) })).toEqual([
      { name: null, start_time: 1, end_time: 2 },
    ]);
    expect(decodeSharedLoops({ hash: '', search: legacyLink([{ start_time: 5, end_time: 6 }]) })).toEqual([
      { name: null, start_time: 5, end_time: 6 },
    ]);
    expect(decodeSharedLoops({ hash: '', search: '' })).toBeNull();
  });
});
