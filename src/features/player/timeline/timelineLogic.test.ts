import { describe, expect, it } from 'vitest';
import { activeLoopId, drawableSections, orderedLoops, followScrollLeft, isHorizontalWheel, pixelsPerSecond } from './timelineLogic';

const section = (id: string, start_time: number, end_time: number) => ({ id, name: null, start_time, end_time });

describe('pixelsPerSecond', () => {
  it('fits the video at 1x and multiplies for each zoom level', () => {
    expect(pixelsPerSecond(1000, 200, 0)).toBe(5);
    expect(pixelsPerSecond(1000, 200, 2)).toBe(20);
  });

  it('returns null before the view or video has a size', () => {
    expect(pixelsPerSecond(0, 200, 0)).toBeNull();
    expect(pixelsPerSecond(1000, 0, 0)).toBeNull();
  });
});

describe('drawableSections', () => {
  it('keeps only sections with usable bounds', () => {
    const bad = { ...section('c', 5, 5) };
    const blank = { ...section('d', 0, 1), start_time: '' as unknown as number };
    expect(drawableSections([section('a', 1, 2), bad, blank]).map((s) => s.id)).toEqual(['a']);
  });
});

describe('orderedLoops', () => {
  it('orders by start, then end, and drops unusable loops', () => {
    const loops = [section('late', 50, 60), section('bad', 5, 5), section('early-long', 1, 9), section('early', 1, 2)];
    expect(orderedLoops(loops).map((s) => s.id)).toEqual(['early', 'early-long', 'late']);
  });
});

describe('activeLoopId', () => {
  it('finds the saved loop that matches the current loop', () => {
    const loops = [section('a', 10, 20), section('b', 30, 40)];
    expect(activeLoopId(loops, { start: 30.001, end: 40 })).toBe('b');
    expect(activeLoopId(loops, { start: 30, end: 41 })).toBeNull();
  });
});

describe('followScrollLeft', () => {
  const view = { viewWidth: 1000, contentWidth: 4000 };

  it('stays put while the playhead is comfortably in view', () => {
    expect(followScrollLeft({ ...view, playheadPx: 1500, scrollLeft: 1000 })).toBeNull();
  });

  it('turns the page when the playhead reaches the right edge', () => {
    expect(followScrollLeft({ ...view, playheadPx: 1990, scrollLeft: 1000 })).toBe(1740);
  });

  it('jumps back when the loop wraps to a start that is out of view', () => {
    expect(followScrollLeft({ ...view, playheadPx: 300, scrollLeft: 2000 })).toBe(50);
  });

  it('clamps to the ends of the track', () => {
    expect(followScrollLeft({ ...view, playheadPx: 3990, scrollLeft: 1000 })).toBe(3000);
    expect(followScrollLeft({ ...view, playheadPx: 10, scrollLeft: 2000 })).toBe(0);
  });

  it('does nothing when the whole track fits', () => {
    expect(followScrollLeft({ viewWidth: 1000, contentWidth: 1000, playheadPx: 990, scrollLeft: 0 })).toBeNull();
  });
});

describe('isHorizontalWheel', () => {
  it('recognises sideways trackpad swipes and shift-scrolling', () => {
    expect(isHorizontalWheel({ deltaX: 30, deltaY: 2, shiftKey: false })).toBe(true);
    expect(isHorizontalWheel({ deltaX: 0, deltaY: 40, shiftKey: true })).toBe(true);
    expect(isHorizontalWheel({ deltaX: 0, deltaY: 40, shiftKey: false })).toBe(false);
  });
});

