import React from 'react';
import { Link as ReactRouterLink} from 'react-router-dom'
import { Image, Link, Flex, Box } from '@chakra-ui/react'
const Header = () => {
  return (
    <Flex justify='space-between' gap='4' py='4' align='center'>
      <Box>
        <Link as={ReactRouterLink} to='/'>
          <Image src={process.env.PUBLIC_URL + '/grotesklogo.svg'} w='120px'/>
        </Link>
      </Box>
    </Flex>
  );
};

export default Header;