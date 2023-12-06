import React, { useState } from 'react';
import getYoutubeID from 'get-youtube-id';
import { ArrowSmallRightIcon } from '@heroicons/react/20/solid';
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
  <Flex bg='blackAlpha.900' justify='space-between' gap='4' px={['2', '4']} py='4' mb={['8', '12']} align='center'>
    <Link as={ReactRouterLink} to='/'>
      <Flex align="center" gap='1'>
        <MelodicusIcon h='6' color='whiteAlpha.900'/>
        <Heading size={['xs', 'sm']} color='whiteAlpha.900'>Melodicus</Heading>
      </Flex>
    </Link>
    {!shouldHidePart && 
    <InputGroup size={['xs','sm']} width={['auto', '300px']}>
      <Input
        bg='whiteAlpha.900'
        type='text'
        placeholder='Enter YouTube link...'
        value={videoLink}
        onChange={(e) => setVideoLink(e.target.value)}
        borderRadius={['sm', 'md']}
      />
      <InputRightElement>
        <IconButton
          minW='0'
          width='32px'
          height='100%'
          colorScheme='purple'
          bg='purple.600'
          variant='solid'
          borderEndRadius={['sm', 'md']}
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