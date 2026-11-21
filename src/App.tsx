import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider, Container } from '@chakra-ui/react';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/work-sans';
import { createQueryClient } from './lib/queryClient';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import GuestLoopsSync from './features/sections/GuestLoopsSync';
import HomePage from './HomePage';
import VideoPage from './VideoPage';
import SearchResults from './SearchResults';
import NullVideoPage from './NullVideoPage';
import SavedSongs from './SavedSongs';

function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GuestLoopsSync />
          <Container px={['0', '0', 6]} maxW="1400px">
            <Routes>
              <Route path="/" index element={<HomePage />} />
              <Route path="/video/:videoId" element={<VideoPage />} />
              <Route path="/video/null" element={<NullVideoPage />} />
              <Route path="/search/:query" element={<SearchResults />} />
              <Route path="/saved-songs" element={<SavedSongs />} />
            </Routes>
          </Container>
        </AuthProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
