import React from 'react';
import { Box, AbsoluteCenter } from '@chakra-ui/react';

const VideoDisplay = ({ videoThumbnail }) => {
  return (
    <Box
      pos='relative'
      flexGrow='1'
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
        borderTopLeftRadius: { base: '0', md: 'xl' },
        borderTopRightRadius: { base: '0', md: 'xl' },
      }}
    >
      <AbsoluteCenter
        h={[240, 280, 280, 320, 320, 400, 700 ]}
        w={[240, 280, 280, 320, 320, 400, 700 ]}
        borderRadius='xl'
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