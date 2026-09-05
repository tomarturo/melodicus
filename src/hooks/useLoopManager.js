import { useState, useEffect } from 'react';

const useLoopManager = (videoLength, currentTime, playerControls) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(videoLength || 0);
  // Until the user picks a loop, it spans the whole video - so it has to follow
  // videoLength as that gets refined from the player's exact duration, not just
  // seed itself once while endTime is still 0.
  const [hasCustomLoop, setHasCustomLoop] = useState(false);

  useEffect(() => {
    if (videoLength && !hasCustomLoop) {
      setEndTime(videoLength);
    }
  }, [videoLength, hasCustomLoop]);

  useEffect(() => {
    if (!playerControls?.player) return;

    let intervalId;
    const player = playerControls.player;
    const checkProgress = () => {
      if (player && player.getCurrentTime && typeof player.getCurrentTime === 'function') {
        try {
          // A zero-length loop would seek on every tick and pin playback in place.
          if (endTime > startTime && player.getCurrentTime() >= endTime) {
            player.seekTo(startTime, true);
          }
        } catch (error) {
          console.error("Error in checkProgress:", error);
      }
      }
  };

    if (player && player.getPlayerState) {
      const setupInterval = () => {
        if (player.getPlayerState() !== -1) {
          intervalId = setInterval(checkProgress, 250);
        } else {
          setTimeout(setupInterval, 1000);
        }
  };
      setupInterval();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
  };
  }, [playerControls?.player, endTime, startTime]);

  // Called continuously while a loop region is dragged or resized. Muting keeps
  // the scrub from sounding like a stutter; handleRangeChangeEnd unmutes.
  const handleRangeChange = (start, end) => {
    if (playerControls?.player?.mute) {
      playerControls.player.mute();
    }
    setStartTime(start);
    setEndTime(end);
    setHasCustomLoop(true);
  };

  const handleRangeChangeEnd = () => {
    if (playerControls?.player?.unMute) {
      playerControls.player.unMute();
    }
};

  const jumpToSection = (start, end) => {
    const startNum = Number(start);
    const endNum = Number(end);
    setStartTime(startNum);
    setEndTime(endNum);
    setHasCustomLoop(true);
    if (playerControls?.player?.seekTo) {
      playerControls.player.seekTo(startNum, true);
    }
  };

  return {
    startTime,
    endTime,
    handleRangeChange,
    handleRangeChangeEnd,
    jumpToSection
  };
};

export default useLoopManager;
