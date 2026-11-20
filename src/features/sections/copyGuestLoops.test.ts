import { describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from '../../test/memoryStorage';
import { copyGuestLoopsToAccount } from './copyGuestLoops';
import { LocalSectionsRepo } from './localSectionsRepo';

// A second LocalSectionsRepo on its own storage stands in for the account.
const setup = () => ({
  guest: new LocalSectionsRepo(new MemoryStorage()),
  account: new LocalSectionsRepo(new MemoryStorage()),
});

describe('copyGuestLoopsToAccount', () => {
  it('copies every song’s loops and clears the guest copy', async () => {
    const { guest, account } = setup();
    await guest.createSection({ videoId: 'a', title: 'Song A' }, { name: 'Intro', start_time: 0, end_time: 5 });
    await guest.createSection({ videoId: 'a', title: 'Song A' }, { name: null, start_time: 10, end_time: 15 });
    await guest.createSection({ videoId: 'b', title: 'Song B' }, { name: 'Solo', start_time: 20, end_time: 30 });

    expect(await copyGuestLoopsToAccount(guest, account)).toEqual({ added: 3, failed: 0 });
    expect((await account.listSections('a')).map((loop) => loop.name)).toEqual(['Intro', null]);
    expect((await account.listSavedSongs()).map((song) => song.title).sort()).toEqual(['Song A', 'Song B']);
    expect(await guest.listSavedSongs()).toEqual([]);
  });

  it('skips loops the account already has', async () => {
    const { guest, account } = setup();
    await account.createSection({ videoId: 'a', title: 'Song A' }, { name: 'Intro', start_time: 0, end_time: 5 });
    await guest.createSection({ videoId: 'a', title: 'Song A' }, { name: 'Intro', start_time: 0, end_time: 5 });
    await guest.createSection({ videoId: 'a', title: 'Song A' }, { name: 'New', start_time: 6, end_time: 9 });

    expect(await copyGuestLoopsToAccount(guest, account)).toEqual({ added: 1, failed: 0 });
    expect(await account.listSections('a')).toHaveLength(2);
  });

  it('keeps a song’s guest loops when copying it fails, and finishes the rest', async () => {
    const { guest, account } = setup();
    await guest.createSection({ videoId: 'a', title: 'Song A' }, { name: null, start_time: 0, end_time: 5 });
    await guest.createSection({ videoId: 'b', title: 'Song B' }, { name: null, start_time: 0, end_time: 5 });
    const original = account.importSections.bind(account);
    vi.spyOn(account, 'importSections').mockImplementation((video, loops) =>
      video.videoId === 'a' ? Promise.reject(new Error('offline')) : original(video, loops),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await copyGuestLoopsToAccount(guest, account)).toEqual({ added: 1, failed: 1 });
    expect((await guest.listSavedSongs()).map((song) => song.videoId)).toEqual(['a']);
    expect(await guest.listSections('a')).toHaveLength(1);
  });

  it('uses the video ID when old guest data has no title', async () => {
    const { guest, account } = setup();
    await guest.createSection({ videoId: 'a', title: '' }, { name: null, start_time: 0, end_time: 5 });
    await copyGuestLoopsToAccount(guest, account);
    expect((await account.listSavedSongs())[0]?.title).toBe('a');
  });
});
