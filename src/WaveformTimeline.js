import React from 'react';
import { Box } from '@chakra-ui/react';
import useWaveformTimeline from './hooks/useWaveformTimeline';

const WaveformTimeline = ({ videoLength, currentTime, onSeek }) => {
  const { containerRef } = useWaveformTimeline({
    duration: videoLength,
    currentTime,
    onSeek,
  });

  return (
    <Box py={4} px={8} bg="#FAF9F6">
      <Box ref={containerRef} />
    </Box>
  );
};

export default WaveformTimeline;
