import React from 'react';
import { Box, AbsoluteCenter } from '@chakra-ui/react';
import LoopSelector from './LoopSelector';
import PositionedSections from './PositionedSections';

const VideoDisplay = ({ 
  videoThumbnail,
  videoLength,
  savedSections,
  onJumpToSection,
  onEditSection,
  onDeleteSection
}) => {
  return (
    <Box
      pos='relative'
      h={["45vh", "50vh", "55vh"]}
      inset="0"
      borderTopLeftRadius="xl"
      borderTopRightRadius="xl"
      backgroundImage={videoThumbnail}
      backgroundSize="11px 11px"
      backgroundRepeat="repeat"
      _before={{
        content: '""',
        position: 'absolute',
        inset: 0,
        backdropFilter: 'auto',
        backdropBlur: '8px',
        backdropInvert: '0.175',
        backdropContrast: '0.8',
        backdropSaturate: '1.7',
        borderTopLeftRadius: 'xl',
        borderTopRightRadius: 'xl',
      }}
    >
      <AbsoluteCenter
        axis="horizontal"
        top={[6, 8, 8, 10]}
        h={[280, 280, 320]}
        w={[280, 280, 320]}
        borderRadius='md'
        backgroundImage={videoThumbnail}
        backgroundPosition="center"
        backgroundSize='cover'
        backgroundRepeat='no-repeat'
        boxShadow='xl'
      />
      
      {/* Position the sections at the bottom of the container */}
      <Box
        position="absolute"
        bottom="0"
        left="0"
        right="0"
      >
        {videoLength && (
          <PositionedSections
            sections={savedSections}
            videoLength={videoLength}
            onJumpToSection={onJumpToSection}
            onEditSection={onEditSection}
            onDeleteSection={onDeleteSection}
          />
        )}
      </Box>
    </Box>
  );
};

export default VideoDisplay;