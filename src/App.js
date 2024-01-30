import React from 'react';
import { Routes, Route } from "react-router-dom"
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import HomePage from './HomePage';
import VideoPage from './VideoPage';
import SearchResults from './SearchResults';
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/work-sans';

const theme = extendTheme({
  fonts: {
    heading: `'Space Grotesk Variable', sans-serif`,
    body: `'Space Grotesk Variable', sans-serif`,
  }
})

function App () {  
  return (
    <ChakraProvider theme={theme}>
      <Routes>
        <Route path="/" index element={<HomePage />} />
        <Route path="/video/:videoId" element={< VideoPage />} />
        <Route path="/search/:query" element={<SearchResults />} />
      </Routes>
    </ChakraProvider>
  );
};
export default App;