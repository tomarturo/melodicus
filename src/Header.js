import React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom'
import { Link, Spacer, Flex, Heading } from '@chakra-ui/react'
import MelodicusIcon from './MelodicusIcon';

const Header = () => {
return (
    <Flex bg='white' p='4' mb='12' align='center' borderBottom='1px' borderBottomColor='gray.200' >
      <Link as={ReactRouterLink} to='/'>
        <Flex align="center">
          <MelodicusIcon boxSize={8} color='gray.800'/>
          <Heading as='h2' size='md' color='gray.800'>Melodicus</Heading>
        </Flex>
      </Link>
      <Spacer />
      <Link  color='gray.700'>
        About
      </Link>
    </Flex>
    );
};

export default Header;