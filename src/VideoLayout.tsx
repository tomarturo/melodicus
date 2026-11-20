import type { ReactNode } from 'react';
import { Flex } from '@chakra-ui/react';
import Header from './Header';
import Footer from './Footer';

const VideoLayout = ({ children }: { children: ReactNode }) => (
  <Flex direction='column' minH='100vh'>
    <Header />
    <Flex direction="column" flex="1">
      {children}
    </Flex>
    <Footer />
  </Flex>
);

export default VideoLayout;
