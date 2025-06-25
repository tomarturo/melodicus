import React, { useState } from 'react';
import { Link as ReactRouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Image, Link, Flex, Box, Input, InputGroup, InputRightElement, IconButton } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

const Header = ({ query = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSearchQuery, setCurrentSearchQuery] = useState(query);
  const [isSearchValid, setIsSearchValid] = useState(true);
  const [hasSearchSubmitAttempt, setHasSearchSubmitAttempt] = useState(false);

  // Check if we're on a video page (routes like /video/:id)
  const isVideoPage = location.pathname.startsWith('/video/');

  const handleSearch = () => {
    setHasSearchSubmitAttempt(true);

    // Check if search query is empty
    if (!currentSearchQuery.trim()) {
      setIsSearchValid(false);
      return;
    }

    // If we have a search query, proceed with navigation
    localStorage.setItem('recentSearchQuery', currentSearchQuery);
    navigate(`/search/${currentSearchQuery}`);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Flex justify='space-between' gap='4' h="48px" py={["2","2","4"]} px={["3", "3", 0]} align='center'>
      <Box>
        <Link as={ReactRouterLink} to='/'>
          <Image src={process.env.PUBLIC_URL + '/wordmark.svg'} w='120px'/>
        </Link>
      </Box>
      {isVideoPage && (
        <InputGroup maxW="200px">
          <Input
            size="sm"
            rounded='full'
            variant='filled'
            bg='blackAlpha.500'
            _hover={{ bg: "blackAlpha.800" }}
            _focus={{ bg: "blackAlpha.800", borderColor: "whiteAlpha.700" }}
            color="whiteAlpha.700"
            pr='2rem'
            type='text'
            placeholder='Search'
            _placeholder={{ opacity: 1, color: 'whiteAlpha.600' }}
            value={currentSearchQuery}
            onChange={(e) => setCurrentSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            borderColor={!isSearchValid && hasSearchSubmitAttempt ? "red.500" : "transparent"}
          />
          <InputRightElement h="100%" display="flex" alignItems="center">
            <IconButton 
              onClick={handleSearch} 
              icon={<SearchIcon />} 
              isRound 
              size='xs' 
              color="whiteAlpha.600" 
              bg="none" 
              _hover={{ color: 'whiteAlpha.900', bg: 'blackAlpha.800' }}
            />
          </InputRightElement>
        </InputGroup>
      )}
    </Flex>
  );
};

export default Header;