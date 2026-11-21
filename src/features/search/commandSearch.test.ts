import { describe, expect, it } from 'vitest';
import { actionPath, commandActions } from './commandSearch';

const song = (videoId: string, title: string) => ({ videoId, title, savedAt: '2026-01-01T00:00:00Z' });
const songs = [song('a', 'Little Wing – Jimi Hendrix'), song('b', 'Wish You Were Here'), song('c', 'Café Blues')];

describe('commandActions', () => {
  it('lists saved songs when nothing is typed, and offers no YouTube search', () => {
    expect(commandActions('', songs).map((action) => action.kind)).toEqual(['open-song', 'open-song', 'open-song']);
  });

  it('offers a YouTube search first, then saved songs matching every word, ignoring case and accents', () => {
    expect(commandActions('hendrix wing', songs)).toEqual([
      { kind: 'search-youtube', query: 'hendrix wing' },
      { kind: 'open-song', song: songs[0] },
    ]);
    expect(commandActions('cafe', songs)[1]).toEqual({ kind: 'open-song', song: songs[2] });
  });

  it('offers only the YouTube search when no saved song matches', () => {
    expect(commandActions('  bohemian rhapsody ', songs)).toEqual([{ kind: 'search-youtube', query: 'bohemian rhapsody' }]);
  });

  it('opens a pasted YouTube link directly', () => {
    expect(commandActions('https://youtu.be/dQw4w9WgXcQ?t=10', songs)).toEqual([{ kind: 'open-video', videoId: 'dQw4w9WgXcQ' }]);
    expect(commandActions('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=x', songs)).toEqual([
      { kind: 'open-video', videoId: 'dQw4w9WgXcQ' },
    ]);
  });

  it('caps the number of songs listed', () => {
    const many = Array.from({ length: 10 }, (_, i) => song(String(i), `Song ${i}`));
    expect(commandActions('song', many, 6).filter((action) => action.kind === 'open-song')).toHaveLength(6);
  });
});

describe('actionPath', () => {
  it('encodes search queries', () => {
    expect(actionPath({ kind: 'search-youtube', query: 'AC/DC back in black' })).toBe('/search/AC%2FDC%20back%20in%20black');
  });
});
