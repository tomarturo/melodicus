export interface Loop {
  start: number;
  end: number;
}

// Shortest loop the timeline lets you make, and the shortest that can be saved.
export const MIN_LOOP = 0.25;

/** True when playback has reached the loop's end and should jump back to its start. */
export const shouldWrap = (time: number, loop: Loop): boolean =>
  // A zero-length loop would seek on every tick and pin playback in place.
  loop.end - loop.start > 0 && time >= loop.end;

export const isSaveableLoop = (loop: Loop): boolean => loop.end - loop.start >= MIN_LOOP;

/** The loop before anyone picks one: the whole video. */
export const fullLoop = (duration: number): Loop => ({ start: 0, end: duration });
