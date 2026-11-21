import { useState } from 'react';
import { Box, Flex, Icon, IconButton } from '@chakra-ui/react';
import { MagnifyingGlassPlus, MagnifyingGlassMinus } from '@phosphor-icons/react';
import useWaveformTimeline from './useWaveformTimeline';
import LoopPills from './LoopPills';
import LoopSelectionBar from './LoopSelectionBar';
import { selectionStatus } from '../selection';
import { ZOOM_LEVELS, drawableSections } from './timelineLogic';
import { usePlayerState } from '../usePlayer';
import type { PlayerController } from '../playerController';
import type { Section } from '../../sections/types';

interface WaveformTimelineProps {
  controller: PlayerController;
  videoLength: number;
  savedSections: Section[];
  onEditSection: (section: Section) => void;
  onDeleteSection: (sectionId: string) => void;
  /** Save the current selection as a new loop (opens the naming dialog). */
  onSaveLoop: () => void;
  /** Move a saved loop to the current selection. */
  onUpdateLoop: (section: Section) => void;
  isSavingLoop: boolean;
}

const zoomButtonStyle = {
  size: 'xs',
  minW: '24px',
  h: '24px',
  bg: 'ink',
  color: 'white',
  borderRadius: 'md',
  _hover: { bg: 'ink.hover' },
  _active: { bg: 'ink.active' },
  // Disabled: the white icon stays, the dark square lightens.
  _disabled: { opacity: 1, bg: 'blackAlpha.400', color: 'white', cursor: 'not-allowed' },
  sx: { '&:disabled:hover': { bg: 'blackAlpha.400' } },
} as const;

const WaveformTimeline = ({
  controller,
  videoLength,
  savedSections,
  onEditSection,
  onDeleteSection,
  onSaveLoop,
  onUpdateLoop,
  isSavingLoop,
}: WaveformTimelineProps) => {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const { loop, hasCustomLoop, loopOrigin } = usePlayerState(controller);
  const status = selectionStatus({ loop, hasCustomLoop, loopOrigin, sections: savedSections });
  // A saved loop stays marked while its edges are being edited, so the pill
  // shows which loop Update and Reset refer to.
  const activeSectionId = status.kind === 'saved' || status.kind === 'modified' ? status.section.id : null;
  const { containerRef, zoomIndex, setZoomIndex } = useWaveformTimeline({
    controller,
    duration: videoLength,
    sections: savedSections,
    highlightedSectionId: highlightedId,
  });

  const hasLoops = drawableSections(savedSections).length > 0;

  return (
    <Box py={4} px={8} flexShrink={0}>
      {hasLoops && (
        <Flex align="flex-start" gap={4} mb={2}>
          <LoopPills
            sections={savedSections}
            activeSectionId={activeSectionId}
            onSelectSection={(section) => controller.jumpToLoop(section.start_time, section.end_time, section.id)}
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
      <LoopSelectionBar
        status={status}
        isBusy={isSavingLoop}
        onSaveNew={onSaveLoop}
        onCancel={() => controller.clearLoop()}
        onReset={(section) => controller.resetLoop(section.start_time, section.end_time, section.id)}
        onUpdate={onUpdateLoop}
      />
    </Box>
  );
};

export default WaveformTimeline;
