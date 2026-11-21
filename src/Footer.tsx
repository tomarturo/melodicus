import { ArrowSquareOut } from '@phosphor-icons/react';
import { Icon, Link, Flex, Text, Image } from '@chakra-ui/react'
import { brandImageProps } from './theme/brandImage';

const Footer = () => {
return (
  <Flex justify='space-between' py={["2","2","4"]} px={["3", "3", 0]} align='center' w='100%' >
    <Flex gap='2' align='center'>
      <Text fontSize='sm' color='chrome.fg'>© 2025&nbsp;</Text>
      <Link display='inline-flex' alignItems='center' gap='2px' fontSize='sm' fontWeight='bold' color='chrome.fg' href='https://www.heytk.net' isExternal>HeyTK&nbsp;<Icon as={ArrowSquareOut}></Icon></Link>
    </Flex>
    <Link display='inline-flex' alignItems='center' gap='2px' color='chrome.fg' fontSize='sm' href='https://github.com/tomarturo/melodicus' isExternal><Image src={'/github-mark.svg'} boxSize='24px' alt='Melodicus on GitHub' {...brandImageProps}></Image></Link>
  </Flex>
  );
};

export default Footer;