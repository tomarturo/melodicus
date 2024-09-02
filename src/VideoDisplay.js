import React, { useState } from 'react';
import { Box, AbsoluteCenter } from '@chakra-ui/react';

const VideoDisplay = ({ videoThumbnail }) => {

  return (
    <Box
      pos='relative'
      w="100vw"
      h={["45vh", "50vh", "55vh", "70vh", "75vh"]}
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
        h={[250, 280, 320, 380, 450]}
        w={[250, 280, 320, 380, 450]}
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