import React from 'react';
import { Link, Spacer, Flex, Heading } from '@chakra-ui/react'
import MelodicusIcon from './MelodicusIcon';

const Header = () => {
return (
    <Flex bg='black' p='8' mb='12'>
      <Flex align="center">
        <MelodicusIcon boxSize={8} color='white'/>
        <Heading as='h2' size='lg' color='white'>Melodicus</Heading>
      </Flex>
      <Spacer />
      <Link  color='white'>
        About
      </Link>
    </Flex>
    );

};

export default Header;