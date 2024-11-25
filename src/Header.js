import React from 'react';
import { Link as ReactRouterLink} from 'react-router-dom'
import { Image, Link, Flex, Button, Box, useDisclosure, IconButton } from '@chakra-ui/react'
import { FolderIcon } from '@heroicons/react/20/solid';
import AuthModal from './AuthModal';
import { useAuth } from './contexts/AuthContext';

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, logout } = useAuth();

  return (
    <Flex justify='space-between' gap='4' py='4' align='center'>
      <Box>
        <Link as={ReactRouterLink} to='/'>
          <Image src={process.env.PUBLIC_URL + '/grotesklogo.svg'} w='120px'/>
        </Link>
      </Box>
      <Flex gap='4'>
        {user && (
          <Link as={ReactRouterLink} to="/saved-songs">
            <IconButton icon={<FolderIcon />}  size='sm' color="white" colorScheme='white'>
            </IconButton>
          </Link>
        )}
        {user ? (
          <Button onClick={logout}>Logout</Button>
        ) : (
          <Button onClick={onOpen}>Login</Button>
        )}
        <AuthModal isOpen={isOpen} onClose={onClose} />
      </Flex>
    </Flex>
  );
};

export default Header;