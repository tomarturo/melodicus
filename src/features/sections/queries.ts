import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSectionsRepository } from './useSectionsRepository';
import type { LoopTimes, NewSection, VideoRef } from './types';

export const sectionKeys = {
  all: ['sections'] as const,
  video: (scope: string, videoId: string) => ['sections', scope, videoId] as const,
  savedSongs: (scope: string) => ['savedSongs', scope] as const,
};

export function useSectionsQuery(videoId: string) {
  const { repo, scope } = useSectionsRepository();
  return useQuery({
    queryKey: sectionKeys.video(scope, videoId),
    queryFn: () => repo.listSections(videoId),
  });
}

export function useSavedSongsQuery() {
  const { repo, scope } = useSectionsRepository();
  return useQuery({
    queryKey: sectionKeys.savedSongs(scope),
    queryFn: () => repo.listSavedSongs(),
  });
}

/** Writes to the active repository, refreshing the cached loops and saved songs afterwards. */
export function useSectionMutations(videoId: string) {
  const { repo, scope } = useSectionsRepository();
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: sectionKeys.video(scope, videoId) }),
      queryClient.invalidateQueries({ queryKey: sectionKeys.savedSongs(scope) }),
    ]);

  return {
    create: useMutation({
      mutationFn: ({ video, loop }: { video: VideoRef; loop: NewSection }) => repo.createSection(video, loop),
      onSettled: refresh,
    }),
    rename: useMutation({
      mutationFn: ({ sectionId, name }: { sectionId: string; name: string | null }) =>
        repo.renameSection(videoId, sectionId, name),
      onSettled: refresh,
    }),
    retime: useMutation({
      mutationFn: ({ sectionId, times }: { sectionId: string; times: LoopTimes }) =>
        repo.retimeSection(videoId, sectionId, times),
      onSettled: refresh,
    }),
    remove: useMutation({
      mutationFn: (sectionId: string) => repo.deleteSection(videoId, sectionId),
      onSettled: refresh,
    }),
    importLoops: useMutation({
      mutationFn: ({ video, loops }: { video: VideoRef; loops: NewSection[] }) => repo.importSections(video, loops),
      onSettled: refresh,
    }),
  };
}

export function useDeleteSavedSong() {
  const { repo, scope } = useSectionsRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => repo.deleteSavedSong(videoId),
    onSettled: (_data, _error, videoId) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: sectionKeys.savedSongs(scope) }),
        queryClient.invalidateQueries({ queryKey: sectionKeys.video(scope, videoId) }),
      ]),
  });
}
