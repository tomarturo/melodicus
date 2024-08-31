import React from 'react';
import { Box, AbsoluteCenter } from '@chakra-ui/react';

const VideoDisplay = ({ videoThumbnail }) => {
  return (
    <Box
      pos='relative'
      w="100vw"
      h={["60vh", "70vh"]}
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
        h={[300, 400]}
        w={[300, 400]}
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