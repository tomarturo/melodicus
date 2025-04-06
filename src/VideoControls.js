import React from 'react';
import { HStack, Button, Icon } from '@chakra-ui/react';
import PlaybackControls from './PlaybackControls';
import PlaybackRateSelector from './PlaybackRateSelector';
import ShareTimestamps from './ShareTimestamps';
import { CirclePlus } from 'lucide-react';

const VideoControls = ({
  isPlaying,
  onPlayPause,
  onRestartLoop,
  player,
  onNewLoop,
  canSaveLoop,
  videoId,
  savedSections,
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
    <HStack spacing={3}>
        <Button
          onClick={onNewLoop}
          leftIcon={<Icon as={CirclePlus} w="20px" h="20px" />}
          variant='filled'
          size='lg'
          rounded='full'
          bg="blackAlpha.100"
          border="1px"
          color="blackAlpha.800"
          borderColor="blackAlpha.200"
          _hover={{ 
              boxShadow: "0 0 0 1px", boxShadowColor: "blackAlpha.800", bg:"blackAlpha.200", borderColor:"blackAlpha.700", color:"blackAlpha.900"}}
          aria-label='Add Loop'
        >
          Add Loop
        </Button>
        <ShareTimestamps videoId={videoId} savedSections={savedSections} />
    </HStack>
  </HStack>
);

export default VideoControls;