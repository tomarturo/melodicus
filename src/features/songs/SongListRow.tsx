import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, Heading, Image, Stack, Text } from '@chakra-ui/react';

interface SongListRowProps {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  /** One muted line under the title, e.g. the channel or the loop count. */
  meta?: ReactNode;
  /** Anything under that, e.g. loop or saved pills. */
  children?: ReactNode;
  /** At the row's end, e.g. a menu. */
  trailing?: ReactNode;
}

/**
 * A song in a list: its 16:9 thumbnail and title, both leading to the video.
 * Shared by My songs and the search results so the two lists match.
 */
const SongListRow = ({ videoId, title, thumbnailUrl, meta, children, trailing }: SongListRowProps) => (
  <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} gap={{ base: 3, sm: 6 }}>
    <Box as={Link} to={`/video/${videoId}`} flexShrink={0} aria-hidden tabIndex={-1}>
      {/* The whole 16:9 thumbnail, uncropped. For music uploads YouTube
          pads the square cover art with a blurred copy of it, which a
          square crop would cut away. */}
      <Image
        borderRadius="xl"
        w={{ base: '100%', sm: '240px' }}
        aspectRatio={16 / 9}
        bg="bg.muted"
        src={thumbnailUrl}
        alt=""
        objectFit="cover"
      />
    </Box>
    <Flex flex="1" minW="0" align="flex-start" gap={2}>
      <Stack flex="1" minW="0" spacing={2}>
        <Box>
          <Heading as="h2" size="md" noOfLines={2}>
            <Link to={`/video/${videoId}`}>{title}</Link>
          </Heading>
          {meta && (
            <Text fontSize="sm" color="fg.muted" mt={1} noOfLines={1}>
              {meta}
            </Text>
          )}
        </Box>
        {children}
      </Stack>
      {trailing}
    </Flex>
  </Flex>
);

export default SongListRow;

/** A small pill under a song's title, in the loop pills' purple. */
export const SongPill = ({ children }: { children: ReactNode }) => (
  <Flex
    as="li"
    align="center"
    h="24px"
    px={2.5}
    borderRadius="full"
    bg="purple.50"
    color="purple.800"
    border="1px"
    borderColor="purple.200"
    fontSize="xs"
    fontWeight="medium"
    whiteSpace="nowrap"
  >
    {children}
  </Flex>
);
