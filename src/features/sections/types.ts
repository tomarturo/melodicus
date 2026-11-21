import { z } from 'zod';

/** A saved loop. The same shape comes out of both storage backends. */
export const SectionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().nullable(),
    start_time: z.number().finite().nonnegative(),
    end_time: z.number().finite(),
  })
  .refine((section) => section.end_time > section.start_time, {
    message: 'end_time must be after start_time',
  });
export type Section = z.infer<typeof SectionSchema>;

/** A loop's bounds, in seconds. */
export type LoopTimes = Pick<Section, 'start_time' | 'end_time'>;

/** A loop that hasn't been stored yet. */
export type NewSection = Omit<Section, 'id'>;

/** A video someone has saved loops for. */
export const SavedSongSchema = z.object({
  videoId: z.string().min(1),
  title: z.string(),
  savedAt: z.string(),
});
export type SavedSong = z.infer<typeof SavedSongSchema>;

/** Identifies the video a loop belongs to. Supabase requires the title. */
export interface VideoRef {
  videoId: string;
  title: string;
}

export interface SectionsRepository {
  readonly kind: 'local' | 'remote';
  listSections(videoId: string): Promise<Section[]>;
  createSection(video: VideoRef, input: NewSection): Promise<Section>;
  renameSection(videoId: string, sectionId: string, name: string | null): Promise<Section>;
  /** Moves a saved loop's start and end. */
  retimeSection(videoId: string, sectionId: string, times: LoopTimes): Promise<Section>;
  deleteSection(videoId: string, sectionId: string): Promise<void>;
  /**
   * Adds loops to a video, skipping any with the same start and end as a loop
   * it already has (or an earlier one in the same batch). Returns how many
   * were added.
   */
  importSections(video: VideoRef, sections: NewSection[]): Promise<number>;
  listSavedSongs(): Promise<SavedSong[]>;
  /** Removes a saved song and all of its loops. */
  deleteSavedSong(videoId: string): Promise<void>;
}

// Times are stored to the millisecond, so anything closer than that is the
// same loop.
const SAME_TIME_EPSILON = 0.0005;

export const isSameLoop = (a: NewSection, b: NewSection) =>
  Math.abs(a.start_time - b.start_time) < SAME_TIME_EPSILON &&
  Math.abs(a.end_time - b.end_time) < SAME_TIME_EPSILON;

/** The loops in `incoming` that match nothing in `existing` or earlier in `incoming`. */
export const withoutDuplicates = (existing: NewSection[], incoming: NewSection[]): NewSection[] => {
  const kept: NewSection[] = [];
  for (const loop of incoming) {
    if (existing.some((other) => isSameLoop(other, loop))) continue;
    if (kept.some((other) => isSameLoop(other, loop))) continue;
    kept.push(loop);
  }
  return kept;
};

export const newSectionId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
