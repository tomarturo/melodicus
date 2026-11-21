import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { DotsThree, Trash } from '@phosphor-icons/react';
import { useAuth } from './contexts/AuthContext';
import { errorCause, errorMessage } from './lib/errors';
import { useNotify } from './lib/notify';
import { useDeleteSavedSong, useSavedSongsQuery } from './features/sections/queries';
import type { SavedSongWithLoops } from './features/sections/types';
import AuthModal from './AuthModal';

// How long a removed song can be brought back before it's really deleted.
const UNDO_MS = 5000;
// Loop names shown on a song before the rest are summed up as "+N".
const MAX_LOOP_CHIPS = 4;

const formatSavedDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const countLabel = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * A small picture of the timeline: the track, the part played, and a loop with
 * its grips. The app's own visual language, as the banner's mark.
 */
const LoopGlyph = () => (
  <Box as="svg" viewBox="0 0 88 40" w="88px" h="40px" flexShrink={0} aria-hidden>
    <rect x="0" y="6" width="88" height="28" rx="6" fill="#EBEAE7" />
    <path d="M6 6h22v28H6a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z" fill="#D2D1CE" />
    <rect x="28" y="6" width="34" height="28" fill="rgba(128, 90, 213, 0.28)" />
    <rect x="28" y="6" width="2" height="28" fill="#553C9A" />
    <rect x="60" y="6" width="2" height="28" fill="#553C9A" />
    <rect x="25" y="14" width="8" height="12" rx="3" fill="#FFFFFF" stroke="#553C9A" strokeWidth="1.5" />
    <rect x="57" y="14" width="8" height="12" rx="3" fill="#FFFFFF" stroke="#553C9A" strokeWidth="1.5" />
  </Box>
);

/** For guests: their songs live in this browser only until they log in. */
const TemporarilySavedBanner = ({ onLogIn }: { onLogIn: () => void }) => (
  <Flex
    align="center"
    gap={4}
    wrap={{ base: 'wrap', sm: 'nowrap' }}
    p={4}
    bg="bg.surface"
    border="1px"
    borderColor="border.default"
    borderRadius="xl"
  >
    <LoopGlyph />
    <Box flex="1" minW="200px">
      <Text fontWeight="semibold" color="fg.strong">
        Temporarily saved
      </Text>
      <Text fontSize="sm" color="fg.muted">
        Log in to keep your songs and loops in your account.
      </Text>
    </Box>
    <Button variant="loud" size="sm" onClick={onLogIn} flexShrink={0}>
      Log in
    </Button>
  </Flex>
);

/** A song's loops by name, as small pills like the ones above the timeline. */
const LoopChips = ({ loops }: { loops: SavedSongWithLoops['loops'] }) => {
  const shown = loops.slice(0, MAX_LOOP_CHIPS);
  const rest = loops.length - shown.length;
  return (
    <Flex as="ul" aria-label="Loops" listStyleType="none" wrap="wrap" gap={1.5}>
      {shown.map((loop, index) => (
        <Flex
          as="li"
          key={`${loop.start_time}-${index}`}
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
          {loop.name || 'Unnamed'}
        </Flex>
      ))}
      {rest > 0 && (
        <Flex as="li" align="center" h="24px" px={1} fontSize="xs" color="fg.muted">
          +{rest} more
        </Flex>
      )}
    </Flex>
  );
};

const SongRow = ({ song, onRemove }: { song: SavedSongWithLoops; onRemove: () => void }) => {
  const title = song.title || 'Untitled video';
  return (
    <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} gap={{ base: 3, sm: 6 }}>
      <Box as={Link} to={`/video/${song.videoId}`} flexShrink={0} aria-hidden tabIndex={-1}>
        {/* The whole 16:9 thumbnail, uncropped. For music uploads YouTube
            pads the square cover art with a blurred copy of it, which a
            square crop would cut away. */}
        <Image
          borderRadius="xl"
          w={{ base: '100%', sm: '240px' }}
          aspectRatio={16 / 9}
          src={`https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`}
          alt=""
          objectFit="cover"
        />
      </Box>
      <Flex flex="1" minW="0" align="flex-start" gap={2}>
        <Stack flex="1" minW="0" spacing={2}>
          <Box>
            <Heading as="h2" size="md" noOfLines={2}>
              <Link to={`/video/${song.videoId}`}>{title}</Link>
            </Heading>
            <Text fontSize="sm" color="fg.muted" mt={1}>
              {countLabel(song.loops.length, 'loop', 'loops')} · Saved {formatSavedDate(song.savedAt)}
            </Text>
          </Box>
          {song.loops.length > 0 && <LoopChips loops={song.loops} />}
        </Stack>
        <Menu isLazy placement="bottom-end" gutter={4}>
          <MenuButton
            as={IconButton}
            aria-label={`Options for ${title}`}
            icon={<Icon as={DotsThree} weight="bold" boxSize="20px" />}
            variant="ghost"
            size="sm"
            borderRadius="full"
            color="fg.muted"
            _hover={{ bg: 'bg.muted', color: 'fg.strong' }}
            _active={{ bg: 'bg.mutedHover' }}
          />
          <Portal>
            <MenuList minW="0" w="136px" py="1" boxShadow="md" borderColor="transparent" rootProps={{ zIndex: 'dropdown' }}>
              <MenuItem
                fontSize="14px"
                fontWeight="medium"
                color="red.700"
                icon={<Icon as={Trash} boxSize="16px" />}
                iconSpacing="2"
                _hover={{ bg: 'red.50', color: 'red.800' }}
                _focus={{ bg: 'red.50', color: 'red.800' }}
                onClick={onRemove}
              >
                Remove
              </MenuItem>
            </MenuList>
          </Portal>
        </Menu>
      </Flex>
    </Flex>
  );
};

const SavedSongs = () => {
  const { user } = useAuth();
  const notify = useNotify();
  const authDialog = useDisclosure();
  const songsQuery = useSavedSongsQuery();
  const deleteSong = useDeleteSavedSong();

  // A removed song hides at once but is only deleted once its Undo has expired.
  const [pending, setPending] = useState<string[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const commitRef = useRef<(videoId: string) => void>(() => {});
  commitRef.current = (videoId) => {
    timers.current.delete(videoId);
    deleteSong.mutate(videoId, {
      onSettled: () => setPending((ids) => ids.filter((id) => id !== videoId)),
      onError: (error) =>
        notify({
          tone: 'error',
          title: 'Couldn’t remove the song',
          description: errorCause(error),
          action: { label: 'Try again', onClick: () => commitRef.current(videoId) },
        }),
    });
  };

  // Leaving the page doesn't cancel a removal: it happens now instead of later.
  useEffect(() => {
    const pendingTimers = timers.current;
    return () => {
      pendingTimers.forEach((timer, videoId) => {
        clearTimeout(timer);
        commitRef.current(videoId);
      });
    };
  }, []);

  const handleRemove = (song: SavedSongWithLoops) => {
    setPending((ids) => [...ids, song.videoId]);
    timers.current.set(
      song.videoId,
      setTimeout(() => commitRef.current(song.videoId), UNDO_MS),
    );
    notify({
      title: `Removed “${song.title || 'Untitled video'}”`,
      duration: UNDO_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(timers.current.get(song.videoId));
          timers.current.delete(song.videoId);
          setPending((ids) => ids.filter((id) => id !== song.videoId));
        },
      },
    });
  };

  const songs = (songsQuery.data ?? []).filter((song) => !pending.includes(song.videoId));

  let content;
  if (songsQuery.isPending) {
    content = <Text color="fg.muted">Loading…</Text>;
  } else if (songsQuery.isError) {
    content = <Text>Could not load your saved songs: {errorMessage(songsQuery.error)}</Text>;
  } else if (songs.length === 0) {
    content = <Text color="fg.muted">No saved songs yet. Songs appear here when you save a loop.</Text>;
  } else {
    content = (
      <Stack as="ul" listStyleType="none" spacing={8}>
        {songs.map((song) => (
          <Box as="li" key={song.videoId}>
            <SongRow song={song} onRemove={() => handleRemove(song)} />
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Flex direction="column" flex="1" bg="bg.panel" borderRadius={['none', 'none', 'xl']} minH="0" overflowY="auto" overscrollBehavior="contain">
      <Container w="100%" pt={{ base: 6, md: 12 }} pb="8">
        <Stack spacing={6}>
          <Flex align="baseline" justify="space-between" gap={4}>
            <Heading as="h1" size="lg">
              My songs
            </Heading>
            {songs.length > 0 && (
              <Text fontSize="sm" color="fg.muted">
                {countLabel(songs.length, 'song', 'songs')}
              </Text>
            )}
          </Flex>
          {!user && <TemporarilySavedBanner onLogIn={authDialog.onOpen} />}
          {content}
        </Stack>
      </Container>
      <AuthModal isOpen={authDialog.isOpen} onClose={authDialog.onClose} />
    </Flex>
  );
};

export default SavedSongs;
