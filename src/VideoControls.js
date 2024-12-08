import React from 'react';
import { HStack, Button } from '@chakra-ui/react';
import PlaybackControls from './PlaybackControls';
import PlaybackRateSelector from './PlaybackRateSelector';

const VideoControls = ({
  isPlaying,
  onPlayPause,
  onRestartLoop,
  player,
  onNewLoop,
  onSaveVideo,
  isUserLoggedIn,
  isSaved,
  canSaveLoop,
}) => (
  <HStack mb='8' align="center" justify="space-between" wrap="wrap">
    <HStack wrap="wrap">
        <PlaybackControls
          isPlaying={isPlaying}
          playPauseClick={onPlayPause}
          restartLoop={onRestartLoop}
        />
        <PlaybackRateSelector player={player} />
    </HStack>
    <HStack>
        <Button
          onClick={onNewLoop}
          colorScheme="green"
          isDisabled={!isUserLoggedIn || !isSaved || !canSaveLoop}
        >
          New Loop
        </Button>
        <Button
          onClick={onSaveVideo}
          colorScheme={isSaved ? "red" : "blue"}
          isDisabled={!isUserLoggedIn}
        >
          {!isUserLoggedIn ? 'Login to Save' : (isSaved ? 'Remove Song' : 'Save Song')}
        </Button>
    </HStack>
  </HStack>
);

export default VideoControls;