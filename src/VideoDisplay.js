import React, { useState } from 'react';
import { Box, AbsoluteCenter } from '@chakra-ui/react';
import LoopSelector from './LoopSelector';

const VideoDisplay = ({ videoThumbnail }) => {

  return (
    <Box
      pos='relative'
      h={["45vh", "50vh", "55vh"]}
      inset="0"
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
      }}
    >
      <AbsoluteCenter
        axis="horizontal"
        top={[6, 8, 8, 10, ]}
        h={[250, 280, 320]}
        w={[250, 280, 320]}
        borderRadius='md'
        backgroundImage={videoThumbnail}
        backgroundPosition="center"
        backgroundSize='cover'
        backgroundRepeat='no-repeat'
        boxShadow='xl'
      />
    </Box>
  );
};

export default VideoDisplay;