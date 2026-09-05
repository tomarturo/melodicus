import React, { useCallback, useState } from 'react';
import { Box, Menu, MenuButton, MenuList, MenuItem, Portal } from '@chakra-ui/react';
import useWaveformTimeline from './hooks/useWaveformTimeline';

const WaveformTimeline = ({
  videoLength,
  currentTime,
  startTime,
  endTime,
  savedSections,
  onSeek,
  onRangeChange,
  onRangeChangeEnd,
  onJumpToSection,
  onEditSection,
  onDeleteSection,
}) => {
  // Section labels live inside the renderer's shadow root, where a Chakra Menu
  // can't follow them. They report the caret's viewport position instead, and
  // one menu out here is anchored to it - a single instance rather than one per
  // section, keeping the Edit/Delete affordance the pills used to provide.
  const [menu, setMenu] = useState(null);

  const handleSectionMenu = useCallback((section, x, y) => {
    setMenu({ section, x, y });
  }, []);

  const { containerRef, timelineRef } = useWaveformTimeline({
    duration: videoLength,
    currentTime,
    loopStart: startTime,
    loopEnd: endTime,
    sections: savedSections,
    onSeek,
    onLoopChange: onRangeChange,
    onLoopChangeEnd: onRangeChangeEnd,
    onJumpToSection,
    onSectionMenu: handleSectionMenu,
  });

  const closeMenu = useCallback(() => setMenu(null), []);

  return (
    <Box py={4} px={8} bg="#FAF9F6">
      <Box ref={timelineRef} mb={1} />
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
          <MenuList minW="0" w="120px" py="1" boxShadow="md" borderColor="transparent">
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
