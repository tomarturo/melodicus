import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Flex, IconButton, Icon, Link, Heading, Text, Input, InputGroup, InputRightElement, Container, } from '@chakra-ui/react';

const NullVideoPage = () => {
    const navigate = useNavigate();
    const [videoLink, setVideoLink] = useState('');
    const handleButtonClick = () => {
    const videoId = getYoutubeID(videoLink);
    navigate(`/video/${videoId}`);
    };

    return (
    <>
      <Flex direction="column" flex="1" minH="0" overflowY="auto" overscrollBehavior="contain" bg='bg.panel' borderRadius={['none', 'none', 'xl']}>
        <Container maxW='3xl' mt='12'>
          <Heading as='h1' size='xl' textAlign="center" mb='6'>We're having trouble with the link you provided</Heading>
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
            Follow this link<Icon as={ArrowUpRight}></Icon>
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
                    <IconButton onClick={handleButtonClick} aria-label='Open video' icon={<ArrowForwardIcon />}  isRound size='sm' color="fg.inverse" bg="bg.inverseStrong" _hover={{color:'fg.max', bg:'bg.surface', border:'1px', borderColor:'border.inverse'}}>
                    </IconButton>
                </InputRightElement>
            </InputGroup>
        </Container> 
        </Flex>
      </> 
  )}

export default NullVideoPage;