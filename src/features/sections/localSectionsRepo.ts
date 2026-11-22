import { z } from 'zod';
import {
  SavedSongSchema,
  SectionSchema,
  newSectionId,
  withoutDuplicates,
  type LoopTimes,
  type NewSection,
  type SavedSong,
  type SavedSongWithLoops,
  type Section,
  type SectionsRepository,
  type VideoRef,
} from './types';

const SONGS_KEY = 'melodicus:v1:songs';
const sectionsKey = (videoId: string) => `melodicus:v1:sections:${videoId}`;
const LEGACY_PREFIX = 'video_sections_';

// Loose shape of the pre-v1 entries: numeric IDs, video_id and video_title on
// every row, and no guarantee that any field is present.
const LegacySectionSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().nullable().optional(),
  start_time: z.coerce.number(),
  end_time: z.coerce.number(),
  video_title: z.string().nullable().optional(),
});

const readJson = (storage: Storage, key: string): unknown => {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch (error) {
    console.warn(`Ignoring unreadable localStorage entry ${key}:`, error);
    return null;
  }
};

/** Parses each item on its own, so one bad entry is dropped rather than the whole list. */
const parseEach = <T>(value: unknown, schema: z.ZodType<T>): T[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const result = schema.safeParse(item);
    return result.success ? [result.data] : [];
  });
};

/**
 * Stores loops in this browser's localStorage, for guests. Each video's loops
 * live under their own key, and a separate index lists the saved videos so
 * guests get a saved-songs page too.
 */
const loopsInOrder = (sections: Section[]) =>
  [...sections].sort((a, b) => a.start_time - b.start_time).map(({ name, start_time }) => ({ name, start_time }));

export class LocalSectionsRepo implements SectionsRepository {
  readonly kind = 'local' as const;
  private migrated = false;

  constructor(private readonly storage: Storage = window.localStorage) {}

  async listSections(videoId: string): Promise<Section[]> {
    this.migrateLegacy();
    return this.readSections(videoId);
  }

  async createSection(video: VideoRef, input: NewSection): Promise<Section> {
    this.migrateLegacy();
    const section = SectionSchema.parse({ ...input, id: newSectionId() });
    this.writeSections(video.videoId, [...this.readSections(video.videoId), section]);
    this.rememberSong(video);
    return section;
  }

  /**
   * Forgets every song and loop this browser keeps, old-format ones included,
   * and nothing else in storage. For when the account they'd be copied into
   * is deleted.
   */
  clearAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && (key === SONGS_KEY || key.startsWith(sectionsKey('')) || key.startsWith(LEGACY_PREFIX))) keys.push(key);
    }
    keys.forEach((key) => this.storage.removeItem(key));
  }

  async renameSection(videoId: string, sectionId: string, name: string | null): Promise<Section> {
    this.migrateLegacy();
    const sections = this.readSections(videoId);
    const existing = sections.find((section) => section.id === sectionId);
    if (!existing) throw new Error('That loop no longer exists.');
    const renamed = { ...existing, name };
    this.writeSections(videoId, sections.map((section) => (section.id === sectionId ? renamed : section)));
    return renamed;
  }

  async retimeSection(videoId: string, sectionId: string, times: LoopTimes): Promise<Section> {
    this.migrateLegacy();
    const sections = this.readSections(videoId);
    const existing = sections.find((section) => section.id === sectionId);
    if (!existing) throw new Error('That loop no longer exists.');
    const retimed = SectionSchema.parse({ ...existing, ...times });
    this.writeSections(videoId, sections.map((section) => (section.id === sectionId ? retimed : section)));
    return retimed;
  }

  async deleteSection(videoId: string, sectionId: string): Promise<void> {
    this.migrateLegacy();
    this.writeSections(videoId, this.readSections(videoId).filter((section) => section.id !== sectionId));
  }

  async importSections(video: VideoRef, incoming: NewSection[]): Promise<number> {
    this.migrateLegacy();
    const existing = this.readSections(video.videoId);
    const added = withoutDuplicates(existing, incoming).map((loop) => SectionSchema.parse({ ...loop, id: newSectionId() }));
    if (added.length === 0) return 0;
    this.writeSections(video.videoId, [...existing, ...added]);
    this.rememberSong(video);
    return added.length;
  }

  async listSavedSongs(): Promise<SavedSongWithLoops[]> {
    this.migrateLegacy();
    return this.readSongs().map((song) => ({ ...song, loops: loopsInOrder(this.readSections(song.videoId)) }));
  }

  async deleteSavedSong(videoId: string): Promise<void> {
    this.migrateLegacy();
    this.storage.removeItem(sectionsKey(videoId));
    this.writeSongs(this.readSongs().filter((song) => song.videoId !== videoId));
  }

  private readSections(videoId: string): Section[] {
    return parseEach(readJson(this.storage, sectionsKey(videoId)), SectionSchema);
  }

  private writeSections(videoId: string, sections: Section[]) {
    this.storage.setItem(sectionsKey(videoId), JSON.stringify(sections));
  }

  private readSongs(): SavedSong[] {
    return parseEach(readJson(this.storage, SONGS_KEY), SavedSongSchema);
  }

  private writeSongs(songs: SavedSong[]) {
    this.storage.setItem(SONGS_KEY, JSON.stringify(songs));
  }

  /** Adds the video to the saved-songs index, newest first, or refreshes its title. */
  private rememberSong(video: VideoRef) {
    const songs = this.readSongs();
    const existing = songs.find((song) => song.videoId === video.videoId);
    if (existing) {
      if (video.title && existing.title !== video.title) {
        this.writeSongs(songs.map((song) => (song.videoId === video.videoId ? { ...song, title: video.title } : song)));
      }
      return;
    }
    this.writeSongs([{ videoId: video.videoId, title: video.title, savedAt: new Date().toISOString() }, ...songs]);
  }

  /**
   * Moves pre-v1 `video_sections_<id>` entries into the v1 keys and the
   * saved-songs index. Entries that can't be parsed at all are left in place
   * rather than deleted.
   */
  private migrateLegacy() {
    if (this.migrated) return;
    this.migrated = true;

    const legacyKeys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(LEGACY_PREFIX)) legacyKeys.push(key);
    }

    for (const key of legacyKeys) {
      const raw = readJson(this.storage, key);
      if (!Array.isArray(raw)) continue;
      const videoId = key.slice(LEGACY_PREFIX.length);
      const legacy = parseEach(raw, LegacySectionSchema);
      const loops: NewSection[] = legacy.flatMap((entry) => {
        const loop = { name: entry.name || null, start_time: entry.start_time, end_time: entry.end_time };
        return SectionSchema.safeParse({ ...loop, id: 'check' }).success ? [loop] : [];
      });
      const title = legacy.find((entry) => entry.video_title)?.video_title ?? '';

      if (loops.length > 0) {
        const existing = this.readSections(videoId);
        const added = withoutDuplicates(existing, loops).map((loop) => ({ ...loop, id: newSectionId() }));
        this.writeSections(videoId, [...existing, ...added]);
        this.rememberSong({ videoId, title: title || videoId });
      }
      this.storage.removeItem(key);
    }
  }
}
