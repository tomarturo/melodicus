import React from 'react';
import { HStack, Button, Icon } from '@chakra-ui/react';
import { PlayIcon, PauseIcon } from '@heroicons/react/20/solid';
import { RepeatIcon } from '@chakra-ui/icons'

const PlaybackControls = ({ isPlaying, playPauseClick, restartLoop }) => {
  return (
    <HStack mb='6' justify='center'>
      <Button
        size='lg'
        shadow='sm'
        mx='2'
        bg='white'
        variant='solid'
        border='1px'
        borderColor='gray.200'
        borderRadius='full'
        aria-label='Play or Pause'
        leftIcon={isPlaying ? <Icon as={PauseIcon} /> : <Icon as={PlayIcon} />}
        onClick={playPauseClick}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
      <Button
        size='lg'
        shadow='sm'
        leftIcon={<Icon as={RepeatIcon} />}
        variant='solid'
        bg='white'
        borderRadius='full'
        border='1px'
        borderColor='gray.200'
        aria-label='Restart Loop'
        onClick={restartLoop}
      >
        Restart Loop
      </Button>
    </HStack>
  );
};

export default PlaybackControls;