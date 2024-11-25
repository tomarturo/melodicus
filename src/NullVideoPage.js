import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';
import Header from './Header';
import Footer from './Footer';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { ArrowTopRightOnSquareIcon, } from '@heroicons/react/20/solid';
import { Flex, IconButton, Icon, Link, Heading, Text, Input, InputGroup, InputRightElement, Container, } from '@chakra-ui/react';

const NullVideoPage = () => {
    const navigate = useNavigate();
    const [videoLink, setVideoLink] = useState('');
    const handleButtonClick = () => {
    const videoId = getYoutubeID(videoLink);
    navigate(`/video/${videoId}`);
    };

    return (
    <Flex direction='column' minH='100vh'>
      <Header/>
      <Flex direction="column" flex="1" bg='#f7f3e3'>
        <Container maxW='3xl' mt='12'>
          <Heading as='h1' size='xl' align="center" mb='6'>We're having trouble with the link you provided</Heading>
          <Text align='center' mb='8'>
          <Link
            isExternal    
            display='inline-flex'
            alignItems='center'
            gap='2px'
            fontWeight='bold'
            href={`https://www.youtube.com/`}
            target="_blank"
            rel="noopener noreferrer"
            >
            Follow this link<Icon as={ArrowTopRightOnSquareIcon}></Icon>
            </Link>{' '}
            to open YouTube in a new tab. Find the song you want to learn, then copy and paste its link below.
        </Text>
          <InputGroup size='md' mb='2'>
            <Input
            rounded='full'
            variant='outline'
            pr='2rem'
            mb={4}
            type='text'
            placeholder='Enter a YouTube link'
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
            />
                <InputRightElement>
                    <IconButton onClick={handleButtonClick} icon={<ArrowForwardIcon />}  isRound size='sm' color="white" bg="black" _hover={{color:'black', bg:'white', border:'1px', borderColor:'black'}}>
                    </IconButton>
                </InputRightElement>
            </InputGroup>
        </Container> 
        </Flex>
        <Footer/>
      </Flex> 
  )}

export default NullVideoPage;