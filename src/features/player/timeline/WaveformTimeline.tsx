import { useState } from 'react';
import { Box, Button, Flex, Icon, IconButton, Text } from '@chakra-ui/react';
import { Crosshair, MagnifyingGlassPlus, MagnifyingGlassMinus } from '@phosphor-icons/react';
import useWaveformTimeline from './useWaveformTimeline';
import LoopPills from './LoopPills';
import { ZOOM_LEVELS, activeLoopId } from './timelineLogic';
import { usePlayerState } from '../usePlayer';
import type { PlayerController } from '../playerController';
import type { Section } from '../../sections/types';

interface WaveformTimelineProps {
  controller: PlayerController;
  videoLength: number;
  savedSections: Section[];
  onJumpToSection: (start: number, end: number) => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (sectionId: string) => void;
}

const WaveformTimeline = ({
  controller,
  videoLength,
  savedSections,
  onJumpToSection,
  onEditSection,
  onDeleteSection,
}: WaveformTimelineProps) => {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const { loop } = usePlayerState(controller);
  const { containerRef, zoomIndex, setZoomIndex, isFollowing, follow } = useWaveformTimeline({
    controller,
    duration: videoLength,
    sections: savedSections,
    highlightedSectionId: highlightedId,
  });

  return (
    <Box py={4} px={8} bg="bg.panel">
      <Flex align="flex-start" gap={4} mb={2}>
        <LoopPills
          sections={savedSections}
          activeSectionId={activeLoopId(savedSections, loop)}
          onJumpToSection={onJumpToSection}
          onEditSection={onEditSection}
          onDeleteSection={onDeleteSection}
          onHighlight={setHighlightedId}
        />
        <Flex align="center" gap={1} ml="auto" flexShrink={0} h="30px">
          {!isFollowing && (
            <Button
              size="xs"
              variant="ghost"
              leftIcon={<Icon as={Crosshair} boxSize="14px" />}
              onClick={follow}
              mr={2}
            >
              Follow playhead
            </Button>
          )}
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Zoom out"
            icon={<Icon as={MagnifyingGlassMinus} boxSize="16px" />}
            isDisabled={zoomIndex === 0}
            onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
          />
          <Text fontSize="xs" color="fg.muted" minW="26px" textAlign="center">
            {ZOOM_LEVELS[zoomIndex]}x
          </Text>
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Zoom in"
            icon={<Icon as={MagnifyingGlassPlus} boxSize="16px" />}
            isDisabled={zoomIndex === ZOOM_LEVELS.length - 1}
            onClick={() => setZoomIndex((index) => Math.min(ZOOM_LEVELS.length - 1, index + 1))}
          />
        </Flex>
      </Flex>
      <Box ref={containerRef} />
    </Box>
  );
};

export default WaveformTimeline;
