import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '../../lib/database.types';
import {
  SectionSchema,
  withoutDuplicates,
  type LoopTimes,
  type NewSection,
  type SavedSongWithLoops,
  type Section,
  type SectionsRepository,
  type VideoRef,
} from './types';

type Client = SupabaseClient<Database>;

const SongRowSchema = z.object({
  id: z.string(),
  video_id: z.string(),
  title: z.string(),
  created_at: z.string(),
});

const SectionRowSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  start_time: z.number(),
  end_time: z.number(),
});

const LoopRowSchema = z.object({
  saved_song_id: z.string(),
  name: z.string().nullable(),
  start_time: z.number(),
});

const toSection = (row: unknown): Section => SectionSchema.parse(SectionRowSchema.parse(row));

/** Turns a Supabase { data, error } result into data or a thrown Error. */
const unwrap = <T>({ data, error }: { data: T | null; error: PostgrestError | null }, action: string): T => {
  if (error) throw new Error(`Could not ${action}: ${error.message}`);
  if (data === null) throw new Error(`Could not ${action}: no data came back.`);
  return data;
};

const check = ({ error }: { error: PostgrestError | null }, action: string) => {
  if (error) throw new Error(`Could not ${action}: ${error.message}`);
};

/** Stores loops in Supabase for a signed-in user. Row-level security scopes every query to them. */
export class SupabaseSectionsRepo implements SectionsRepository {
  readonly kind = 'remote' as const;

  constructor(
    private readonly client: Client,
    private readonly userId: string,
  ) {}

  async listSections(videoId: string): Promise<Section[]> {
    const song = await this.findSong(videoId);
    if (!song) return [];
    return this.sectionsForSong(song.id);
  }

  async createSection(video: VideoRef, input: NewSection): Promise<Section> {
    const song = await this.ensureSong(video);
    const row = unwrap(
      await this.client
        .from('saved_sections')
        .insert({ saved_song_id: song.id, name: input.name, start_time: input.start_time, end_time: input.end_time })
        .select()
        .single(),
      'save the loop',
    );
    return toSection(row);
  }

  async renameSection(_videoId: string, sectionId: string, name: string | null): Promise<Section> {
    const row = unwrap(
      await this.client.from('saved_sections').update({ name }).eq('id', sectionId).select().single(),
      'rename the loop',
    );
    return toSection(row);
  }

  async retimeSection(_videoId: string, sectionId: string, times: LoopTimes): Promise<Section> {
    const row = unwrap(
      await this.client
        .from('saved_sections')
        .update({ start_time: times.start_time, end_time: times.end_time })
        .eq('id', sectionId)
        .select()
        .single(),
      'update the loop',
    );
    return toSection(row);
  }

  async deleteSection(_videoId: string, sectionId: string): Promise<void> {
    check(await this.client.from('saved_sections').delete().eq('id', sectionId), 'delete the loop');
  }

  async importSections(video: VideoRef, incoming: NewSection[]): Promise<number> {
    const song = await this.ensureSong(video);
    const existing = await this.sectionsForSong(song.id);
    const added = withoutDuplicates(existing, incoming);
    if (added.length === 0) return 0;
    check(
      await this.client.from('saved_sections').insert(
        added.map((loop) => ({
          saved_song_id: song.id,
          name: loop.name,
          start_time: loop.start_time,
          end_time: loop.end_time,
        })),
      ),
      'import the loops',
    );
    return added.length;
  }

  async listSavedSongs(): Promise<SavedSongWithLoops[]> {
    const songs = z.array(SongRowSchema).parse(
      unwrap(
        await this.client
          .from('saved_songs')
          .select('id, video_id, title, created_at')
          .eq('user_id', this.userId)
          .order('created_at', { ascending: false }),
        'load your saved songs',
      ),
    );
    // All of the user's loops in one query (row-level security scopes it),
    // grouped onto their songs here.
    const loopRows = z.array(LoopRowSchema).parse(
      unwrap(
        await this.client.from('saved_sections').select('saved_song_id, name, start_time').order('start_time', { ascending: true }),
        'load your loops',
      ),
    );
    const loopsBySong = new Map<string, SavedSongWithLoops['loops']>();
    for (const { saved_song_id, name, start_time } of loopRows) {
      loopsBySong.set(saved_song_id, [...(loopsBySong.get(saved_song_id) ?? []), { name, start_time }]);
    }
    return songs.map((row) => ({
      videoId: row.video_id,
      title: row.title,
      savedAt: row.created_at,
      loops: loopsBySong.get(row.id) ?? [],
    }));
  }

  async deleteSavedSong(videoId: string): Promise<void> {
    // saved_sections cascades on delete, so the song's loops go with it.
    check(
      await this.client.from('saved_songs').delete().eq('video_id', videoId).eq('user_id', this.userId),
      'remove the song',
    );
  }

  private async findSong(videoId: string) {
    // Nothing in the schema stops a user saving the same video twice, so take
    // the oldest row rather than asking for exactly one.
    const rows = unwrap(
      await this.client
        .from('saved_songs')
        .select('id, video_id, title, created_at')
        .eq('video_id', videoId)
        .eq('user_id', this.userId)
        .order('created_at', { ascending: true })
        .limit(1),
      'load the song',
    );
    const [first] = z.array(SongRowSchema).parse(rows);
    return first ?? null;
  }

  private async ensureSong(video: VideoRef) {
    const existing = await this.findSong(video.videoId);
    if (existing) return existing;
    if (!video.title) throw new Error('The video is still loading. Try again in a moment.');
    const row = unwrap(
      await this.client
        .from('saved_songs')
        .insert({ video_id: video.videoId, title: video.title })
        .select('id, video_id, title, created_at')
        .single(),
      'save the song',
    );
    return SongRowSchema.parse(row);
  }

  private async sectionsForSong(songId: string): Promise<Section[]> {
    const rows = unwrap(
      await this.client
        .from('saved_sections')
        .select('id, name, start_time, end_time')
        .eq('saved_song_id', songId)
        .order('created_at', { ascending: true }),
      'load the loops',
    );
    // A row that fails validation is skipped, not allowed to break the page.
    return z
      .array(z.unknown())
      .parse(rows)
      .flatMap((row) => {
        const result = SectionSchema.safeParse(SectionRowSchema.safeParse(row).data);
        return result.success ? [result.data] : [];
      });
  }
}
