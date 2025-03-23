import React from 'react';
import { HStack, Button, Icon } from '@chakra-ui/react';
import PlaybackControls from './PlaybackControls';
import PlaybackRateSelector from './PlaybackRateSelector';
import { RectangleStackIcon } from '@heroicons/react/24/solid';

const VideoControls = ({
  isPlaying,
  onPlayPause,
  onRestartLoop,
  player,
  onNewLoop,
  canSaveLoop,
}) => (
  <HStack align="center" justify="space-between" wrap="wrap" bg='#FAF9F6' pt={4} pb={8} px={8} borderBottomRadius={12}>
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
          leftIcon={<Icon as={RectangleStackIcon} />}
          w='170px'
          size='lg'
          rounded='full'
          variant='filled'
          bg="blackAlpha.100"
          border="1px"
          color="blackAlpha.800"
          borderColor="blackAlpha.100"
          _hover={{ bg:"blackAlpha.200", borderColor:"blackAlpha.700", border:"2px", color:"blackAlpha.900"}}
          aria-label='Save Loop'
        >
        Save Loop
        </Button>
    </HStack>
  </HStack>
);

export default VideoControls;