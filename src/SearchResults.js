import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import {
  IconButton,
  Container,
  Heading,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  Center,
  HStack,
  Badge
} from '@chakra-ui/react';
import Header from './Header';
import Footer from './Footer';
import SearchQuotaError from './SearchQuotaError';
import SearchResultsList from './SearchResultsList';
import { SearchIcon } from '@chakra-ui/icons';

const SearchResults = ({ searchQuery }) => {
  const { query } = useParams();
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState(searchQuery);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  // Add validation state
  const [isSearchValid, setIsSearchValid] = useState(true);
  const [searchErrorMessage, setSearchErrorMessage] = useState('');
  const [hasSearchSubmitAttempt, setHasSearchSubmitAttempt] = useState(false);

  useEffect(() => {
    axios
      .get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          q: query,
          type: 'video',
          part: 'snippet',
          key: process.env.REACT_APP_YOUTUBE_API_KEY
          // key:'AIzaSyCz_FUhutA28tmaBM-_EGIuFFfPxuA_irQ'
        },
      })
      .then((response) => {
        setSearchResults(response.data.items);
      })
      .catch((error) => {
        if (error.response && error.response.status === 403 && error.response.data.error.errors[0].reason === 'quotaExceeded') {
          setQuotaExceeded(true);
        }
      });
      setCurrentSearchQuery(searchQuery);
      // Reset validation state when query changes
      setIsSearchValid(true);
      setHasSearchSubmitAttempt(false);
  }, [query, searchQuery]);

  const handleSearch = () => {
    setHasSearchSubmitAttempt(true);
    
    // Check if search query is empty
    if (!currentSearchQuery || !currentSearchQuery.trim()) {
      setIsSearchValid(false);
      setSearchErrorMessage('Please enter a song title & artist');
      return;
    }
    
    // If we have a search query, proceed with navigation
    window.location.href = `/search/${currentSearchQuery}`;
  };
  
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div>
      <Flex direction='column' minH='100vh'>
        <Header />
        <Flex direction="column" flex="1" pt='12' bg='#FAF9F6' borderRadius={['none', 'none', 'xl']} overflow="hidden">
        {quotaExceeded ? (
          <SearchQuotaError query={query} />
            ) : (
              <Container pb='12'>
                <Heading as="h1" size="2xl" mb='8' align="center">Hear it. Sing it. Play it.</Heading>
                  <InputGroup mb="2">
                    <Input
                      mb='1'
                      rounded='full'
                      variant='filled'
                      bg="blackAlpha.100"
                      _hover={{ bg: "blackAlpha.200" }}
                      _focus={{ bg: "blackAlpha.100", borderColor: "blackAlpha.900" }}
                      pr='2rem'
                      type='text'
                      placeholder='Enter a song title & artist'
                      _placeholder={{ opacity: 1, color: 'blackAlpha.600' }}
                      defaultValue={query}
                      onChange={(e) => setCurrentSearchQuery(e.target.value)}
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
                  <Center mb='8'>
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
                <SearchResultsList searchResults={searchResults} />
              </Container>
            )}
        </Flex>
        <Footer />
      </Flex>
    </div>
  );
};

export default SearchResults;