import React from 'react';
import { HStack, Button, Icon } from '@chakra-ui/react';
import { PlayIcon, PauseIcon } from '@heroicons/react/20/solid';
import { RepeatIcon } from '@chakra-ui/icons'

const PlaybackControls = ({ isPlaying, playPauseClick, restartLoop }) => {
  return (
    <HStack gap="2">
      <Button
        size='lg'
        w="130px"
        rounded='full'
        variant='filled'
        bg="blackAlpha.100"
        border="1px"
        color="blackAlpha.800"
        borderColor="blackAlpha.100"
        _hover={{ bg:"blackAlpha.200", borderColor:"blackAlpha.700", border:"2px", color:"blackAlpha.900"}}
        aria-label='Play or Pause'
        leftIcon={isPlaying ? <Icon as={PauseIcon} /> : <Icon as={PlayIcon} />}
        onClick={playPauseClick}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
      <Button
        leftIcon={<Icon as={RepeatIcon} />}
        w="140px"
        size='lg'
        rounded='full'
        variant='filled'
        bg="blackAlpha.100"
        border="1px"
        color="blackAlpha.800"
        borderColor="blackAlpha.100"
        _hover={{ bg:"blackAlpha.200", borderColor:"blackAlpha.700", border:"2px", color:"blackAlpha.900"}}
        aria-label='Restart Loop'
        onClick={restartLoop}
      >
        Restart
      </Button>
    </HStack>
  );
};

export default PlaybackControls;