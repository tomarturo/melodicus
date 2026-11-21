import { Box, Button, Flex, Icon } from '@chakra-ui/react';
import { Pause, Play, Repeat } from '@phosphor-icons/react';
import PlaybackRateSelector from './PlaybackRateSelector';

interface VideoControlsProps {
  isPlaying: boolean;
  playbackRate: number;
  onPlayPause: () => void;
  onRestartLoop: () => void;
  onPlaybackRateChange: (rate: number) => void;
}

// Labels show from tablet width up; on phones the buttons are icons, so the
// whole row fits on one line.
const labelFromTablet = { base: 'none', md: 'inline' } as const;

/**
 * One centered row: Restart, Play/Pause, speed. Saving a loop happens in the
 * row under the timeline, sharing from the button over the video area.
 */
const VideoControls = ({ isPlaying, playbackRate, onPlayPause, onRestartLoop, onPlaybackRateChange }: VideoControlsProps) => (
  <Flex justify="center" align="center" gap={3} pt={2} pb={6} px={['12px', '12px', 8]}>
    <Button
      variant="pill"
      size="lg"
      aria-label="Restart Loop"
      leftIcon={<Icon as={Repeat} boxSize="20px" />}
      iconSpacing={{ base: 0, md: 2 }}
      px={{ base: 0, md: 6 }}
      minW={{ base: '48px', md: '128px' }}
      onClick={onRestartLoop}
    >
      <Box as="span" display={labelFromTablet}>
        Restart
      </Box>
    </Button>
    <Button
      variant="pill"
      size="lg"
      aria-label="Play or Pause"
      leftIcon={<Icon as={isPlaying ? Pause : Play} weight="fill" boxSize="22px" />}
      iconSpacing={{ base: 0, md: 2 }}
      px={{ base: 0, md: 6 }}
      // The biggest target, round on phones.
      minW={{ base: '56px', md: '128px' }}
      h="56px"
      onClick={onPlayPause}
    >
      <Box as="span" display={labelFromTablet}>
        {isPlaying ? 'Pause' : 'Play'}
      </Box>
    </Button>
    <PlaybackRateSelector rate={playbackRate} onRateChange={onPlaybackRateChange} />
  </Flex>
);

export default VideoControls;
