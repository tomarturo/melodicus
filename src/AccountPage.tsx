import type { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, Button, Container, Flex, Heading, Stack, Text, useDisclosure } from '@chakra-ui/react';
import { useAuth } from './contexts/AuthContext';
import { useNotify } from './lib/notify';
import { useSavedSongsQuery } from './features/sections/queries';
import { useDeleteAccount } from './features/account/useDeleteAccount';
import DeleteAccountDialog from './features/account/DeleteAccountDialog';

const countLabel = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** A white section of the page, like the cards elsewhere in the app. */
const Panel = ({ children }: { children: ReactNode }) => (
  <Box p={{ base: 5, md: 6 }} bg="bg.surface" border="1px" borderColor="border.subtle" borderRadius="xl">
    {children}
  </Box>
);

/** The signed-in person's account: who they're signed in as, and deleting it. */
const AccountPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const confirmDialog = useDisclosure();
  const songsQuery = useSavedSongsQuery();
  const deleteAccount = useDeleteAccount();

  // Only for signed-in people; anyone else (or someone just deleted) goes home.
  if (!user) return <Navigate to="/" replace />;

  const songs = songsQuery.data ?? [];
  const loopCount = songs.reduce((total, song) => total + song.loops.length, 0);
  const whatGoes =
    songs.length === 0
      ? 'everything saved in it'
      : `your ${countLabel(songs.length, 'song', 'songs')} and ${countLabel(loopCount, 'loop', 'loops')}`;

  const confirmDelete = async () => {
    await deleteAccount.mutateAsync();
    confirmDialog.onClose();
    navigate('/', { replace: true });
    notify({ tone: 'success', title: 'Your account was deleted' });
  };

  return (
    <Flex direction="column" flex="1" bg="bg.panel" borderRadius={['none', 'none', 'xl']} minH="0" overflowY="auto" overscrollBehavior="contain">
      <Container w="100%" pt={{ base: 6, md: 12 }} pb="8">
        <Stack spacing={6}>
          <Heading as="h1" size="lg">
            Account
          </Heading>
          <Panel>
            <Text fontSize="sm" color="fg.muted" mb={1}>
              Signed in as
            </Text>
            <Text fontWeight="semibold" color="fg.strong" wordBreak="break-all">
              {user.email}
            </Text>
          </Panel>
          <Panel>
            <Flex direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }} justify="space-between" gap={4}>
              <Box>
                <Heading as="h2" size="sm" color="fg.strong" mb={1}>
                  Delete account
                </Heading>
                <Text fontSize="sm" color="fg.muted">
                  Deletes your account and {whatGoes}. This can’t be undone.
                </Text>
              </Box>
              <Button variant="danger" size="md" flexShrink={0} alignSelf={{ base: 'flex-start', sm: 'center' }} onClick={confirmDialog.onOpen}>
                Delete account
              </Button>
            </Flex>
          </Panel>
        </Stack>
      </Container>
      <DeleteAccountDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.onClose}
        whatGoes={whatGoes}
        onConfirm={confirmDelete}
      />
    </Flex>
  );
};

export default AccountPage;
