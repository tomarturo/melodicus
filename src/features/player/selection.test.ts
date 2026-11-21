import { describe, expect, it } from 'vitest';
import { selectionStatus } from './selection';

const solo = { id: 'solo', name: 'Solo', start_time: 30, end_time: 45 };
const intro = { id: 'intro', name: 'Intro', start_time: 0, end_time: 12 };
const sections = [intro, solo];

describe('selectionStatus', () => {
  it('is none while the loop is still the whole video', () => {
    expect(selectionStatus({ loop: { start: 0, end: 210 }, hasCustomLoop: false, loopOrigin: null, sections })).toEqual({
      kind: 'none',
    });
  });

  it('is saved when the selection is exactly a saved loop, wherever it came from', () => {
    expect(selectionStatus({ loop: { start: 30.004, end: 45 }, hasCustomLoop: true, loopOrigin: null, sections })).toEqual({
      kind: 'saved',
      section: solo,
    });
  });

  it('is modified when a saved loop’s edges have moved', () => {
    expect(selectionStatus({ loop: { start: 29, end: 47 }, hasCustomLoop: true, loopOrigin: 'solo', sections })).toEqual({
      kind: 'modified',
      section: solo,
    });
  });

  it('is new for a fresh selection, or when the loop it came from was deleted', () => {
    expect(selectionStatus({ loop: { start: 60, end: 70 }, hasCustomLoop: true, loopOrigin: null, sections })).toEqual({
      kind: 'new',
    });
    expect(selectionStatus({ loop: { start: 60, end: 70 }, hasCustomLoop: true, loopOrigin: 'gone', sections })).toEqual({
      kind: 'new',
    });
  });
});
