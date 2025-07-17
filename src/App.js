import React from 'react';
import { Routes, Route } from "react-router-dom"
import { ChakraProvider, Container } from '@chakra-ui/react'
import HomePage from './HomePage';
import VideoPage from './VideoPage';
import SearchResults from './SearchResults';
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/work-sans';
import NullVideoPage from './NullVideoPage';
function App() {
  return (
    <ChakraProvider>
      <Container px={["0", "0", 6]} maxW="1400px">
        <Routes>
          <Route path="/" index element={<HomePage />} />
          <Route
            path="/video/:videoId"
            element={<VideoPage />}
          />
          <Route path="/video/null" element={<NullVideoPage />} />
          <Route path="/search/:query" element={<SearchResults />} />
        </Routes>
      </Container>
    </ChakraProvider>
  );
};
export default App;