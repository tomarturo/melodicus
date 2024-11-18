import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
 Container,
 Stack,
 Heading,
 Text,
 Image,
 Card,
 CardBody,
 Flex,
 Button,
 useToast,
} from '@chakra-ui/react';
import { supabase } from './supabaseClient';
import { useAuth } from './contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';

const SavedSongs = () => {
 const [songs, setSongs] = useState([]);
 const [loading, setLoading] = useState(true);
 const { user } = useAuth();
 const toast = useToast();

 useEffect(() => {
   const fetchSavedSongs = async () => {
     try {
       const { data, error } = await supabase
         .from('saved_songs')
         .select('*')
         .order('created_at', { ascending: false });

       if (error) throw error;

       // Format the data to match your list view structure
       const formattedSongs = data.map(song => ({
         id: { videoId: song.video_id },
         created_at: song.created_at,
         snippet: {
           title: song.title,
         }
       }));

       setSongs(formattedSongs);
     } catch (error) {
       toast({
         title: 'Error fetching saved songs',
         description: error.message,
         status: 'error',
         duration: 5000,
       });
     } finally {
       setLoading(false);
     }
   };

   if (user) {
     fetchSavedSongs();
   }
 }, [user, toast]);

 if (!user) {
   return (
     <Flex direction="column" minH="100vh" bg="white"> 
       <Flex direction="column" flex="1">
           <Header />
           <Container centerContent py={10}>
             <Text>Please log in to view your saved songs.</Text>
           </Container>
       </Flex>
       <Footer />
     </Flex>
   );
 }

 if (loading) {
   return (
     <Flex direction="column" minH="100vh" bg="white">
       <Flex direction="column" flex="1">
           <Header />
           <Container centerContent py={10}>
             <Text>Loading...</Text>
           </Container>
       </Flex>
       <Footer />
     </Flex>
   );
 }

 return (
   <Flex direction="column" minH="100vh" bg="white">
     <Flex direction="column" flex="1">
         <Header />
         <Container maxW="3xl" pt="12">
           <Heading mb={6}>My Saved Songs</Heading>
           {songs.length === 0 ? (
             <Text>No saved songs yet.</Text>
           ) : (
             <Stack spacing='8'>
               {songs.map((video) => (
                 <Card key={video.id.videoId} variant='unstyled' direction={{ base: 'column', sm: 'row' }} alignItems='center'>
                   <Link to={`/video/${video.id.videoId}`} style={{ flex: 1 }}>
                     <Flex direction={{ base: 'column', sm: 'row' }} alignItems='center'>
                       <Image
                         borderRadius='lg'
                         boxSize={['100%', 180]}
                         maxW={{base:'100%', sm:'200px'}}
                         src={`https://img.youtube.com/vi/${video.id.videoId}/mqdefault.jpg`}
                         objectFit='cover'
                       />
                       <Stack mt={[2, 0]} spacing='3' ml={{base:'2', sm:'8'}} mr={{base:'2', sm:'0'}}>
                         <CardBody>
                           <Heading size='md'>{video.snippet.title}</Heading>
                           <Text size='xs' color='gray.500'>
                             Saved on {new Date(video.created_at).toLocaleDateString()}
                           </Text>
                         </CardBody>
                       </Stack>
                     </Flex>
                   </Link>
                   <Button
                     colorScheme='red'
                     variant='ghost'
                     onClick={async (e) => {
                       e.preventDefault();
                       try {
                         const { error } = await supabase
                           .from('saved_songs')
                           .delete()
                           .eq('video_id', video.id.videoId);
                         if (error) throw error;
                         setSongs(songs.filter(song => song.id.videoId !== video.id.videoId));
                         toast({
                           title: "Song removed",
                           status: "success",
                           duration: 3000,
                         });
                       } catch (error) {
                         toast({
                           title: "Error removing song",
                           description: error.message,
                           status: "error",
                           duration: 5000,
                         });
                       }
                     }}
                     ml={4}
                     mr={2}
                   >
                     Remove
                   </Button>
                 </Card>
               ))}
             </Stack>
           )}
         </Container>
     </Flex>
     <Footer />
   </Flex>
 );
};

export default SavedSongs;