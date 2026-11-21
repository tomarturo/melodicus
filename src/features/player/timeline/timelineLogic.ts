import type { Section } from '../../sections/types';

// Multipliers of fit-to-width. zoom() just sets minPxPerSec and re-renders, so
// level 1 (clientWidth / duration) is exactly the non-scrolling fit.
export const ZOOM_LEVELS = [1, 2, 4, 8] as const;

/** Pixels per second for a zoom level, or null when there's nothing to size against yet. */
export function pixelsPerSecond(viewWidth: number, duration: number, zoomIndex: number): number | null {
  if (!(viewWidth > 0) || !(duration > 0)) return null;
  return (viewWidth / duration) * (ZOOM_LEVELS[zoomIndex] ?? 1);
}

// Number(null) and Number('') are both 0, which passes a plain isFinite check,
// so blank bounds have to be rejected before the coercion.
export const toSeconds = (value: unknown): number =>
  value === null || value === undefined || value === '' ? NaN : Number(value);

/** Sections that can be drawn: finite bounds with the end after the start. */
export function drawableSections(sections: Section[]): Section[] {
  return sections.filter((section) => {
    const start = toSeconds(section.start_time);
    const end = toSeconds(section.end_time);
    return Number.isFinite(start) && Number.isFinite(end) && end > start;
  });
}

/**
 * Saved loops in the order they're listed: by start, then end, then id so
 * ties stay put. Unusable entries are left out.
 */
export function orderedLoops(sections: Section[]): Section[] {
  return drawableSections(sections).sort(
    (a, b) => a.start_time - b.start_time || a.end_time - b.end_time || a.id.localeCompare(b.id),
  );
}

/**
 * Where to scroll so the playhead stays in view, or null to stay put. Rather
 * than keeping the playhead centred (which moves the track on every tick), the
 * view jumps a page when the playhead nears either edge, landing it a quarter
 * of the way in.
 */
export function followScrollLeft({
  playheadPx,
  scrollLeft,
  viewWidth,
  contentWidth,
}: {
  playheadPx: number;
  scrollLeft: number;
  viewWidth: number;
  contentWidth: number;
}): number | null {
  if (contentWidth <= viewWidth) return null;
  const margin = viewWidth * 0.05;
  if (playheadPx >= scrollLeft + margin && playheadPx <= scrollLeft + viewWidth - margin) return null;
  const target = playheadPx - viewWidth * 0.25;
  return Math.min(Math.max(target, 0), contentWidth - viewWidth);
}

/** A wheel or trackpad gesture that scrolls the track sideways. */
export const isHorizontalWheel = (event: { deltaX: number; deltaY: number; shiftKey: boolean }) =>
  Math.abs(event.deltaX) > Math.abs(event.deltaY) || (event.shiftKey && event.deltaY !== 0);

