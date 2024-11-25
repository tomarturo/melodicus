import React from 'react';
import { HStack, Button, Icon } from '@chakra-ui/react';
import { PlayIcon, PauseIcon } from '@heroicons/react/20/solid';
import { RepeatIcon } from '@chakra-ui/icons'

const PlaybackControls = ({ isPlaying, playPauseClick, restartLoop }) => {
  return (
    <HStack gap="4">
      <Button
        size='lg'
        shadow='sm'
        color="black"
        bg="white"
        border='1px'
        borderColor='blackAlpha.200'
        borderRadius='full'
        _hover={{ color: 'white', bg: 'black' }}
        aria-label='Play or Pause'
        leftIcon={isPlaying ? <Icon as={PauseIcon} /> : <Icon as={PlayIcon} />}
        onClick={playPauseClick}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
      <Button
        leftIcon={<Icon as={RepeatIcon} />}
        size='lg'
        shadow='md'
        color="black"
        bg="white"
        border='1px'
        borderColor='blackAlpha.200'
        borderRadius='full'
        _hover={{ color: 'white', bg: 'black' }}
        aria-label='Restart Loop'
        onClick={restartLoop}
      >
        Restart
      </Button>
    </HStack>
  );
};

export default PlaybackControls;