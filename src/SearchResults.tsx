import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
} from '@chakra-ui/react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import SearchQuotaError from './SearchQuotaError';
import HintRow from './components/HintRow';
import SongListRow, { SongPill } from './features/songs/SongListRow';
import { useSavedSongsQuery } from './features/sections/queries';
import { SearchQuotaExceededError, searchPath, searchVideos } from './lib/youtube';

const countLabel = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Grey stand-ins for rows while results load, the same shape as the real ones. */
const LoadingRows = () => (
  <Stack spacing={8} aria-busy="true" aria-label="Loading results">
    {[0, 1, 2].map((index) => (
      <Flex key={index} direction={{ base: 'column', sm: 'row' }} gap={{ base: 3, sm: 6 }} align={{ sm: 'center' }}>
        <Box w={{ base: '100%', sm: '240px' }} aspectRatio={16 / 9} bg="bg.muted" borderRadius="xl" flexShrink={0} />
        <Stack flex="1" spacing={2}>
          <Box h="20px" w="70%" bg="bg.muted" borderRadius="md" />
          <Box h="14px" w="35%" bg="bg.muted" borderRadius="md" />
        </Stack>
      </Flex>
    ))}
  </Stack>
);

const SearchResults = () => {
  const { query = '' } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(query);

  // The pro tip turns into an error when someone searches for nothing.
  const [isSearchValid, setIsSearchValid] = useState(true);
  const [searchErrorMessage, setSearchErrorMessage] = useState('');
  const [hasSearchSubmitAttempt, setHasSearchSubmitAttempt] = useState(false);

  // A new search from this page lands here again; start from its query.
  useEffect(() => {
    setDraft(query);
    setIsSearchValid(true);
    setHasSearchSubmitAttempt(false);
  }, [query]);

  // Cached for the session: going back to a search costs no quota.
  const search = useQuery({
    queryKey: ['youtube-search', query],
    queryFn: () => searchVideos(query),
    enabled: query.trim().length > 0,
    staleTime: Infinity,
    retry: false,
  });

  const savedSongs = useSavedSongsQuery();
  const loopsByVideo = useMemo(
    () => new Map((savedSongs.data ?? []).map((song) => [song.videoId, song.loops.length])),
    [savedSongs.data],
  );

  const handleSearch = () => {
    setHasSearchSubmitAttempt(true);
    if (!draft.trim()) {
      setIsSearchValid(false);
      setSearchErrorMessage('Please enter a song title & artist');
      return;
    }
    navigate(searchPath(draft));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleSearch();
  };

  if (search.error instanceof SearchQuotaExceededError) {
    return (
      <Flex direction="column" flex="1" bg="bg.panel" borderRadius={['none', 'none', 'xl']} minH="0" overflowY="auto" overscrollBehavior="contain">
        <SearchQuotaError query={query} />
      </Flex>
    );
  }

  let results;
  if (search.isPending) {
    results = <LoadingRows />;
  } else if (search.isError) {
    results = (
      <Stack align="center" spacing={3} py={8} textAlign="center">
        <Text color="fg.default">Couldn’t load results from YouTube.</Text>
        <Button variant="quiet" size="sm" onClick={() => void search.refetch()}>
          Try again
        </Button>
      </Stack>
    );
  } else if (search.data.length === 0) {
    results = (
      <Text color="fg.muted" textAlign="center" py={8}>
        No videos found. Try the song title and the artist’s name.
      </Text>
    );
  } else {
    results = (
      <Stack as="ul" listStyleType="none" spacing={8}>
        {search.data.map((video) => {
          const savedLoops = loopsByVideo.get(video.id.videoId);
          return (
            <Box as="li" key={video.id.videoId}>
              <SongListRow
                videoId={video.id.videoId}
                title={video.snippet.title}
                thumbnailUrl={video.snippet.thumbnails.medium.url}
                meta={video.snippet.channelTitle}
              >
                {savedLoops !== undefined && (
                  <Flex as="ul" aria-label="In My songs" listStyleType="none">
                    <SongPill>Saved · {countLabel(savedLoops, 'loop', 'loops')}</SongPill>
                  </Flex>
                )}
              </SongListRow>
            </Box>
          );
        })}
      </Stack>
    );
  }

  return (
    <Flex direction="column" flex="1" bg="bg.panel" borderRadius={['none', 'none', 'xl']} minH="0" overflowY="auto" overscrollBehavior="contain">
      <Container w="100%" maxW="3xl" pt={{ base: 8, md: 12 }} pb={12}>
        {/* The purple marks the query, so it needs no quotes. */}
        <Heading as="h1" size="md" fontWeight="semibold" mb={6} textAlign="center" sx={{ textWrap: 'balance' }}>
          Results for{' '}
          <Text as="span" color="purple.700">
            {query}
          </Text>
        </Heading>
        <InputGroup mb="2">
          <Input
            mb="1"
            rounded="full"
            variant="filled"
            bg="bg.muted"
            _hover={{ bg: 'bg.mutedHover' }}
            _focus={{ bg: 'bg.muted', borderColor: 'border.focus' }}
            pr="2.5rem"
            type="search"
            aria-label="Search YouTube"
            placeholder="Enter a song title & artist"
            _placeholder={{ opacity: 1, color: 'fg.placeholder' }}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            borderColor={!isSearchValid && hasSearchSubmitAttempt ? 'red.500' : 'transparent'}
          />
          <InputRightElement>
            <IconButton
              onClick={handleSearch}
              aria-label="Search YouTube"
              icon={<Icon as={MagnifyingGlass} boxSize="18px" />}
              isRound
              size="sm"
              color="fg.strong"
              bg="none"
              _hover={{ color: 'fg.onInverse', bg: 'bg.inverse' }}
            />
          </InputRightElement>
        </InputGroup>
        <Box mb={8}>
          <HintRow tone={isSearchValid ? 'tip' : 'error'} badge={isSearchValid ? 'pro tip' : 'try again'}>
            {isSearchValid ? 'Be specific. Include a title and artist.' : searchErrorMessage}
          </HintRow>
        </Box>
        {results}
      </Container>
    </Flex>
  );
};

export default SearchResults;
