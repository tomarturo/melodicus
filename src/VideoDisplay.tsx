import { Box } from '@chakra-ui/react';

const VideoDisplay = ({ videoThumbnail }: { videoThumbnail: string | null }) => {
  return (
    <Box
      pos='relative'
      // Takes whatever height the timeline and controls leave, down to a minimum.
      flex='1 1 0'
      minH='180px'
      // Lets the album art size itself from this box's width and height.
      sx={{ containerType: 'size' }}
      data-testid="video-display"
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
      {/* The album art: a square sized from this box's own dimensions (cq
          units), so it always fits whatever height the video area gets. */}
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        w="min(80cqh, 80cqw, 700px)"
        sx={{ aspectRatio: '1' }}
        borderRadius="xl"
        backgroundImage={videoThumbnail ?? undefined}
        backgroundPosition="center"
        backgroundSize="cover"
        backgroundRepeat="no-repeat"
        boxShadow="xl"
        data-testid="album-art"
      />
    </Box>
  );
};

export default VideoDisplay;