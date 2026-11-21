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
      overflow="hidden"
      // Shown until a thumbnail loads, or if there is none.
      bg="#4B4B4E"
    >
      {/* The backdrop: the thumbnail scaled to cover the area and blurred.
          It extends past the edges so the blur doesn't fade out at them. */}
      {videoThumbnail && (
        <Box
          position="absolute"
          inset="-15%"
          backgroundImage={videoThumbnail}
          backgroundSize="cover"
          backgroundPosition="center"
          filter="blur(40px) saturate(1.3) brightness(0.8)"
          aria-hidden
          data-testid="video-backdrop"
        />
      )}
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