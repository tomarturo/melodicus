import { Box, AbsoluteCenter } from '@chakra-ui/react';

const VideoDisplay = ({ videoThumbnail }: { videoThumbnail: string | null }) => {
  return (
    <Box
      pos='relative'
      // Takes whatever height the timeline and controls leave, down to a minimum.
      flex='1 1 0'
      minH='180px'
      backgroundImage={videoThumbnail ?? undefined}
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
        h={[240, 280, 280, 320, 320, 400, 700 ]}
        w={[240, 280, 280, 320, 320, 400, 700 ]}
        borderRadius='xl'
        backgroundImage={videoThumbnail ?? undefined}
        backgroundPosition="center"
        backgroundSize='cover'
        backgroundRepeat='no-repeat'
        boxShadow='xl'
      />
    </Box>
  );
};

export default VideoDisplay;