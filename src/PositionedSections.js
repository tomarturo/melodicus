import React, { useMemo } from 'react';
import { AbsoluteCenter, Center, Box, Button, Menu, MenuButton, MenuItem, MenuList, Text, Tooltip, Flex, Divider, Icon } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';


const PositionedSections = ({
  sections,
  videoLength,
  onJumpToSection,
  onEditSection,
  onDeleteSection
}) => {
  // Calculate positioned sections with row assignments
  const positionedSections = useMemo(() => {
    if (!videoLength || sections.length === 0) return [];

    // Sort sections by start time for consistent stacking
    const sortedSections = [...sections].sort((a, b) => a.start_time - b.start_time);

    const result = [];
    const rowOccupancy = []; // Tracks occupied positions for each row

    sortedSections.forEach(section => {
      // Calculate position as percentage of video length
      const position = (section.start_time / videoLength) * 100;

      // Set a minimum position value to prevent overflow - FIXED to handle beginning sections
      // For all sections, we use a consistent minimum to ensure they're all positioned correctly
      const adjustedPosition = Math.max(position, 2); // Minimum 4% for all sections for consistency

      // Calculate the rough visual width of the marker (approximation)
      // This is a rough estimate - adjust based on your actual UI
      const labelWidth = ((section.name || 'Unnamed').length * 8) + 40; // Chars × avg char width + padding
      const widthPercentage = (labelWidth / (videoLength * 10)) * 100; // Rough conversion to percentage width

      // Calculate the left and right bounds of the marker
      const markerStart = adjustedPosition - (widthPercentage / 2);
      const markerEnd = adjustedPosition + (widthPercentage / 2);

      // Try each row starting from the bottom (row 0)
      let selectedRow = null;

      // First check if the section fits in any existing row, starting from row 0
      for (let row = 0; row < rowOccupancy.length; row++) {
        let hasOverlap = false;

        // Check if this section overlaps with any markers in this row
        for (const occupied of rowOccupancy[row]) {
          // Check for overlap
          if (
            (markerStart >= occupied.start && markerStart <= occupied.end) ||
            (markerEnd >= occupied.start && markerEnd <= occupied.end) ||
            (markerStart <= occupied.start && markerEnd >= occupied.end)
          ) {
            hasOverlap = true;
            break;
          }
        }

        // If there's no overlap in this row, use it
        if (!hasOverlap) {
          selectedRow = row;
          break;
        }
      }

      // If no existing row works, create a new row
      if (selectedRow === null) {
        selectedRow = rowOccupancy.length;
        rowOccupancy[selectedRow] = [];
      }

      // Mark this position as occupied in the chosen row
      rowOccupancy[selectedRow].push({
        start: markerStart,
        end: markerEnd
      });

      // Add the section with its row assignment
      result.push({
        ...section,
        row: selectedRow,
        position: adjustedPosition
      });
    });

    return result;
  }, [sections, videoLength]);

  // Calculate total height needed
  const totalRows = positionedSections.reduce(
    (max, section) => Math.max(max, section.row + 1),
    0
  );

  const rowHeight = 32; // Height of each row in pixels

  if (positionedSections.length === 0) return null;

  return (
    <Box
      position="relative"
      width="100%"
      height={`${totalRows * rowHeight}px`}
      display="flex"
      flexDirection="column-reverse"
      mb="2"
    >
      {positionedSections.map((section) => {
        // Adjust the transform based on position to keep it within bounds
        // Use consistent transform values based on position only
        const transformValue = section.position < 8
          ? 'translateX(0)' // Left align for beginning sections up to 8%
          : section.position > 98
            ? 'translateX(-100%)' // Right align if at right edge
            : 'translateX(-50%)'; // Normal centering for everything else

        // Base z-index + row to ensure higher rows appear above lower ones
        // We use 10 as base z-index, and higher rows get higher z-index by default
        const stackIndex = 10 + section.row;

        return (
          <Tooltip
            key={section.id}
            placement="bottom"
            label={`${formatTime(section.start_time)} - ${formatTime(section.end_time)}`}
            bg="blackAlpha.500"
            rounded="md"
            zIndex={90} 
            position="relative"
          >
            <Box
              position="absolute"
              left={`${section.position}%`}
              // Adjust top position so row 0 is at the bottom and higher rows go upward
              bottom={`0px`}
              top={`auto`}
              marginBottom={`${section.row * rowHeight}px`}
              bg="whiteAlpha.900"
              boxShadow="md"
              transform={transformValue}
              zIndex={stackIndex}
              borderRadius="full"
              border="1px"
              borderColor="blackAlpha.300"
              pl='3'
              transition="transform 0.2s ease"
              _hover={{
                bg: `#ffffff`,
                transform: `${transformValue} translateY(-2px)`,
                zIndex: 100
              }}
            >
              <Flex
                alignItems="center"
              >
                <Button
                  size="xs"
                  variant="unstyled"
                  onClick={() => onJumpToSection(section.start_time, section.end_time)}
                >
                  <Text>
                    {section.name || 'Unnamed'}
                  </Text>
                </Button>
                <Center h="6" pl="2">
                  <Divider 
                    orientation="vertical" 
                    borderColor="blackAlpha.500"
                  />
                </Center>
                <Menu placement="top" autoSelect={false} gutter={12}>
                  <MenuButton
                    variant="ghost"
                    size="xs"
                    zIndex={102}
                  >
                    <Flex px="2" align justify>
                      <ChevronDownIcon style={{ width: '18px', height: '18px' }} />
                    </Flex>
                  </MenuButton>
                  <AbsoluteCenter>
                    <MenuList
                      zIndex={103}
                      minW="0" w="100px"
                      sx={{
                        borderColor: 'transparent',
                        padding: '4px',
                        boxShadow: 'md'
                      }}
                    >
                      <MenuItem
                        onClick={() => onEditSection(section)}
                        sx={{
                          color: 'blackAlpha.800',
                          fontSize: '14px',
                          fontWeight: 'medium',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          margin: '0 0 4px 0',
                          _hover: {
                            bg: 'blackAlpha.100',
                            color: 'blackAlpha.900',
                          }
                        }}
                      >
                        Edit
                      </MenuItem>
                      <MenuItem
                        onClick={() => onDeleteSection(section.id)}
                        sx={{
                          fontWeight: 'medium',
                          fontSize: '14px',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          color: 'red.700',
                          _hover: {
                            bg: 'red.50',
                            color: 'red.800',
                          }
                        }}
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </AbsoluteCenter>
                </Menu>
              </Flex>
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default PositionedSections;