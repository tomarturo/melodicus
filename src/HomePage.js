import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';
import { ArrowForwardIcon, SearchIcon } from '@chakra-ui/icons';
import { Icon, Center, Badge, IconButton, Container, Heading, Text, Input, InputGroup, InputRightElement, Tabs, TabList, TabIndicator, TabPanels, Tab, TabPanel, VStack, Flex, HStack, Link } from '@chakra-ui/react'
import Header from './Header';
import Footer from './Footer';
import { ExternalLink } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [videoLink, setVideoLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLinkValid, setIsLinkValid] = useState(true);
  const [linkErrorMessage, setLinkErrorMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isSearchValid, setIsSearchValid] = useState(true);
  const [searchErrorMessage, setSearchErrorMessage] = useState('');
  const [hasSearchSubmitAttempt, setHasSearchSubmitAttempt] = useState(false);

  // YouTube URL validation function
  const validateYouTubeUrl = (url) => {
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

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      if (event.target.value === videoLink) {
        handleLinkSubmit();
      } else {
        handleSearch();
      }
    }
  };

  const handleLinkChange = (e) => {
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
        console.log("VIDEO ID:", videoId);
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
    <Flex direction='column' minH='100vh'>
      <Header />
      <Flex direction="column" flex="1" pt='12' bg='#FAF9F6' borderRadius={['none', 'none', 'xl']} overflow="hidden">
        <Container maxW='3xl'>
          <VStack>
            <Flex mb='12' gap={8} direction={'column'}>
              <Heading as='h1' size='3xl' color='blackAlpha.900' align="center">Learn the songs & licks you love</Heading>
              <Text fontSize='xl' color='blackAlpha.800' align="center">Uninterrupted loops. Controlled playback. Zero distractions.</Text>
            </Flex>
            <Tabs
              w='100%'
              align='center'
              isFitted maxW='2xl'>
              <TabList
                borderBottomColor="blackAlpha.300">
                <Tab
                  color='blackAlpha.700'
                  _selected={{ color: 'blackAlpha.800', fontWeight: 'semibold' }}
                >Find a song</Tab>
                <Tab
                  color='blackAlpha.700'
                  _selected={{ color: 'blackAlpha.800', fontWeight: 'semibold' }}
                >Paste a link</Tab>
              </TabList>
              <TabIndicator
                mt="-1.5px"
                height="2px"
                bg="black"
                borderRadius="1px"
              />
              <TabPanels>
                <TabPanel px='0'>
                  <InputGroup size='md' mb='2'>
                    <Input
                      rounded='full'
                      variant='filled'
                      bg="blackAlpha.100"
                      _hover={{ bg: "blackAlpha.200" }}
                      _focus={{ bg: "blackAlpha.100", borderColor: "blackAlpha.900" }}
                      pr='2rem'
                      mb='1'
                      type='text'
                      placeholder='Enter a song title & artist'
                      _placeholder={{ opacity: 1, color: 'blackAlpha.600' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      borderColor={!isSearchValid && hasSearchSubmitAttempt ? "red.500" : "transparent"}
                    />
                    <InputRightElement>
                      <IconButton
                        onClick={handleSearch}
                        icon={<SearchIcon />}
                        isRound
                        size='sm'
                        color="blackAlpha.900"
                        bg="none"
                        _hover={{ color: 'whiteAlpha.900', bg: 'blackAlpha.800' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <Center>
                    <HStack alignItems={['start', 'start', 'center']}>
                      <Badge colorScheme={isSearchValid ? 'purple' : 'red'} mt={[1, 1, 0]}>
                        {isSearchValid ? 'pro tip' : 'try again'}
                      </Badge>
                      <Text fontSize='sm' textAlign={['left', 'left', 'center']} color={!isSearchValid && hasSearchSubmitAttempt ? "red.500" : "inherit"}>
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
                      bg="blackAlpha.100"
                      _hover={{ bg: "blackAlpha.200" }}
                      _focus={{ bg: "blackAlpha.100", borderColor: "blackAlpha.900" }}
                      pr='2rem'
                      mb='1'
                      type='text'
                      placeholder='Enter a YouTube link'
                      _placeholder={{ opacity: 1, color: 'blackAlpha.600' }}
                      value={videoLink}
                      onChange={handleLinkChange}
                      onKeyDown={handleKeyDown}
                      borderColor={!isLinkValid ? "red.500" : "transparent"}
                      _invalid={{ boxShadow: '0 0 0 1px red.500' }}
                    />
                    <InputRightElement>
                      <IconButton
                        onClick={handleLinkSubmit}
                        icon={<ArrowForwardIcon />}
                        isRound
                        size='sm'
                        color="blackAlpha.900"
                        bg="none"
                        _hover={{ color: 'whiteAlpha.900', bg: 'blackAlpha.800' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <Center>
                    <HStack alignItems={['start', 'start', 'center']}>
                      <Badge colorScheme={isLinkValid ? 'purple' : 'red'} mt={[1, 1, 0]}>
                        {isLinkValid ? 'pro tip' : 'try again'}
                      </Badge>
                      <Text fontSize='sm' textAlign={['left', 'left', 'center']} color={!isLinkValid ? "red.500" : "inherit"}>
                        {isLinkValid ? (
                          <>
                            <Link
                              isExternal
                              display='inline-flex'
                              alignItems='center'
                              gap='2px'
                              fontWeight='semibold'
                              color='blackAlpha.800'
                              href={`https://www.youtube.com/`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open YouTube in a new tab<Icon as={ExternalLink}></Icon>
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
      <Footer />
    </Flex>
  );
};

export default HomePage;