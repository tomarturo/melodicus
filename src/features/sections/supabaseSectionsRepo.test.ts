import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../../lib/database.types';
import { FakePostgrest } from '../../test/fakePostgrest';
import { TEST_SUPABASE_URL, setupFakeSupabase } from '../../test/mswSupabase';
import { SupabaseSectionsRepo } from './supabaseSectionsRepo';

const USER = 'user-1';
const fake = new FakePostgrest(USER);
const server = setupFakeSupabase(fake);
const client = createClient<Database>(TEST_SUPABASE_URL, 'test-anon-key', {
  auth: { persistSession: false },
  // supabase-js captures fetch when the client is created; resolve it per call so MSW's patch applies.
  global: { fetch: (...args) => fetch(...args) },
});
const video = { videoId: 'abc12345678', title: 'Song A' };

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  fake.userId = USER;
  fake.tables = { saved_songs: [], saved_sections: [] };
  fake.log = [];
});

describe('SupabaseSectionsRepo', () => {
  it('saves the song on the first loop and reuses it after', async () => {
    const repo = new SupabaseSectionsRepo(client, USER);
    await repo.createSection(video, { name: 'Solo', start_time: 30, end_time: 45 });
    await repo.createSection(video, { name: null, start_time: 50, end_time: 60 });
    expect(fake.tables.saved_songs).toHaveLength(1);
    expect((await repo.listSections(video.videoId)).map((section) => section.name)).toEqual(['Solo', null]);
  });

  it('refuses to create a song before its title is known', async () => {
    const repo = new SupabaseSectionsRepo(client, USER);
    await expect(repo.createSection({ videoId: 'x', title: '' }, { name: null, start_time: 1, end_time: 2 })).rejects.toThrow(
      'still loading',
    );
  });

  it('renames and deletes loops', async () => {
    const repo = new SupabaseSectionsRepo(client, USER);
    const created = await repo.createSection(video, { name: 'A', start_time: 1, end_time: 2 });
    expect((await repo.renameSection(video.videoId, created.id, 'B')).name).toBe('B');
    await repo.deleteSection(video.videoId, created.id);
    expect(await repo.listSections(video.videoId)).toEqual([]);
  });

  it('moves a loop’s start and end', async () => {
    const repo = new SupabaseSectionsRepo(client, USER);
    const created = await repo.createSection(video, { name: 'Solo', start_time: 30, end_time: 45 });
    const retimed = await repo.retimeSection(video.videoId, created.id, { start_time: 31.5, end_time: 47 });
    expect(retimed).toMatchObject({ id: created.id, name: 'Solo', start_time: 31.5, end_time: 47 });
    expect(await repo.listSections(video.videoId)).toEqual([retimed]);
  });

  it('imports loops without duplicates, in one insert', async () => {
    const repo = new SupabaseSectionsRepo(client, USER);
    await repo.createSection(video, { name: 'A', start_time: 10, end_time: 20 });
    fake.log = [];
    const added = await repo.importSections(video, [
      { name: 'A again', start_time: 10, end_time: 20 },
      { name: 'B', start_time: 30, end_time: 40 },
      { name: 'C', start_time: 50, end_time: 60 },
    ]);
    expect(added).toBe(2);
    expect(fake.log.filter((entry) => entry.method === 'POST')).toHaveLength(1);
  });

  it('lists saved songs newest first and removes one with its loops', async () => {
    const repo = new SupabaseSectionsRepo(client, USER);
    await repo.createSection(video, { name: null, start_time: 1, end_time: 2 });
    await repo.createSection({ videoId: 'zzz', title: 'Song B' }, { name: null, start_time: 1, end_time: 2 });
    expect((await repo.listSavedSongs()).map((song) => song.title)).toEqual(['Song B', 'Song A']);

    await repo.deleteSavedSong(video.videoId);
    expect((await repo.listSavedSongs()).map((song) => song.title)).toEqual(['Song B']);
    expect(fake.tables.saved_sections).toHaveLength(1);
  });

  it('lists each saved song with its own loops in playing order', async () => {
    const repo = new SupabaseSectionsRepo(client, USER);
    await repo.createSection(video, { name: 'Solo', start_time: 60, end_time: 70 });
    await repo.createSection(video, { name: 'Intro', start_time: 5, end_time: 9 });
    await repo.createSection({ videoId: 'zzz', title: 'Song B' }, { name: 'Riff', start_time: 1, end_time: 2 });
    const songs = await repo.listSavedSongs();
    expect(songs.find((song) => song.title === 'Song A')!.loops.map((loop) => loop.name)).toEqual(['Intro', 'Solo']);
    expect(songs.find((song) => song.title === 'Song B')!.loops.map((loop) => loop.name)).toEqual(['Riff']);
  });

  it('only sees the signed-in user’s rows', async () => {
    await new SupabaseSectionsRepo(client, USER).createSection(video, { name: null, start_time: 1, end_time: 2 });
    fake.userId = 'user-2';
    expect(await new SupabaseSectionsRepo(client, 'user-2').listSections(video.videoId)).toEqual([]);
  });

  it('turns database errors into readable Errors', async () => {
    fake.tables = { saved_songs: [] } as never;
    const repo = new SupabaseSectionsRepo(client, USER);
    await expect(repo.createSection(video, { name: null, start_time: 1, end_time: 2 })).rejects.toThrow(
      /Could not save the loop: relation "saved_sections" does not exist/,
    );
  });
});
