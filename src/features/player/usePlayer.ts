import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchVideoDetails } from '../../lib/youtube';
import { convertDurationToSeconds } from '../../utils/formatTime';
import { loadYouTubeIframeApi } from './loadYouTubeIframeApi';
import { PlayerController, type PlayerState } from './playerController';

/**
 * Creates the hidden YouTube player for a video and a PlayerController that
 * owns it. Render the returned ref on an element to host the player.
 */
export function usePlayerController(videoId: string) {
  const [controller] = useState(() => new PlayerController());
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let player: YT.Player | null = null;
    let cancelled = false;

    // A fresh element each time: YT.Player replaces the element it is given,
    // and React's development double-mount would otherwise hand it a stale one.
    const target = document.createElement('div');
    host.appendChild(target);

    loadYouTubeIframeApi()
      .then((yt) => {
        if (cancelled) return;
        player = new yt.Player(target, {
          width: '0',
          height: '0',
          videoId,
          playerVars: { autoplay: 0, controls: 0, rel: 0, fs: 0 },
          events: {
            onReady: (event) => controller.attach(event.target),
            onStateChange: (event) => controller.handlePlayerState(event.data),
          },
        });
      })
      .catch((error) => console.error(error));

    return () => {
      cancelled = true;
      player?.destroy();
      host.replaceChildren();
    };
  }, [videoId, controller]);

  useEffect(() => () => controller.destroy(), [controller]);

  return { controller, hostRef };
}

/** Re-renders on play, pause, loop and duration changes. Not on playback time. */
export function usePlayerState(controller: PlayerController): PlayerState {
  return useSyncExternalStore(controller.subscribe, controller.getState);
}

/** Title, thumbnail and duration from the YouTube Data API. */
export function useVideoDetails(videoId: string, controller: PlayerController) {
  const query = useQuery({
    queryKey: ['videoDetails', videoId],
    queryFn: () => fetchVideoDetails(videoId),
    staleTime: Infinity,
  });

  const duration = query.data?.duration;
  useEffect(() => {
    if (duration) controller.setDuration(convertDurationToSeconds(duration), false);
  }, [duration, controller]);

  return {
    title: query.data?.title ?? null,
    thumbnailUrl: query.data?.thumbnailUrl ?? null,
    error: query.error,
  };
}
