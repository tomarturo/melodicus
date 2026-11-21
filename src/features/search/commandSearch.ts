import { videoIdFromUrl } from '../../lib/youtubeUrl';
import type { SavedSong } from '../sections/types';

export type CommandAction =
  | { kind: 'open-video'; videoId: string }
  | { kind: 'open-song'; song: SavedSong }
  | { kind: 'search-youtube'; query: string };

const normalize = (text: string) => text.toLocaleLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/**
 * What the search dialog offers for the text typed so far: a pasted YouTube
 * link opens that video; otherwise saved songs whose titles match, then a
 * YouTube search. Only that last one uses API quota, and only when chosen.
 */
export function commandActions(input: string, songs: SavedSong[], maxSongs = 6): CommandAction[] {
  const query = input.trim();
  const videoId = videoIdFromUrl(query);
  if (videoId) return [{ kind: 'open-video', videoId }];

  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const matches = songs.filter((song) => {
    const title = normalize(song.title || '');
    return terms.every((term) => title.includes(term));
  });
  const actions: CommandAction[] = matches.slice(0, maxSongs).map((song) => ({ kind: 'open-song', song }));
  if (query) actions.push({ kind: 'search-youtube', query });
  return actions;
}

/** Where an action leads. */
export function actionPath(action: CommandAction): string {
  switch (action.kind) {
    case 'open-video':
      return `/video/${action.videoId}`;
    case 'open-song':
      return `/video/${action.song.videoId}`;
    case 'search-youtube':
      return `/search/${encodeURIComponent(action.query)}`;
  }
}
