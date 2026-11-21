import { useMemo, useSyncExternalStore } from 'react';
import { Box, Flex, Menu, MenuButton, MenuItem, MenuList, Portal } from '@chakra-ui/react';
import { formatSecondsToDuration } from '../../../utils/formatTime';
import type { Section } from '../../sections/types';
import { chipLeft, chipRows, drawableSections } from './timelineLogic';
import type { TrackLayout } from './useWaveformTimeline';

// Two staggered rows, so loops that sit close together on the track don't
// cover each other's names.
const ROWS = 2;
const ROW_HEIGHT = 22;

interface SectionChipLaneProps {
  sections: Section[];
  duration: number;
  subscribeLayout: (listener: () => void) => () => void;
  getLayout: () => TrackLayout;
  onJumpToSection: (start: number, end: number) => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (sectionId: string) => void;
}

/**
 * The saved loops' name pills, in a row above the timeline rather than on
 * the track, so they never cover the area where loops are dragged out. Each
 * pill starts where its loop starts (or at the left edge, while its loop is
 * partly scrolled away), and the row scrolls and zooms with the track.
 */
const SectionChipLane = ({
  sections,
  duration,
  subscribeLayout,
  getLayout,
  onJumpToSection,
  onEditSection,
  onDeleteSection,
}: SectionChipLaneProps) => {
  const { scrollLeft, contentWidth } = useSyncExternalStore(subscribeLayout, getLayout);
  const drawable = useMemo(() => drawableSections(sections), [sections]);
  const rows = useMemo(() => chipRows(drawable, ROWS), [drawable]);

  if (drawable.length === 0) return null;

  return (
    <Box position="relative" h={`${ROWS * ROW_HEIGHT}px`} overflow="hidden" mb="1" data-testid="loop-pills">
      <Box
        position="absolute"
        top="0"
        left="0"
        h="100%"
        w={`${contentWidth}px`}
        transform={`translateX(${-scrollLeft}px)`}
        visibility={contentWidth > 0 ? 'visible' : 'hidden'}
      >
        {drawable.map((section) => {
          const name = section.name || 'Unnamed';
          return (
            <Flex
              key={section.id}
              position="absolute"
              left={`${chipLeft(
                (section.start_time / duration) * contentWidth,
                (section.end_time / duration) * contentWidth,
                scrollLeft,
              )}px`}
              top={`${(rows.get(section.id) ?? 0) * ROW_HEIGHT}px`}
              align="center"
              h="20px"
              bg="purple.700"
              color="bg.panel"
              fontSize="11px"
              fontWeight="500"
              lineHeight="1"
              borderRadius="full"
              whiteSpace="nowrap"
              boxShadow="0 1px 2px rgba(0, 0, 0, 0.25)"
            >
              <Box
                as="button"
                type="button"
                title={`${formatSecondsToDuration(section.start_time)} – ${formatSecondsToDuration(section.end_time)}`}
                pl="9px"
                pr="2px"
                h="100%"
                onClick={() => onJumpToSection(section.start_time, section.end_time)}
              >
                {name}
              </Box>
              <Menu isLazy placement="bottom-start" gutter={4}>
                <MenuButton as={Box} role="button" aria-label={`Options for ${name}`} tabIndex={0} pl="4px" pr="8px" h="100%" cursor="pointer" display="flex" alignItems="center">
                  ⌄
                </MenuButton>
                <Portal>
                  <MenuList minW="0" w="120px" py="1" boxShadow="md" borderColor="transparent" rootProps={{ zIndex: 'dropdown' }}>
                    <MenuItem fontSize="14px" fontWeight="medium" onClick={() => onEditSection(section)}>
                      Edit
                    </MenuItem>
                    <MenuItem
                      fontSize="14px"
                      fontWeight="medium"
                      color="red.700"
                      _hover={{ bg: 'red.50', color: 'red.800' }}
                      onClick={() => onDeleteSection(section.id)}
                    >
                      Delete
                    </MenuItem>
                  </MenuList>
                </Portal>
              </Menu>
            </Flex>
          );
        })}
      </Box>
    </Box>
  );
};

export default SectionChipLane;
