import { useState } from 'react';
import { Box, Flex, Icon, IconButton } from '@chakra-ui/react';
import { MagnifyingGlassPlus, MagnifyingGlassMinus } from '@phosphor-icons/react';
import useWaveformTimeline from './useWaveformTimeline';
import LoopPills from './LoopPills';
import { ZOOM_LEVELS, activeLoopId, drawableSections } from './timelineLogic';
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

const zoomButtonStyle = {
  size: 'xs',
  minW: '24px',
  h: '24px',
  bg: 'black',
  color: 'white',
  borderRadius: 'md',
  _hover: { bg: 'gray.800' },
  _active: { bg: 'gray.700' },
  // Disabled: the white icon stays, the black square lightens.
  _disabled: { opacity: 1, bg: 'blackAlpha.400', color: 'white', cursor: 'not-allowed' },
  sx: { '&:disabled:hover': { bg: 'blackAlpha.400' } },
} as const;

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
  const { containerRef, zoomIndex, setZoomIndex } = useWaveformTimeline({
    controller,
    duration: videoLength,
    sections: savedSections,
    highlightedSectionId: highlightedId,
  });

  const hasLoops = drawableSections(savedSections).length > 0;

  return (
    <Box py={4} px={8} bg="bg.panel">
      {hasLoops && (
        <Flex align="flex-start" gap={4} mb={2}>
          <LoopPills
            sections={savedSections}
            activeSectionId={activeLoopId(savedSections, loop)}
            onJumpToSection={onJumpToSection}
            onEditSection={onEditSection}
            onDeleteSection={onDeleteSection}
            onHighlight={setHighlightedId}
          />
        </Flex>
      )}
      <Box position="relative">
        <Box ref={containerRef} />
        {/* Over the track's top-right corner, above wavesurfer's layers. */}
        <Flex position="absolute" top="1" right="1" gap="1" zIndex="docked">
          <IconButton
            {...zoomButtonStyle}
            aria-label="Zoom out"
            icon={<Icon as={MagnifyingGlassMinus} boxSize="14px" />}
            isDisabled={zoomIndex === 0}
            onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
          />
          <IconButton
            {...zoomButtonStyle}
            aria-label="Zoom in"
            icon={<Icon as={MagnifyingGlassPlus} boxSize="14px" />}
            isDisabled={zoomIndex === ZOOM_LEVELS.length - 1}
            onClick={() => setZoomIndex((index) => Math.min(ZOOM_LEVELS.length - 1, index + 1))}
          />
        </Flex>
      </Box>
    </Box>
  );
};

export default WaveformTimeline;
