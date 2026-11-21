import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';
import { ArrowForwardIcon, SearchIcon } from '@chakra-ui/icons';
import { Icon, Center, Badge, IconButton, Container, Heading, Text, Input, InputGroup, InputRightElement, Tabs, TabList, TabIndicator, TabPanels, Tab, TabPanel, VStack, Flex, HStack, Link } from '@chakra-ui/react'
import { ArrowSquareOut } from '@phosphor-icons/react';

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
    navigate(`/search/${searchQuery}`);
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
      <Flex direction="column" flex="1" pt='12' bg='bg.panel' borderRadius={['none', 'none', 'xl']} overflow="hidden">
        <Container maxW='3xl'>
          <VStack>
            <Flex mb='12' gap={8} direction={'column'}>
              <Heading as='h1' size='3xl' color='fg.strong' textAlign="center">Learn the songs & licks you love</Heading>
              <Text fontSize='xl' color='fg.default' align="center">Uninterrupted loops. Controlled playback. Zero distractions.</Text>
            </Flex>
            <Tabs
              w='100%'
              align='center'
              isFitted maxW='2xl'>
              <TabList
                borderBottomColor="border.strong">
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
                      borderColor={!isSearchValid && hasSearchSubmitAttempt ? "fg.error" : "transparent"}
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
                  <Center>
                    <HStack alignItems={['start', 'start', 'center']}>
                      <Badge colorScheme={isSearchValid ? 'purple' : 'red'} mt={[1, 1, 0]}>
                        {isSearchValid ? 'pro tip' : 'try again'}
                      </Badge>
                      <Text fontSize='sm' textAlign={['left', 'left', 'center']} color={!isSearchValid && hasSearchSubmitAttempt ? "fg.error" : "inherit"}>
                        {isSearchValid ? (
                          'This works best when you are specific. Include a song title & artist.'
                        ) : (
                          searchErrorMessage
                        )}
                      </Text>
                    </HStack>
                  </Center>
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
                      borderColor={!isLinkValid ? "fg.error" : "transparent"}
                      _invalid={{ boxShadow: '0 0 0 1px var(--chakra-colors-fg-error)' }}
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
                  <Center>
                    <HStack alignItems={['start', 'start', 'center']}>
                      <Badge colorScheme={isLinkValid ? 'purple' : 'red'} mt={[1, 1, 0]}>
                        {isLinkValid ? 'pro tip' : 'try again'}
                      </Badge>
                      <Text fontSize='sm' textAlign={['left', 'left', 'center']} color={!isLinkValid ? "fg.error" : "inherit"}>
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
                              Open YouTube in a new tab<Icon as={ArrowSquareOut}></Icon>
                            </Link>&nbsp;
                            find your next song, then paste the link here.
                          </>
                        ) : (
                          linkErrorMessage
                        )}
                      </Text>
                    </HStack>
                  </Center>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
      </Flex>
    </>
  );
};

export default HomePage;