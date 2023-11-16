import React from 'react';
import { Routes, Route } from "react-router-dom"
import { ChakraProvider } from '@chakra-ui/react'
import LandingPage from './LandingPage';
import VideoPage from './VideoPage';

function App () {  
  return (
    <ChakraProvider>
      <Routes>
        <Route path="/" index element={<LandingPage />} />
        <Route path="/video/:videoId" element={< VideoPage />} />
      </Routes>
    </ChakraProvider>
  );
};
export default App;

