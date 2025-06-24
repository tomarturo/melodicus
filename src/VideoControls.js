import React from 'react';
import { Flex, HStack, Button, Icon } from '@chakra-ui/react';
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
<Flex 
    alignItems="start" 
    wrap={["wrap", "nowrap", "nowrap"]}
    justify="space-between" 
    alignContent="center"  // This centers the wrapped rows vertically
    bg='#FAF9F6' 
    pt={4} 
    pb={8} 
    px={["12px", "12px", 8]} 
    borderBottomRadius={["0", "0", "xl"]}
  >
    <Flex wrap="wrap" columnGap={3} rowGap={3}  justifyContent="flex-start" alignContent="center" alignItems="center" minW={["auto", "280px"]}  >
        <PlaybackControls
          isPlaying={isPlaying}
          playPauseClick={onPlayPause}
          restartLoop={onRestartLoop}
        />
        <PlaybackRateSelector player={player} />
    </Flex>
    <Flex wrap="wrap" columnGap={3} rowGap={3} justifyContent="flex-end"  alignContent="center" alignItems="center">
        <Button
          width={["-webkit-fill-available", "153px"]}
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
          aria-label='Add loop'
        >
          Add loop
        </Button>
        <ShareTimestamps videoId={videoId} savedSections={savedSections} />
    </Flex>
  </Flex>
);

export default VideoControls;