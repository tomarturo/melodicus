import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';
import { LinkIcon } from '@heroicons/react/20/solid';
import { Container, Heading, Text, Box, Button, Input, InputGroup, InputRightElement, InputLeftElement, Icon, VStack, Flex } from '@chakra-ui/react'
import Header from './Header';

const HomePage = () => {
  const navigate = useNavigate();
  const [videoLink, setVideoLink] = useState('');

  const handleButtonClick = (videoLink) => {
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
            <Heading as='h1' size='3xl' color='black' align="center">Learn to make music by listening to music</Heading>
            <Text fontSize='xl' color='black' align="center">The secrets to advancing as a musician are waiting in the songs you love.</Text>
          </Flex>
          <InputGroup size='md' mb='4'>
            <Input
              pr='2rem'
              type='text'
              placeholder='Enter link to YouTube video to get started...'
            />
            <InputLeftElement width='4.5rem'>
              <Icon as={LinkIcon}/>
              </InputLeftElement>
            <InputRightElement width='8rem'>
            <Button onClick={() => handleButtonClick()}>Start Learning</Button>
            </InputRightElement>
          </InputGroup>
        </VStack>
      </Container>
    </Box>
  );
};

export default HomePage;
