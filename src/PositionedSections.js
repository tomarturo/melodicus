import React from 'react';
import { Box, Button, Menu, MenuButton, MenuItem, MenuList, IconButton, Text, Tooltip, Flex } from '@chakra-ui/react';
import { ArrowUpIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

const PositionedSections = ({ 
  sections, 
  videoLength, 
  onJumpToSection, 
  onEditSection, 
  onDeleteSection 
}) => {
  if (!videoLength || sections.length === 0) return null;

  return (
    <Box 
      position="relative" 
      width="100%" 
      height="32px"
    >
      {sections.map((section) => {
        // Calculate middle point of the section
        const sectionMidpoint = (section.start_time + section.end_time) / 2;
        // Calculate position as percentage of video length using the midpoint
        const position = (section.start_time / videoLength) * 100;
        const stackIndex = (10) + 1;
        
        return (
        <Tooltip
            placement="top-start"
            label={`${formatTime(section.start_time)} - ${formatTime(section.end_time)}`}
            bg="blackAlpha.700"
        >
          <Box
            key={section.id}
            position="absolute"
            left={`${position}%`}
            bg="whiteAlpha.700"
            transform="translateX(-50%)"
            zIndex={stackIndex}
            borderRadius="full"
            px='4' 
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
                <Menu>
                  <MenuButton
                    variant="ghost"
                    size="xs"
                  >
                    <ChevronDownIcon />
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => onEditSection(section)}>
                      Edit
                    </MenuItem>
                    <MenuItem onClick={() => onDeleteSection(section.id)}>
                      Delete
                    </MenuItem>
                  </MenuList>
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