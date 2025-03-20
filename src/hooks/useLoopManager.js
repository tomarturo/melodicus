import { useState, useEffect } from 'react';

const useLoopManager = (videoLength, currentTime, playerControls) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(videoLength || 0);
  const [sliderValue, setSliderValue] = useState([null, null]);
  useEffect(() => {
    if (videoLength && endTime === 0) {
      setEndTime(videoLength);
    }
  }, [videoLength, endTime]);

  useEffect(() => {
    if (!playerControls?.player) return;

    let intervalId;
    const player = playerControls.player;
    const checkProgress = () => {
      if (player && player.getCurrentTime && typeof player.getCurrentTime === 'function') {
        try {
          const currentTime = player.getCurrentTime();
      console.log('Loop check:', {
            currentTime: Number(currentTime).toFixed(2),
            endTime: Number(endTime).toFixed(2),
            startTime: Number(startTime).toFixed(2),
      });
          if (currentTime >= endTime) {
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

  const handleRangeChange = (values) => {
    if (playerControls?.player?.mute) {
      playerControls.player.mute();
    }
    setStartTime(Number(values[0]));
    setEndTime(Number(values[1]));
  };

  const handleRangeChangeEnd = () => {
    if (playerControls?.player?.unMute) {
      playerControls.player.unMute();
    }
    setSliderValue([Number(startTime), Number(endTime)]);
};

  const jumpToSection = (start, end) => {
    const startNum = Number(start);
    const endNum = Number(end);
    setStartTime(startNum);
    setEndTime(endNum);
    setSliderValue([startNum, endNum]);
    if (playerControls?.player?.seekTo) {
      playerControls.player.seekTo(startNum, true);
    }
  };

  return {
    startTime,
    endTime,
    sliderValue,
    handleRangeChange,
    handleRangeChangeEnd,
    jumpToSection
  };
};

export default useLoopManager;