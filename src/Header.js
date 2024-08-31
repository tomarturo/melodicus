import React from 'react';
import { Link as ReactRouterLink} from 'react-router-dom'
import { Image, Link, Flex} from '@chakra-ui/react'

const Header = () => {

  return (
  <Flex bg='blackAlpha.900' justify='space-between' gap='4' px={['2', '4']} py='4'  align='center'>
    <Link as={ReactRouterLink} to='/'>  
      <Image src={process.env.PUBLIC_URL + '/grotesklogo.svg'} w='120px'/>
    </Link>
  </Flex>
  );
};

export default Header;