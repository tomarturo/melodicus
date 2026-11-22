import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Text,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import { DotsThree, MusicNotes, Trash } from '@phosphor-icons/react';
import { useAuth } from './contexts/AuthContext';
import { errorCause, errorMessage } from './lib/errors';
import { useNotify } from './lib/notify';
import { useDeleteSavedSong, useSavedSongsQuery } from './features/sections/queries';
import type { SavedSongWithLoops } from './features/sections/types';
import AuthModal from './AuthModal';
import SongListRow, { SongPill } from './features/songs/SongListRow';

// How long a removed song can be brought back before it's really deleted.
const UNDO_MS = 5000;
// Loop names shown on a song before the rest are summed up as "+N".
const MAX_LOOP_CHIPS = 4;

const formatSavedDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const countLabel = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// The repertoire grid: one tile per song, filled for the songs saved so far.
// Fewer tiles where the banner is narrower: a row of three on phones, a 2x2
// beside the text on tablets, 3x2 from laptops up.
const REPERTOIRE_GRID = {
  base: { columns: 3, tiles: 3 },
  md: { columns: 2, tiles: 4 },
  lg: { columns: 3, tiles: 6 },
} as const;

const RepertoireTile = ({ filled }: { filled: boolean }) => (
  <Flex
    align="center"
    justify="center"
    boxSize="48px"
    borderRadius="lg"
    {...(filled
      ? { bg: 'purple.700', color: 'white' }
      : { border: '2px dashed', borderColor: 'purple.200', color: 'purple.300' })}
  >
    <Icon as={MusicNotes} boxSize="24px" />
  </Flex>
);

/**
 * For guests: a grid that starts to fill as songs are saved, and the way to
 * keep them. Their songs live only in this browser until they have an account.
 */
const RepertoireBanner = ({
  songCount,
  onCreateAccount,
  onLogIn,
}: {
  songCount: number;
  onCreateAccount: () => void;
  onLogIn: () => void;
}) => {
  const grid = useBreakpointValue(REPERTOIRE_GRID) ?? REPERTOIRE_GRID.base;
  // Always leave at least one empty tile: there's room for more.
  const filled = Math.min(songCount, grid.tiles - 1);
  return (
    <Flex
      // A centered column on phones; side by side from tablets up.
      direction={{ base: 'column', md: 'row' }}
      align="center"
      textAlign={{ base: 'center', md: 'left' }}
      gap={{ base: 5, md: 6, lg: 8 }}
      p={{ base: 5, md: 6, lg: 8 }}
      bg="bg.surface"
      border="1px"
      borderColor="border.default"
      borderRadius="2xl"
    >
      <Box
        display="grid"
        gridTemplateColumns={`repeat(${grid.columns}, 48px)`}
        gap={2}
        flexShrink={0}
        aria-hidden
      >
        {Array.from({ length: grid.tiles }, (_, index) => (
          <RepertoireTile key={index} filled={index < filled} />
        ))}
      </Box>
      <Box flex="1" minW="0">
        <Heading as="h2" size="md" color="fg.strong" mb={1}>
          Build your repertoire.
        </Heading>
        <Text color="fg.muted">Create a free account to save your songs and loops.</Text>
      </Box>
      <Stack spacing={3} align="center" flexShrink={0} w={{ base: '100%', md: 'auto' }}>
        <Button variant="loud" size="md" px={6} w={{ base: '100%', md: 'auto' }} onClick={onCreateAccount}>
          Create account
        </Button>
        <Button
          variant="link"
          color="fg.strong"
          fontWeight="semibold"
          textDecoration="underline"
          textUnderlineOffset="3px"
          onClick={onLogIn}
        >
          Log in
        </Button>
      </Stack>
    </Flex>
  );
};

/** A song's loops by name, as small pills like the ones above the timeline. */
const LoopChips = ({ loops }: { loops: SavedSongWithLoops['loops'] }) => {
  const shown = loops.slice(0, MAX_LOOP_CHIPS);
  const rest = loops.length - shown.length;
  return (
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
  );
};

const SongRow = ({ song, onRemove }: { song: SavedSongWithLoops; onRemove: () => void }) => {
  const title = song.title || 'Untitled video';
  return (
    <SongListRow
      videoId={song.videoId}
      title={title}
      thumbnailUrl={`https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`}
      meta={`${countLabel(song.loops.length, 'loop', 'loops')} · Saved ${formatSavedDate(song.savedAt)}`}
      trailing={
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
      }
    >
      {song.loops.length > 0 && <LoopChips loops={song.loops} />}
    </SongListRow>
  );
};

const SavedSongs = () => {
  const { user } = useAuth();
  const notify = useNotify();
  const authDialog = useDisclosure();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    authDialog.onOpen();
  };
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
      icon: { as: Trash, color: 'white' },
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
      <Container w="100%" maxW="3xl" pt={{ base: 6, md: 12 }} pb="8">
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
          {!user && (
            <RepertoireBanner
              songCount={songs.length}
              onCreateAccount={() => openAuth('signup')}
              onLogIn={() => openAuth('login')}
            />
          )}
          {content}
        </Stack>
      </Container>
      <AuthModal isOpen={authDialog.isOpen} onClose={authDialog.onClose} initialMode={authMode} />
    </Flex>
  );
};

export default SavedSongs;
