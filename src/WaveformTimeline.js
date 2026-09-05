import React from 'react';
import { Box } from '@chakra-ui/react';
import useWaveformTimeline from './hooks/useWaveformTimeline';

const WaveformTimeline = ({
  videoLength,
  currentTime,
  startTime,
  endTime,
  onSeek,
  onRangeChange,
  onRangeChangeEnd,
}) => {
  const { containerRef, timelineRef } = useWaveformTimeline({
    duration: videoLength,
    currentTime,
    loopStart: startTime,
    loopEnd: endTime,
    onSeek,
    onLoopChange: onRangeChange,
    onLoopChangeEnd: onRangeChangeEnd,
  });

  return (
    <Box py={4} px={8} bg="#FAF9F6">
      <Box ref={timelineRef} mb={1} />
      <Box ref={containerRef} />
    </Box>
  );
};

export default WaveformTimeline;
