import React from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { Icon, Link, Flex, Text, Image } from '@chakra-ui/react'

const Footer = () => {
return (
  <Flex bg='blackAlpha.900' justify='space-between' px={['2', '4']} py='6' mt='24' align='center' w='100%' borderTop='1px' borderTopColor='gray.200' >
    <Flex gap='2' align='center'>
      <Text fontSize='sm' color='white'>© 2023&nbsp;</Text>
      <Link display='inline-flex' alignItems='center' gap='2px' fontSize='sm' fontWeight='bold' color='gray.50' href='https://www.heytk.net' isExternal>HeyTK&nbsp;<Icon as={ArrowTopRightOnSquareIcon}></Icon></Link>
    </Flex>
    <Link display='inline-flex' alignItems='center' gap='2px' color='gray.50' fontSize='sm' href='https://github.com/tomarturo/melodicus' isExternal><Image src={process.env.PUBLIC_URL + '/github-mark.svg'} boxSize='24px'></Image></Link>
  </Flex>
  );
};

export default Footer;