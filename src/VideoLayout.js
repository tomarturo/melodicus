import React from 'react';
import { Flex } from '@chakra-ui/react';
import Header from './Header';
import Footer from './Footer';

const VideoLayout = ({
  children,
  videoLength,
  savedSections,
  onJumpToSection,
  onEditSection,
  onDeleteSection,
}) => (
  <Flex direction='column' minH='100vh'>
    <Header />
    <Flex direction="column" flex="1">
      {React.Children.map(children, child => 
        child && React.cloneElement(child, {
          videoLength,
          savedSections,
          onJumpToSection,
          onEditSection,
          onDeleteSection
        })
      )}
    </Flex>
    <Footer />
  </Flex>
);

export default VideoLayout;