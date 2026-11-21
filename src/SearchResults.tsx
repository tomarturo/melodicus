import { useState, useEffect, type KeyboardEvent } from 'react';
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
import SearchQuotaError from './SearchQuotaError';
import SearchResultsList from './SearchResultsList';
import { SearchIcon } from '@chakra-ui/icons';
import { env } from './lib/env';
import type { SearchResult } from './lib/youtube';

const SearchResults = ({ searchQuery }: { searchQuery?: string }) => {
  const { query = '' } = useParams();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState(searchQuery);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  // Add validation state
  const [isSearchValid, setIsSearchValid] = useState(true);
  const [searchErrorMessage, setSearchErrorMessage] = useState('');
  const [hasSearchSubmitAttempt, setHasSearchSubmitAttempt] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({
      q: query,
      type: 'video',
      part: 'snippet',
      key: env.VITE_YOUTUBE_API_KEY,
    });
    fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 403 && data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
            setQuotaExceeded(true);
          }
          return;
        }
        setSearchResults(data.items);
      })
      .catch((error) => {
        console.error('Error searching YouTube:', error);
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
  
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
        <Flex direction="column" flex="1" pt='12' bg='bg.panel' borderRadius={['none', 'none', 'xl']} overflow="hidden">
        {quotaExceeded ? (
          <SearchQuotaError query={query} />
            ) : (
              <Container pb='12'>
                <Heading as="h1" size="2xl" mb='8' textAlign="center">Hear it. Sing it. Play it.</Heading>
                  <InputGroup mb="2">
                    <Input
                      mb='1'
                      rounded='full'
                      variant='filled'
                      bg="bg.muted"
                      _hover={{ bg: "bg.mutedHover" }}
                      _focus={{ bg: "bg.muted", borderColor: "border.focus" }}
                      pr='2rem'
                      type='text'
                      placeholder='Enter a song title & artist'
                      _placeholder={{ opacity: 1, color: 'fg.placeholder' }}
                      defaultValue={query}
                      onChange={(e) => setCurrentSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      borderColor={!isSearchValid && hasSearchSubmitAttempt ? "fg.error" : "transparent"}
                    />
                    <InputRightElement>
                      <IconButton 
                        onClick={handleSearch} 
                        aria-label='Search'
                        icon={<SearchIcon />} 
                        isRound 
                        size='sm' 
                        color="fg.strong" 
                        bg="none" 
                        _hover={{ color: 'fg.onInverse', bg: 'bg.inverse' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <Center mb='8'>
                    <HStack alignItems={['start', 'start', 'center']}>
                      <Badge colorScheme={isSearchValid ? 'purple' : 'red'} mt={[1, 1, 0]}>
                        {isSearchValid ? 'pro tip' : 'try again'}
                      </Badge>
                      <Text fontSize='sm' textAlign={['left', 'left', 'center']} color={!isSearchValid && hasSearchSubmitAttempt ? "fg.error" : "inherit"}>
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
    </>
  );
};

export default SearchResults;