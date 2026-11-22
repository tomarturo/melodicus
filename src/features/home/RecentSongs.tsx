import { Link as RouterLink } from 'react-router-dom';
import { Box, Flex, Heading, Image, Link, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { SongPill } from '../songs/SongListRow';
import { HOVER_EDGE, HOVER_RING } from '../../theme';
import type { SavedSongWithLoops } from '../sections/types';

/** Shown in place of the product story once someone has saved songs. */

const SHOWN = 3;
const MAX_LOOP_PILLS = 3;

const countLabel = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const formatSavedDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const SongCard = ({ song }: { song: SavedSongWithLoops }) => {
  const title = song.title || 'Untitled video';
  const shown = song.loops.slice(0, MAX_LOOP_PILLS);
  const rest = song.loops.length - shown.length;
  return (
    <Stack
      as={RouterLink}
      to={`/video/${song.videoId}`}
      spacing={3}
      p={3}
      h="100%"
      bg="bg.surface"
      border="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      transition="box-shadow .15s, border-color .15s"
      _hover={{ borderColor: HOVER_EDGE, boxShadow: HOVER_RING }}
      _focusVisible={{ outline: 'none', borderColor: HOVER_EDGE, boxShadow: HOVER_RING }}
    >
      <Image
        src={`https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`}
        alt=""
        aspectRatio={16 / 9}
        objectFit="cover"
        borderRadius="lg"
        bg="bg.muted"
      />
      <Box>
        <Heading as="h3" size="sm" color="fg.strong" noOfLines={2}>
          {title}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mt={1}>
          {countLabel(song.loops.length, 'loop', 'loops')} · Saved {formatSavedDate(song.savedAt)}
        </Text>
      </Box>
      {shown.length > 0 && (
        <Flex as="ul" aria-label="Loops" listStyleType="none" wrap="wrap" gap={1.5}>
          {shown.map((loop, index) => (
            <SongPill key={`${loop.start_time}-${index}`}>{loop.name || 'Unnamed'}</SongPill>
          ))}
          {rest > 0 && (
            <Flex as="li" align="center" h="24px" px={1} fontSize="xs" color="fg.muted">
              +{rest} more
            </Flex>
          )}
        </Flex>
      )}
    </Stack>
  );
};

const RecentSongs = ({ songs }: { songs: SavedSongWithLoops[] }) => (
  <Box as="section" aria-labelledby="recent-songs">
    <Flex align="baseline" justify="space-between" gap={4} mb={5}>
      <Heading id="recent-songs" as="h2" size="lg" color="fg.strong">
        Pick up where you left off
      </Heading>
      <Link as={RouterLink} to="/saved-songs" fontWeight="semibold" color="fg.default" whiteSpace="nowrap" flexShrink={0}>
        All my songs →
      </Link>
    </Flex>
    <SimpleGrid as="ul" listStyleType="none" columns={{ base: 1, md: 3 }} spacing={5}>
      {songs.slice(0, SHOWN).map((song) => (
        <Box as="li" key={song.videoId}>
          <SongCard song={song} />
        </Box>
      ))}
    </SimpleGrid>
  </Box>
);

export default RecentSongs;
