import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';
import { LinkIcon } from '@heroicons/react/20/solid';
import { Container, Heading, Text, Box, Button, Input, InputGroup, InputRightElement, InputLeftElement, Icon, VStack, Flex } from '@chakra-ui/react'
import Header from './Header';

const HomePage = () => {
  const navigate = useNavigate();
  const [videoLink, setVideoLink] = useState('');

  const handleButtonClick = () => {
    // Extract video ID from the YouTube link
    const videoId = getYoutubeID(videoLink);

    // Navigate to the VideoPage with videoId as a parameter
    navigate(`/video/${videoId}`);
  };

  return (
    <Box>
      <Header />
      <Container maxW='3xl' pt='12'>
        <VStack>
          <Flex mb='12' gap={8} direction={'column'}>
            <Heading as='h1' size='3xl' color='black' align="center">Learn the songs & licks you love</Heading>
            <Text fontSize='xl' color='black' align="center">Uninterrupted loops. Controlled playback. Zero distractions.</Text>
          </Flex>
          <InputGroup size='md' mb='2'>
            <Input
              bg='gray.100'
              pr='2rem'
              type='text'
              placeholder='Enter a YouTube link'
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
            />
            <InputLeftElement>
              <Icon as={LinkIcon}/>
            </InputLeftElement>
            <InputRightElement width='fit-content' display={["none", "block"]}>
              <Button onClick={handleButtonClick} colorScheme='blue' borderStartRadius='0'>
                Start Learning
              </Button>
            </InputRightElement>
          </InputGroup>
          <Button display={['block', 'none']} onClick={handleButtonClick} colorScheme='blue'>
                Start Learning
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default HomePage;
