import { useState, useEffect } from 'react';

const useLoopManager = (videoLength, currentTime, playerControls) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(videoLength || 0);
  const [sliderValue, setSliderValue] = useState([null, null]);

  // Update end time when video length becomes available
  useEffect(() => {
    if (videoLength && endTime === 0) {
      setEndTime(videoLength);
    }
  }, [videoLength, endTime]);

  // Monitor loop boundaries
  useEffect(() => {
    if (!playerControls) return;

    const checkLoop = setInterval(() => {
      if (currentTime >= endTime) {
        playerControls.seekTo(startTime);
      }
    }, 1000);

    return () => clearInterval(checkLoop);
  }, [currentTime, startTime, endTime, playerControls]);

  const handleRangeChange = (values) => {
    playerControls?.mute();
    setStartTime(values[0]);
    setEndTime(values[1]);
  };

  const handleRangeChangeEnd = () => {
    playerControls?.unmute();
    setSliderValue([startTime, endTime]);
  };

  const jumpToSection = (start, end) => {
    setStartTime(start);
    setEndTime(end);
    setSliderValue([start, end]);
    playerControls?.seekTo(start);
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