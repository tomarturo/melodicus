import { Box, Button, Grid, Icon } from '@chakra-ui/react';
import { PlusCircle } from '@phosphor-icons/react';
import PlaybackControls from './PlaybackControls';
import PlaybackRateSelector from './PlaybackRateSelector';
import ShareTimestamps from './ShareTimestamps';
import type { Section } from './features/sections/types';

interface VideoControlsProps {
  isPlaying: boolean;
  playbackRate: number;
  onPlayPause: () => void;
  onRestartLoop: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onNewLoop: () => void;
  videoId: string;
  savedSections: Section[];
}

/**
 * Each control is rendered once and placed by grid areas per screen size:
 *
 *   phone              tablet                    desktop
 *   [ transport ]      [transport]    [add]      [transport][speed] … [add][save]
 *   [   speed   ]      [  speed  ]   [save]
 *   [save] [add]
 *
 * (They used to be three separate copies, one per size, which meant three
 * speed selectors with their own state and three Save dialogs.)
 */
const VideoControls = ({
  isPlaying,
  playbackRate,
  onPlayPause,
  onRestartLoop,
  onPlaybackRateChange,
  onNewLoop,
  videoId,
  savedSections,
}: VideoControlsProps) => (
  <Grid
    pt={4}
    pb={8}
    px={['12px', '12px', 8]}
    gap={3}
    alignItems="center"
    templateAreas={[
      `"transport transport" "speed speed" "save add"`,
      `"transport transport" "speed speed" "save add"`,
      `"transport add" "speed save"`,
      `"transport speed . add save"`,
    ]}
    templateColumns={['1fr 1fr', '1fr 1fr', 'auto 1fr', 'auto auto 1fr auto auto']}
  >
    <Box gridArea="transport">
      <PlaybackControls isPlaying={isPlaying} playPauseClick={onPlayPause} restartLoop={onRestartLoop} />
    </Box>
    <Box gridArea="speed" justifySelf="center">
      <PlaybackRateSelector rate={playbackRate} onRateChange={onPlaybackRateChange} />
    </Box>
    <Box gridArea="add" justifySelf={['start', 'start', 'end', 'auto']}>
      <Button onClick={onNewLoop} leftIcon={<Icon as={PlusCircle} w="20px" h="20px" />} variant="pill" size="lg">
        Add loop
      </Button>
    </Box>
    <Box gridArea="save" justifySelf={['end', 'end', 'end', 'auto']}>
      <ShareTimestamps videoId={videoId} savedSections={savedSections} />
    </Box>
  </Grid>
);

export default VideoControls;
