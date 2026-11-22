import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';
import { ArrowForwardIcon, SearchIcon } from '@chakra-ui/icons';
import { Icon, IconButton, Container, Heading, Text, Input, InputGroup, InputRightElement, Tabs, TabList, TabIndicator, TabPanels, Tab, TabPanel, VStack, Flex, Link } from '@chakra-ui/react'
import { ArrowUpRight } from '@phosphor-icons/react';
import { searchPath } from './lib/youtube';
import HintRow from './components/HintRow';
import HomeStory from './features/home/HomeStory';
import RecentSongs from './features/home/RecentSongs';
import { useSavedSongsQuery } from './features/sections/queries';

const HomePage = () => {
  const navigate = useNavigate();
  const [videoLink, setVideoLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLinkValid, setIsLinkValid] = useState(true);
  const [linkErrorMessage, setLinkErrorMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isSearchValid, setIsSearchValid] = useState(true);
  const [searchErrorMessage, setSearchErrorMessage] = useState('');
  const [hasSearchSubmitAttempt, setHasSearchSubmitAttempt] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // The call to action at the bottom: back up to the song search, ready to type.
  const goToSearch = () => {
    setTabIndex(0);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panelRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    // After the tab switch renders; the panel does the scrolling, not the focus.
    requestAnimationFrame(() => searchInputRef.current?.focus({ preventScroll: true }));
  };
  const savedSongs = useSavedSongsQuery();
  const songs = savedSongs.data ?? [];

  // YouTube URL validation function
  const validateYouTubeUrl = (url: string) => {
    if (!url.trim()) return true; // Empty input is valid (for UX purposes)

    // Common YouTube URL patterns
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(&.*)?$/,  // Standard watch URLs
      /^https?:\/\/(www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(\?.*)?$/,            // Shortened youtu.be URLs
      /^https?:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(\?.*)?$/,  // Embed URLs
      /^https?:\/\/(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(\?.*)?$/, // YouTube Shorts
    ];

    // Check URL against patterns
    return patterns.some(pattern => pattern.test(url));
  };


  const handleSearch = () => {
    setHasSearchSubmitAttempt(true);

    // Check if search query is empty
    if (!searchQuery.trim()) {
      setIsSearchValid(false);
      setSearchErrorMessage('Please enter a song title & artist');
      return;
    }

    // If we have a search query, proceed with navigation
    localStorage.setItem('recentSearchQuery', searchQuery);
    navigate(searchPath(searchQuery));
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (event.currentTarget.value === videoLink) {
        handleLinkSubmit();
      } else {
        handleSearch();
      }
    }
  };

  const handleLinkChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVideoLink(value);

    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set a new timeout - validate after 800ms of no typing
    const timeout = setTimeout(() => {
      if (value.trim() !== '') {
        const valid = validateYouTubeUrl(value);
        setIsLinkValid(valid);
        setLinkErrorMessage(valid ? '' : 'Please enter a valid YouTube link');
      } else {
        setIsLinkValid(true);
        setLinkErrorMessage('');
      }
    }, 800);

    setTypingTimeout(timeout);
  };

  const handleLinkSubmit = () => {
    // If empty, show error
    if (!videoLink.trim()) {
      setIsLinkValid(false);
      setLinkErrorMessage('Please enter a valid YouTube link');
      return;
    }

    // Validate before navigating
    if (validateYouTubeUrl(videoLink)) {
      const videoId = getYoutubeID(videoLink);
      if (videoId) {
        navigate(`/video/${videoId}`);
      } else {
        setIsLinkValid(false);
        setLinkErrorMessage('Could not extract YouTube video ID');
      }
    } else {
      setIsLinkValid(false);
      setLinkErrorMessage('Please enter a valid YouTube link');
    }
  };

  return (
    <>
      <Flex ref={panelRef} direction="column" flex="1" pt='12' bg='bg.panel' borderRadius={['none', 'none', 'xl']} minH="0" overflowY="auto" overscrollBehavior="contain">
        <Container maxW='3xl'>
          <VStack>
            <Flex mb='12' gap={8} direction={'column'}>
              <Heading as='h1' size='3xl' color='fg.strong' textAlign="center">Learn the songs & licks you love</Heading>
              <Text fontSize='xl' color='fg.default' align="center">Any song on YouTube. Unlimited loops. Slow down the hard parts.</Text>
            </Flex>
            <Tabs
              index={tabIndex}
              onChange={setTabIndex}
              w='100%'
              align='center'
              isFitted maxW='2xl'>
              <TabList
                borderBottomColor="blackAlpha.300">
                <Tab
                  color='fg.muted'
                  _selected={{ color: 'fg.default', fontWeight: 'semibold' }}
                >Find a song</Tab>
                <Tab
                  color='fg.muted'
                  _selected={{ color: 'fg.default', fontWeight: 'semibold' }}
                >Paste a link</Tab>
              </TabList>
              <TabIndicator
                mt="-1.5px"
                height="2px"
                bg="bg.inverseStrong"
                borderRadius="1px"
              />
              <TabPanels>
                <TabPanel px='0'>
                  <InputGroup size='md' mb='2'>
                    <Input
                      ref={searchInputRef}
                      rounded='full'
                      variant='filled'
                      bg="bg.muted"
                      _hover={{ bg: "bg.mutedHover" }}
                      _focus={{ bg: "bg.muted", borderColor: "border.focus" }}
                      pr='2rem'
                      mb='1'
                      type='text'
                      placeholder='Enter a song title & artist'
                      _placeholder={{ opacity: 1, color: 'fg.placeholder' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      borderColor={!isSearchValid && hasSearchSubmitAttempt ? "red.500" : "transparent"}
                    />
                    <InputRightElement>
                      <IconButton
                        onClick={handleSearch}
                        aria-label='Search'
                        icon={<SearchIcon />}
                        isRound
                        size='sm'
                        color="fg.strong"
                        bg="none"
                        _hover={{ color: 'fg.onInverse', bg: 'bg.inverse' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <HintRow tone={isSearchValid ? 'tip' : 'error'} badge={isSearchValid ? 'pro tip' : 'try again'}>
                        {isSearchValid ? (
                          'Be specific. Include a title and artist.'
                        ) : (
                          searchErrorMessage
                        )}
                      </HintRow>
                </TabPanel>
                <TabPanel px='0'>
                  <InputGroup size='md' mb='2' colorScheme='blackAlpha'>
                    <Input
                      rounded='full'
                      variant='filled'
                      bg="bg.muted"
                      _hover={{ bg: "bg.mutedHover" }}
                      _focus={{ bg: "bg.muted", borderColor: "border.focus" }}
                      pr='2rem'
                      mb='1'
                      type='text'
                      placeholder='Enter a YouTube link'
                      _placeholder={{ opacity: 1, color: 'fg.placeholder' }}
                      value={videoLink}
                      onChange={handleLinkChange}
                      onKeyDown={handleKeyDown}
                      borderColor={!isLinkValid ? "red.500" : "transparent"}
                      _invalid={{ boxShadow: '0 0 0 1px red.500' }}
                    />
                    <InputRightElement>
                      <IconButton
                        onClick={handleLinkSubmit}
                        aria-label='Open video'
                        icon={<ArrowForwardIcon />}
                        isRound
                        size='sm'
                        color="fg.strong"
                        bg="none"
                        _hover={{ color: 'fg.onInverse', bg: 'bg.inverse' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <HintRow tone={isLinkValid ? 'tip' : 'error'} badge={isLinkValid ? 'pro tip' : 'try again'}>
                        {isLinkValid ? (
                          <>
                            <Link
                              isExternal
                              display='inline-flex'
                              alignItems='center'
                              gap='2px'
                              fontWeight='semibold'
                              color='fg.default'
                              href={`https://www.youtube.com/`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open YouTube
                              {/* Bold, to match the link's weight. */}
                              <Icon as={ArrowUpRight} weight="bold" />
                            </Link>{' '}
                            find your next song, then paste the link here.
                          </>
                        ) : (
                          linkErrorMessage
                        )}
                      </HintRow>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
        {/* Below the search: someone's recent songs once they have some, the
            product story until then. Nothing while that's still unknown. */}
        {!savedSongs.isPending && (
          <Container maxW="5xl" mt={{ base: 12, md: 16 }} pb={{ base: 14, md: 20 }}>
            {songs.length > 0 ? <RecentSongs songs={songs} /> : <HomeStory onFindSong={goToSearch} />}
          </Container>
        )}
      </Flex>
    </>
  );
};

export default HomePage;