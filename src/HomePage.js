import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';
import { ArrowForwardIcon, SearchIcon } from '@chakra-ui/icons';
import { ArrowTopRightOnSquareIcon, } from '@heroicons/react/20/solid';
import { Icon, Center, Badge, IconButton, Container, Heading, Text, Input, InputGroup, InputRightElement, Tabs, TabList, TabIndicator, TabPanels, Tab, TabPanel, VStack, Flex, HStack, Link } from '@chakra-ui/react'
import Header from './Header';
import Footer from './Footer';
const HomePage = () => {
  const navigate = useNavigate();
  const [videoLink, setVideoLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    localStorage.setItem('recentSearchQuery', searchQuery);
    navigate(`/search/${searchQuery}`)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleButtonClick = () => {
    const videoId = getYoutubeID(videoLink);
    navigate(`/video/${videoId}`);
    console.log("VIDEO ID:", videoId)
  };

  return (
    <Flex direction='column' minH='100vh'>
      <Header />
      <Flex direction="column" flex="1" pt='12' bg='#FAF9F6' borderRadius='lg' overflow="hidden">
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
                >Find a Song</Tab>                
                <Tab
                color='blackAlpha.700'
                _selected={{ color: 'blackAlpha.800', fontWeight: 'semibold' }}
                >Paste a Link</Tab>
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
                      _focus={{ bg: "blackAlpha.100", borderColor: "blackAlpha.200" }}
                      pr='2rem'
                      mb={4}
                      type='text'
                      placeholder='Enter a song title & artist'
                      _placeholder={{ opacity: 1, color: 'blackAlpha.600' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <InputRightElement>
                      <IconButton onClick={handleSearch} icon={<SearchIcon />} isRound size='sm' color="blackAlpha.900" bg="none" _hover={{ color: 'whiteAlpha.900', bg: 'blackAlpha.800' }}>
                      </IconButton>
                    </InputRightElement>
                  </InputGroup>
                  <Center>
                    <HStack alignItems={['start', 'start', 'center']}>
                      <Badge colorScheme='purple' mt={[1, 1, 0]}>pro tip</Badge>
                      <Text fontSize='sm' textAlign={['left', 'left', 'center']}>
                        This works best when you're specific. Include a song title & artist.
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
                      _focus={{ bg: "blackAlpha.100", borderColor: "blackAlpha.200" }}
                      pr='2rem'
                      mb={4}
                      type='text'
                      placeholder='Enter a YouTube link'
                      _placeholder={{ opacity: 1, color: 'blackAlpha.600' }}
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <InputRightElement>
                      <IconButton onClick={handleButtonClick} icon={<ArrowForwardIcon />} isRound size='sm' color="blackAlpha.900" bg="none" _hover={{ color: 'whiteAlpha.900', bg: 'blackAlpha.800' }}>
                      </IconButton>
                    </InputRightElement>
                  </InputGroup>
                  <Center>
                    <HStack alignItems={['start', 'start', 'center']}>
                      <Badge colorScheme='purple' mt={[1, 1, 0]}>pro tip</Badge>
                      <Text fontSize='sm' textAlign={['left', 'left', 'center']}>
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
                          Open YouTube in a new tab<Icon as={ArrowTopRightOnSquareIcon}></Icon>
                        </Link>&nbsp;
                        find your next song, then paste the link here.
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