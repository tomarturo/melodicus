import { useState, useEffect, useCallback, useRef } from 'react';
import { convertDurationToSeconds } from '../utils/formatTime';
import { fetchVideoDetails } from '../lib/youtube';

const useYouTubePlayer = (videoId: string, apiKey: string) => {
  const [player, setPlayer] = useState<YT.Player | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoLength, setVideoLength] = useState<number | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  // The Data API reports duration as an ISO-8601 string of whole seconds, so it
  // can sit up to a second off the real media. Every region on the timeline maps
  // through this value, so prefer the player's fractional figure once it exists
  // and don't let the API response (which may resolve later) overwrite it.
  const playerDurationRef = useRef<number | null>(null);

  // Initialize YouTube Player
  useEffect(() => {
    const initPlayer = () => {
      if (!window.YT) return;
      new window.YT.Player('player', {
        width: '0',
        height: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          fs: 0,
          showinfo: 0,
        },
        events: {
          onReady: (event: YT.PlayerEvent) => {
            setPlayer(event.target);
            const exactDuration = event.target.getDuration?.();
            if (exactDuration !== undefined && Number.isFinite(exactDuration) && exactDuration > 0) {
              playerDurationRef.current = exactDuration;
              setVideoLength(exactDuration);
            }
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            setIsPlaying(event.data === window.YT?.PlayerState.PLAYING);
          },
        },
      });
    };

    // Add the YouTube API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      window.onYouTubeIframeAPIReady = initPlayer;
      document.body.appendChild(tag);
    } else {
      initPlayer();
    }

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, [videoId]);

  // Update current time - Modified for more reliable tracking
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    
    const updateTime = () => {
      if (player && typeof player.getCurrentTime === 'function') {
        try {
          const time = player.getCurrentTime();
          if (typeof time === 'number' && !isNaN(time)) {
            setCurrentTime(time);
          }
        } catch (error) {
          console.error('Error getting current time:', error);
        }
      }
    };

    if (player) {
      // Update more frequently for smoother playback indicator
      intervalId = setInterval(updateTime, 100);
      
      // Initial update
      updateTime();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [player]);

  // Fetch video details
  useEffect(() => {
    fetchVideoDetails(videoId, apiKey)
      .then(({ duration, title, thumbnailUrl }) => {
        const totalDuration = duration ? convertDurationToSeconds(duration) : 0;
        setVideoLength(playerDurationRef.current || totalDuration || 0);
        setVideoThumbnail(thumbnailUrl);
        setVideoTitle(title);
      })
      .catch(error => {
        console.error('Error fetching video details:', error);
      });
  }, [videoId, apiKey]);

  const controls = {
    play: useCallback(() => {
      if (player?.playVideo) player.playVideo();
    }, [player]),
    
    pause: useCallback(() => {
      if (player?.pauseVideo) player.pauseVideo();
    }, [player]),
    
    seekTo: useCallback((time: number) => {
      if (player?.seekTo) {
        player.seekTo(time, true);
        setCurrentTime(time); // Immediate update for smoother UI
      }
    }, [player]),
    
    mute: useCallback(() => {
      if (player?.mute) player.mute();
    }, [player]),
    
    unmute: useCallback(() => {
      if (player?.unMute) player.unMute();
    }, [player]),
    
    setPlaybackRate: useCallback((rate: number) => {
      if (player?.setPlaybackRate) player.setPlaybackRate(rate);
    }, [player])
  };

  return {
    player,
    isPlaying,
    currentTime,
    videoLength,
    videoTitle,
    videoThumbnail,
    controls
  };
};

export default useYouTubePlayer;