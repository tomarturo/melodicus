import { Link } from 'react-router-dom';
import { Container, Stack, Heading, Text, Image, Card, CardBody, Flex, Button, useToast } from '@chakra-ui/react';
import { useAuth } from './contexts/AuthContext';
import { errorMessage } from './lib/errors';
import { useDeleteSavedSong, useSavedSongsQuery } from './features/sections/queries';

const SavedSongs = () => {
  const { user } = useAuth();
  const toast = useToast();
  const songsQuery = useSavedSongsQuery();
  const deleteSong = useDeleteSavedSong();
  const songs = songsQuery.data ?? [];

  const handleRemove = (videoId: string) => {
    deleteSong.mutate(videoId, {
      onSuccess: () => toast({ title: 'Song removed', status: 'success', duration: 3000 }),
      onError: (error) =>
        toast({ title: 'Error removing song', description: errorMessage(error), status: 'error', duration: 5000 }),
    });
  };

  let content;
  if (songsQuery.isPending) {
    content = <Text>Loading...</Text>;
  } else if (songsQuery.isError) {
    content = <Text>Could not load your saved songs: {errorMessage(songsQuery.error)}</Text>;
  } else if (songs.length === 0) {
    content = <Text>No saved songs yet. Songs appear here when you save a loop.</Text>;
  } else {
    content = (
      <Stack spacing="8">
        {!user && (
          <Text fontSize="sm" color="fg.muted">
            These are saved in this browser. Log in to keep them in your account.
          </Text>
        )}
        {songs.map((song) => (
          <Card
            key={song.videoId}
            variant="unstyled"
            bg="transparent"
            direction={{ base: 'column', sm: 'row' }}
            alignItems="center"
          >
            <Link to={`/video/${song.videoId}`} style={{ flex: 1 }}>
              <Flex direction={{ base: 'column', sm: 'row' }} alignItems="center">
                <Image
                  borderRadius="xl"
                  boxSize={['100%', 180]}
                  maxW={{ base: '100%', sm: '200px' }}
                  src={`https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`}
                  objectFit="cover"
                />
                <Stack mt={[2, 0]} spacing="3" ml={{ base: '2', sm: '8' }} mr={{ base: '2', sm: '0' }}>
                  <CardBody>
                    <Heading size="md">{song.title || 'Untitled video'}</Heading>
                    <Text size="xs" color="fg.muted">
                      Saved on {new Date(song.savedAt).toLocaleDateString()}
                    </Text>
                  </CardBody>
                </Stack>
              </Flex>
            </Link>
            <Button
              colorScheme="red"
              variant="ghost"
              isLoading={deleteSong.isPending && deleteSong.variables === song.videoId}
              onClick={() => handleRemove(song.videoId)}
              ml={4}
              mr={2}
            >
              Remove
            </Button>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <>
      <Flex direction="column" flex="1" bg="bg.panel" borderRadius={['none', 'none', 'xl']} overflow="hidden">
        <Container w="100%" pt="12" pb="8">
          {content}
        </Container>
      </Flex>
    </>
  );
};

export default SavedSongs;
