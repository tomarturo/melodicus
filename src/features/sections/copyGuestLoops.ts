import type { SectionsRepository } from './types';

export interface CopyResult {
  /** Loops added to the account (duplicates of loops it already had are not counted). */
  added: number;
  /** Songs whose loops could not be copied. They stay in local storage for next time. */
  failed: number;
}

/**
 * Moves a guest's locally saved loops into their account. Each song's local
 * copy is removed only after its loops are safely in the account, so a failure
 * part-way through loses nothing: the rest is retried at the next login.
 */
export async function copyGuestLoopsToAccount(
  local: SectionsRepository,
  account: SectionsRepository,
): Promise<CopyResult> {
  const result: CopyResult = { added: 0, failed: 0 };
  for (const song of await local.listSavedSongs()) {
    try {
      const loops = await local.listSections(song.videoId);
      if (loops.length > 0) {
        result.added += await account.importSections(
          // The account needs a title; old guest data may not have one.
          { videoId: song.videoId, title: song.title || song.videoId },
          loops.map(({ name, start_time, end_time }) => ({ name, start_time, end_time })),
        );
      }
      await local.deleteSavedSong(song.videoId);
    } catch (error) {
      console.error(`Could not copy loops for ${song.videoId} to the account:`, error);
      result.failed += 1;
    }
  }
  return result;
}
