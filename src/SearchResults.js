// SearchResults.js
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
      }, [query, searchQuery]);

  const handleSearch = () => {
    window.location.href = `/search/${currentSearchQuery}`;
  };

  return (
    <div>
      <Flex direction='column' minH='100vh' bg="white">
        <Header />
        <Flex direction="column" flex="1">
        {quotaExceeded ? (
          <SearchQuotaError query={query} />
            ) : (
              <Container mt='12'>
                <Heading as="h1" size="2xl" mb='8' align="center">Hear it. Sing it. Play it.</Heading>
                  <InputGroup mb='8'>
                    <Input
                      rounded='full'
                      variant='filled'
                      pr='2rem'
                      type='text'
                      placeholder='Enter a search query'
                      defaultValue={query}
                      onChange={(e) => setCurrentSearchQuery(e.target.value)}
                    />
                    <InputRightElement>
                      <IconButton onClick={handleSearch} icon={<SearchIcon />} isRound size='sm' color="white" bg="black" _hover={{color:'black', bg:'white', border:'1px', borderColor:'black'}}>
                      </IconButton>
                    </InputRightElement>
                  </InputGroup>
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
