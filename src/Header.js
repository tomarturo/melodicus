import React, { useState } from 'react';
import getYoutubeID from 'get-youtube-id';
import { LinkIcon, ArrowSmallRightIcon, ArrowRightCircleIcon} from '@heroicons/react/20/solid';
import { Link as ReactRouterLink, useNavigate, useLocation } from 'react-router-dom'
import { IconButton, Input, InputGroup, InputRightElement, InputLeftElement, Icon, VStack, Link, Spacer, Flex, Heading } from '@chakra-ui/react'
import MelodicusIcon from './MelodicusIcon';

const Header = () => {
  const location = useLocation();
  const hideOnRoute = '/'; 
  const shouldHidePart = location.pathname === hideOnRoute;
  const navigate = useNavigate();
  const [videoLink, setVideoLink] = useState('');

  const handleButtonClick = () => {
    // Extract video ID from the YouTube link
    const videoId = getYoutubeID(videoLink);
    // Navigate to the VideoPage with videoId as a parameter
    navigate(`/video/${videoId}`);
  };
  
return (
  <Flex bg='white' justify='space-between' gap='4' p={['2', '4']} mb={['8', '12']} align='center' borderBottom='1px' borderBottomColor='gray.200' >
    <Link as={ReactRouterLink} to='/'>
      <Flex align="center" gap='1'>
        <MelodicusIcon h='6' color='gray.800'/>
        <Heading size={['xs', 'sm']} color='gray.800'>Melodicus</Heading>
      </Flex>
    </Link>
    {!shouldHidePart && 
    <InputGroup size={['xs','sm']} width={['100px', '300px']}>
      <Input
        bg='gray.100'
        pr='2rem'
        type='text'
        placeholder='Enter YouTube link...'
        value={videoLink}
        onChange={(e) => setVideoLink(e.target.value)}
        borderRadius="md"
      />
      <InputRightElement>
        <IconButton
          height='100%'
          colorScheme='blue'
          variant='solid'
          borderEndRadius="md"
          borderStartRadius="0"
          fontSize={24}
          icon={<Icon as={ArrowSmallRightIcon}/>}
          onClick={handleButtonClick}
        />
      </InputRightElement>
    </InputGroup>}
  </Flex>
  );
};

export default Header;