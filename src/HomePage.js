import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';
import { LinkIcon } from '@heroicons/react/20/solid';
import { Container, Heading, Text, Box, Button, Input, InputGroup, InputRightElement, Tabs, TabList, TabPanels, Tab, TabPanel, InputLeftElement, Icon, VStack, Flex } from '@chakra-ui/react'
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

  const handleButtonClick = () => {
    // Extract video ID from the YouTube link
    const videoId = getYoutubeID(videoLink);

    // Navigate to the VideoPage with videoId as a parameter
    navigate(`/video/${videoId}`);
  };

  return (
    <Flex direction='column' minH='100vh'>
      <Header/>
      <Flex direction="column" flex="1">
        <Container maxW='3xl' pt='12'>
          <VStack>
            <Flex mb='12' gap={8} direction={'column'}>
              <Heading as='h1' size='3xl' color='blackAlpha.900' align="center">Learn the songs & licks you love</Heading>
              <Text fontSize='xl' color='blackAlpha.800' align="center">Uninterrupted loops. Controlled playback. Zero distractions.</Text>
            </Flex>
            <Tabs colorScheme='gray' w='100%' align='center' variant='soft-rounded'>
              <TabList>
                <Tab>Paste a Link</Tab>
                <Tab>Find a Song</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <InputGroup size='md' mb='2'>
                    <Input
                      bg='gray.100'
                      pr='2rem'
                      type='text'
                      placeholder='Enter a YouTube link'
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                    />
                    <InputRightElement width='fit-content' display={["none", "block"]}>
                      <Button onClick={handleButtonClick} colorScheme='purple' bg='purple.600' borderStartRadius='0'>
                        Start Learning
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <Button display={['block', 'none']} onClick={handleButtonClick} colorScheme='purple' bg='purple.600'>
                        Start Learning
                  </Button>
                </TabPanel>
                <TabPanel>
                  <InputGroup size='md' mb='2'>
                    <Input
                      bg='gray.100'
                      pr='2rem'
                      type='text'
                      placeholder='Enter a song title'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <InputRightElement width='fit-content' display={["none", "block"]}>
                    <Button onClick={handleSearch} colorScheme='purple' bg='purple.600' borderStartRadius='0'>
                        Search
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <Button display={['block', 'none']} onClick={handleSearch} colorScheme='purple' bg='purple.600'>
                      Search
                  </Button>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
      </Flex>
      <Footer/>
    </Flex>
  );
};

export default HomePage;