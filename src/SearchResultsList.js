import React from "react";
import { Link } from 'react-router-dom';
import { Image, Stack, Card, Heading, Text, CardBody } from '@chakra-ui/react';

const SearchResultsList = ({ searchResults }) => (
  <Stack spacing='8'>
    {searchResults.map((video) => (
      <Link key={video.id.videoId} to={`/video/${video.id.videoId}`}>
        <Card variant='unstyled' direction={{ base: 'column', sm: 'row' }} alignItems='center'>
          <Image
            borderRadius='lg'
            boxSize={['100%', 180]}
            maxW={{base:'100%', sm:'200px'}}
            src={video.snippet.thumbnails.medium.url}
            objectFit='cover'
          />
          <Stack mt={[2, 0]} spacing='3' ml={{base:'2', sm:'8'}} mr={{base:'2', sm:'0'}}>
            <CardBody>
              <Heading size='md'>{video.snippet.title}</Heading>
              <Text size='xs' blendMode="multiply">{video.snippet.description}</Text>
            </CardBody>
          </Stack>
        </Card>
      </Link>
    ))}
  </Stack>
);

export default SearchResultsList;