// SearchResults.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  SimpleGrid,
  Card,
  Image,
  CardBody,
  CardFooter,
  Stack,
  Heading,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Text,
  Circle,
  Box,
  AbsoluteCenter,
  background
} from '@chakra-ui/react';
import Header from './Header';
import Footer from './Footer';

const SearchResults = ({ searchQuery }) => {
  const { query } = useParams();
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState(searchQuery);

  useEffect(() => {
    // Make a request to the YouTube API to fetch search results
    axios
      .get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          q: query,
          type: 'video',
          part: 'snippet',
          key: 'AIzaSyB8asYxNRmtKE_lhgOKoMcLiWNsbwvCSFs', 
        },
      })
      .then((response) => {
        setSearchResults(response.data.items);
      })
      .catch((error) => {
        console.error('Error fetching search results:', error);
      });

    // Update the current search query
    setCurrentSearchQuery(searchQuery);
  }, [query, searchQuery]);

  const handleSearch = () => {
    // Navigate to the search results page with the new search query
    window.location.href = `/search/${currentSearchQuery}`;
  };

  return (
    <div>
      <Flex direction='column' minH='100vh' bg='whiteAlpha.900'>
        <Header />
        <Flex direction="column" flex="1">
        <Container>
          <InputGroup size='md' mb='12'>
            <Input
              bg='gray.100'
              pr='2rem'
              type='text'
              placeholder='Enter a search query'
              defaultValue={query}
              onChange={(e) => setCurrentSearchQuery(e.target.value)}
            />
            <InputRightElement width='fit-content'>
            <Button onClick={handleSearch} colorScheme='purple' bg='purple.600' borderStartRadius='0'>
                Search
            </Button>
            </InputRightElement>
          </InputGroup>
          <Button display={['block', 'none']} onClick={handleSearch} colorScheme='purple' bg='purple.600'>
              Search
          </Button>
          <Stack spacing='8'>   
            {searchResults.map((video) => (
              <Link key={video.id.videoId} to={`/video/${video.id.videoId}`}>
                <Card
                variant='unstyled'   
                direction={{ base: 'column', sm: 'row' }}>
                    <Box pos='relative'>
                    <AbsoluteCenter
                        opacity={0.5}
                        w='100%'
                        h='100%'
                        borderRadius='full'
                        blendMode='overlay'
                        sx={{
                            background: 
                            `radial-gradient(circle, rgba(42, 41, 40, .85) 0%, rgba(42, 41, 40, .85) 30%, transparent 30%),
                            radial-gradient(circle, rgba(42, 41, 40, .85) 0%, rgba(42, 41, 40, .85) 40%, transparent 40%),
                            repeating-radial-gradient(#2a2928, #2a2928 4px, #ada9a0 5px, #2a2928 6px)`,
                            backgroundSize: `50% 100%, 100% 50%, 100% 100%`
                        }}
                        ></AbsoluteCenter>
                        <AbsoluteCenter bg='whiteAlpha.900' borderColor='black' borderWidth={2} p='3' axis='both' borderRadius='full'>
                        </AbsoluteCenter>
                        <Image
                        borderWidth='40px'
                        borderRadius='full' 
                        borderColor='black'
                        borderStyle='solid'
                        boxSize='180px'
                        objectFit='cover'
                        maxW={{ base: '100%', sm: '200px' }}
                        src={video.snippet.thumbnails.medium.url}
                        alt={video.snippet.title}
                        />
                    </Box>
                    <Stack mt='6' spacing='3' ml='8'>
                  <CardBody>
                      <Heading size='sm'>{video.snippet.title}</Heading>
                      <Text size='xs'>{video.snippet.description}</Text>
                  </CardBody>
                    </Stack>
                </Card>
              </Link>
            ))}
          </Stack>
        </Container>
        </Flex>
        <Footer />
      </Flex>
    </div>
  );
};

export default SearchResults;
