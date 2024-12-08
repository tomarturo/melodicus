import { useState, useEffect, useCallback } from 'react';
import { convertDurationToSeconds } from '../utils/formatTime';

const useYouTubePlayer = (videoId, apiKey) => {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoLength, setVideoLength] = useState(null);
  const [videoTitle, setVideoTitle] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);

  // Initialize YouTube Player
  useEffect(() => {
    const initPlayer = () => {
      // @ts-ignore
      const ytPlayer = new window.YT.Player('player', {
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
          onReady: (event) => {
            console.log("Player is ready");
            setPlayer(event.target);
          },
          onStateChange: (event) => {
            // @ts-ignore
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
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
    let intervalId;
    
    const updateTime = () => {
      if (player && typeof player.getCurrentTime === 'function') {
        try {
          const time = player.getCurrentTime();
          if (typeof time === 'number' && !isNaN(time)) {
            setCurrentTime(time);
            // Debug log
            console.log('Current time updated:', time);
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
    fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${apiKey}`)
      .then(response => response.json())
      .then(data => {
        const duration = data.items[0]?.contentDetails?.duration;
        const thumbnailUrl = data.items[0]?.snippet?.thumbnails?.medium?.url;
        const totalDuration = convertDurationToSeconds(duration);
        const title = data.items[0]?.snippet?.title;

        setVideoLength(totalDuration || 0);
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
    
    seekTo: useCallback((time) => {
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
    
    setPlaybackRate: useCallback((rate) => {
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