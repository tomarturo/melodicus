import React from 'react';
import { Routes, Route } from "react-router-dom"
import { ChakraProvider, Container } from '@chakra-ui/react'
import HomePage from './HomePage';
import VideoPage from './VideoPage';
import SearchResults from './SearchResults';
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/work-sans';
import NullVideoPage from './NullVideoPage';
import { AuthProvider } from './contexts/AuthContext';
import SavedSongs from './SavedSongs';

function App() {
  return (
    <AuthProvider>
      <ChakraProvider>
        <Container maxW="1400px">
          <Routes>
            <Route path="/" index element={<HomePage />} />
            <Route path="/video/:videoId" element={< VideoPage />} />
            <Route path="/video/null" element={< NullVideoPage />} />
            <Route path="/search/:query" element={<SearchResults />} />
            <Route path="/saved-songs" element={<SavedSongs />} />
          </Routes>
        </Container>
      </ChakraProvider>
    </AuthProvider>
  );
};
export default App;