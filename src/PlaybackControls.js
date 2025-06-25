import React from 'react';
import { HStack, Button, Icon } from '@chakra-ui/react';
import { PlayIcon, PauseIcon } from '@heroicons/react/20/solid';
import { Repeat } from 'lucide-react';

const PlaybackControls = ({ isPlaying, playPauseClick, restartLoop }) => {
  return (
    <HStack gap="2" justify="center">
      <Button
        width= "128px"
        size='lg'
        variant='filled'
        rounded='full'
        bg="blackAlpha.100"
        border="1px"
        color="blackAlpha.800"
        borderColor="blackAlpha.200"
        _hover={{
          boxShadow: "0 0 0 1px", boxShadowColor: "blackAlpha.800", bg: "blackAlpha.200", borderColor: "blackAlpha.700", color: "blackAlpha.900"
        }}
        aria-label='Play or Pause'
        leftIcon={isPlaying ? <Icon as={PauseIcon} /> : <Icon as={PlayIcon} />}
        onClick={playPauseClick}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
      <Button
        
        width= "128px"
        leftIcon={<Icon as={Repeat} />}
        size='lg'
        variant='filled'
        rounded='full'
        bg="blackAlpha.100"
        border="1px"
        color="blackAlpha.800"
        borderColor="blackAlpha.200"
        _hover={{
          boxShadow: "0 0 0 1px", boxShadowColor: "blackAlpha.800", bg: "blackAlpha.200", borderColor: "blackAlpha.700", color: "blackAlpha.900"
        }}
        aria-label='Restart Loop'
        onClick={restartLoop}
      >
        Restart
      </Button>
    </HStack>
  );
};

export default PlaybackControls;