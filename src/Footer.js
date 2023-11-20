import React from 'react';
import { Link as ReactRouterLink, useNavigate, useLocation } from 'react-router-dom'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { Icon, Link, Flex, Text, Center } from '@chakra-ui/react'

const Footer = () => {
    const navigate = useNavigate();
return (
  <Flex bg='blackAlpha.900' justify='space-between' px='2' py='6' mt='16' align='baseline' w='100%' borderTop='1px' borderTopColor='gray.200' >
    <Flex gap='2' align='center'>
      <Text fontSize='sm' color='gray.50'>© 2023 • </Text>
      <Link fontSize='sm' color='gray.50' href='https://www.heytk.net' isExternal>Tom Kurzeka <Icon as={ArrowTopRightOnSquareIcon}></Icon></Link>
    </Flex>
    <Link color='gray.50' fontSize='sm' href='https://github.com/tomarturo/melodicus' isExternal>GitHub <Icon as={ArrowTopRightOnSquareIcon}></Icon></Link>
  </Flex>
  );
};

export default Footer;