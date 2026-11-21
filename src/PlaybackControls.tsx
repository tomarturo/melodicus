import { HStack, Button, Icon } from '@chakra-ui/react';
import { Play, Pause, Repeat } from '@phosphor-icons/react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  playPauseClick: () => void;
  restartLoop: () => void;
}

const PlaybackControls = ({ isPlaying, playPauseClick, restartLoop }: PlaybackControlsProps) => {
  return (
    <HStack gap="2" justify="center" w="full">
      <Button
        minW="128px"
        size='lg'
        variant='pill'
        aria-label='Play or Pause'
        leftIcon={isPlaying ? <Icon as={Pause} weight="fill" /> : <Icon as={Play} weight="fill" />}
        onClick={playPauseClick}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
      <Button
        minW="128px"
        leftIcon={<Icon as={Repeat} />}
        size='lg'
        variant='pill'
        aria-label='Restart Loop'
        onClick={restartLoop}
      >
        Restart
      </Button>
    </HStack>
  );
};

export default PlaybackControls;