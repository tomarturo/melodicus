import { useCallback, useState } from 'react';
import { Box, Button, Flex, Icon, IconButton, Menu, MenuButton, MenuList, MenuItem, Portal, Text } from '@chakra-ui/react';
import { Crosshair, MagnifyingGlassPlus, MagnifyingGlassMinus } from '@phosphor-icons/react';
import useWaveformTimeline from './useWaveformTimeline';
import { ZOOM_LEVELS } from './timelineLogic';
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
  // Section labels live inside the renderer's shadow root, where a Chakra Menu
  // can't follow them. They report the caret's viewport position instead, and
  // one menu out here is anchored to it - a single instance rather than one per
  // section, keeping the Edit/Delete affordance the pills used to provide.
  const [menu, setMenu] = useState<{ section: Section; x: number; y: number } | null>(null);

  const handleSectionMenu = useCallback((section: Section, x: number, y: number) => {
    setMenu({ section, x, y });
  }, []);

  const { containerRef, zoomIndex, setZoomIndex, isFollowing, follow } = useWaveformTimeline({
    controller,
    duration: videoLength,
    sections: savedSections,
    onJumpToSection,
    onSectionMenu: handleSectionMenu,
  });

  const closeMenu = useCallback(() => setMenu(null), []);

  return (
    <Box py={4} px={8} bg="#FAF9F6">
      <Flex justify="flex-end" align="center" gap={1} mb={1}>
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
        <Text fontSize="xs" color="blackAlpha.700" minW="26px" textAlign="center">
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
      <Box ref={containerRef} />

      <Menu isOpen={!!menu} onClose={closeMenu} placement="bottom-start" gutter={4}>
        <MenuButton
          as={Box}
          position="fixed"
          left={`${menu?.x ?? 0}px`}
          top={`${menu?.y ?? 0}px`}
          w="1px"
          h="1px"
          opacity={0}
          pointerEvents="none"
          aria-hidden
        />
        <Portal>
          {/* wavesurfer's regions are stacked above Chakra's default menu z-index, which hid the top of the menu. */}
          <MenuList minW="0" w="120px" py="1" boxShadow="md" borderColor="transparent" rootProps={{ zIndex: 'dropdown' }}>
            <MenuItem
              fontSize="14px"
              fontWeight="medium"
              onClick={() => {
                if (menu) onEditSection(menu.section);
                closeMenu();
              }}
            >
              Edit
            </MenuItem>
            <MenuItem
              fontSize="14px"
              fontWeight="medium"
              color="red.700"
              _hover={{ bg: 'red.50', color: 'red.800' }}
              onClick={() => {
                if (menu) onDeleteSection(menu.section.id);
                closeMenu();
              }}
            >
              Delete
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    </Box>
  );
};

export default WaveformTimeline;
