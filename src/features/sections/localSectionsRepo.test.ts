import { beforeEach, describe, expect, it } from 'vitest';
import { LocalSectionsRepo } from './localSectionsRepo';

const video = { videoId: 'abc12345678', title: 'Song A' };

beforeEach(() => {
  localStorage.clear();
});

describe('LocalSectionsRepo', () => {
  it('creates, renames and deletes loops', async () => {
    const repo = new LocalSectionsRepo();
    const created = await repo.createSection(video, { name: 'Solo', start_time: 30, end_time: 45.5 });
    expect(await repo.listSections(video.videoId)).toEqual([created]);

    const renamed = await repo.renameSection(video.videoId, created.id, 'Outro solo');
    expect(renamed.name).toBe('Outro solo');

    await repo.deleteSection(video.videoId, created.id);
    expect(await repo.listSections(video.videoId)).toEqual([]);
  });

  it('moves a loop’s start and end, keeping its name, and rejects an end before the start', async () => {
    const repo = new LocalSectionsRepo();
    const created = await repo.createSection(video, { name: 'Solo', start_time: 30, end_time: 45 });
    const retimed = await repo.retimeSection(video.videoId, created.id, { start_time: 31.5, end_time: 47 });
    expect(retimed).toEqual({ id: created.id, name: 'Solo', start_time: 31.5, end_time: 47 });
    expect(await repo.listSections(video.videoId)).toEqual([retimed]);
    await expect(repo.retimeSection(video.videoId, created.id, { start_time: 50, end_time: 40 })).rejects.toThrow();
  });

  it('adds a video to the saved-songs index when its first loop is saved', async () => {
    const repo = new LocalSectionsRepo();
    await repo.createSection(video, { name: null, start_time: 1, end_time: 2 });
    await repo.createSection(video, { name: null, start_time: 3, end_time: 4 });
    const songs = await repo.listSavedSongs();
    expect(songs).toHaveLength(1);
    expect(songs[0]).toMatchObject({ videoId: video.videoId, title: 'Song A' });
  });

  it('lists each saved song with its loops in playing order', async () => {
    const repo = new LocalSectionsRepo();
    await repo.createSection(video, { name: 'Solo', start_time: 60, end_time: 70 });
    await repo.createSection(video, { name: null, start_time: 5, end_time: 9 });
    const [song] = await repo.listSavedSongs();
    expect(song!.loops).toEqual([
      { name: null, start_time: 5 },
      { name: 'Solo', start_time: 60 },
    ]);
  });

  it('deleting a saved song removes its loops', async () => {
    const repo = new LocalSectionsRepo();
    await repo.createSection(video, { name: null, start_time: 1, end_time: 2 });
    await repo.deleteSavedSong(video.videoId);
    expect(await repo.listSavedSongs()).toEqual([]);
    expect(await repo.listSections(video.videoId)).toEqual([]);
  });

  it('imports loops, skipping ones that match an existing loop or each other', async () => {
    const repo = new LocalSectionsRepo();
    await repo.createSection(video, { name: 'A', start_time: 10, end_time: 20 });
    const added = await repo.importSections(video, [
      { name: 'A again', start_time: 10, end_time: 20 },
      { name: 'B', start_time: 30, end_time: 40 },
      { name: 'B twice', start_time: 30, end_time: 40 },
    ]);
    expect(added).toBe(1);
    expect((await repo.listSections(video.videoId)).map((section) => section.name)).toEqual(['A', 'B']);
  });

  it('drops invalid stored entries without losing the valid ones', async () => {
    localStorage.setItem(
      `melodicus:v1:sections:${video.videoId}`,
      JSON.stringify([{ id: 'ok', name: 'Good', start_time: 1, end_time: 2 }, null, { id: 'bad', start_time: 5 }]),
    );
    const sections = await new LocalSectionsRepo().listSections(video.videoId);
    expect(sections.map((section) => section.id)).toEqual(['ok']);
  });

  it('treats unreadable JSON as empty', async () => {
    localStorage.setItem(`melodicus:v1:sections:${video.videoId}`, '{not json');
    expect(await new LocalSectionsRepo().listSections(video.videoId)).toEqual([]);
  });

  it('migrates pre-v1 video_sections_ entries and indexes their songs', async () => {
    localStorage.setItem(
      'video_sections_abc12345678',
      JSON.stringify([
        { id: 1700000000000, name: 'Intro', start_time: 0, end_time: 8, video_id: 'abc12345678', video_title: 'Old song' },
        { id: 1700000000001, name: '', start_time: '12', end_time: '20' },
        { id: 1700000000002, name: 'Broken', start_time: 30 },
      ]),
    );
    const repo = new LocalSectionsRepo();
    const sections = await repo.listSections('abc12345678');
    expect(sections.map(({ name, start_time, end_time }) => ({ name, start_time, end_time }))).toEqual([
      { name: 'Intro', start_time: 0, end_time: 8 },
      { name: null, start_time: 12, end_time: 20 },
    ]);
    expect(sections.every((section) => typeof section.id === 'string')).toBe(true);
    expect(await repo.listSavedSongs()).toMatchObject([{ videoId: 'abc12345678', title: 'Old song' }]);
    expect(localStorage.getItem('video_sections_abc12345678')).toBeNull();
  });

  it('leaves unreadable legacy entries in place', async () => {
    localStorage.setItem('video_sections_zzz', '{not json');
    await new LocalSectionsRepo().listSavedSongs();
    expect(localStorage.getItem('video_sections_zzz')).toBe('{not json');
  });
});
