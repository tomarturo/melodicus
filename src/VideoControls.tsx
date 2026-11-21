import { Box, Button, Flex, Icon } from '@chakra-ui/react';
import { Pause, Play, SkipBack } from '@phosphor-icons/react';
import PlaybackRateSelector, { CONTROL_HEIGHT } from './PlaybackRateSelector';

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

// Play is a step up from the rest of the row (CONTROL_HEIGHT).
const PLAY_HEIGHT = '48px';
// Restart and Play/Pause share one width on desktop: Restart's, the longer label.
const LABELLED_MIN_WIDTH = '124px';

/**
 * One centered row: Restart, Play/Pause, speed. Saving a loop happens in the
 * row under the timeline, sharing from the button over the video area.
 */
const VideoControls = ({ isPlaying, playbackRate, onPlayPause, onRestartLoop, onPlaybackRateChange }: VideoControlsProps) => (
  <Flex justify="center" align="center" gap={3} pt={2} pb={5} px={{ base: 4, md: 5 }}>
    <Button
      variant="pill"
      size="md"
      aria-label="Restart Loop"
      leftIcon={<Icon as={SkipBack} weight="fill" boxSize="18px" />}
      iconSpacing={{ base: 0, md: 2 }}
      px={{ base: 0, md: 5 }}
      h={CONTROL_HEIGHT}
      minW={{ base: CONTROL_HEIGHT.base, md: LABELLED_MIN_WIDTH }}
      onClick={onRestartLoop}
    >
      <Box as="span" display={labelFromTablet}>
        Restart
      </Box>
    </Button>
    <Button
      variant="pill"
      size="md"
      aria-label="Play or Pause"
      leftIcon={<Icon as={isPlaying ? Pause : Play} weight="fill" boxSize="20px" />}
      iconSpacing={{ base: 0, md: 2 }}
      px={{ base: 0, md: 5 }}
      // The biggest target, round on phones.
      minW={{ base: PLAY_HEIGHT, md: LABELLED_MIN_WIDTH }}
      h={PLAY_HEIGHT}
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
