import {
  Button,
  HStack,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import type { NewSection } from '../sections/types';
import { formatSecondsToDuration } from '../../utils/formatTime';

interface ImportSharedLoopsDialogProps {
  loops: NewSection[];
  /** False until the video's title has loaded, which saving to an account requires. */
  canImport: boolean;
  isImporting: boolean;
  onImport: () => void;
  onDismiss: () => void;
}

const ImportSharedLoopsDialog = ({ loops, canImport, isImporting, onImport, onDismiss }: ImportSharedLoopsDialogProps) => {
  const count = loops.length === 1 ? '1 loop' : `${loops.length} loops`;
  return (
    <Modal isOpen onClose={onDismiss}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Import {count}?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb="3">This link includes {count} for this video. Loops you already have are skipped.</Text>
          <List spacing="1" maxH="240px" overflowY="auto">
            {loops.map((loop, index) => (
              <ListItem key={index} fontSize="sm">
                <Text as="span" fontWeight="semibold">
                  {loop.name || 'Untitled loop'}
                </Text>{' '}
                <Text as="span" color="fg.muted">
                  {formatSecondsToDuration(loop.start_time)} – {formatSecondsToDuration(loop.end_time)}
                </Text>
              </ListItem>
            ))}
          </List>
        </ModalBody>
        <ModalFooter>
          <HStack gap="4">
            <Button rounded="full" variant="ghost" onClick={onDismiss}>
              Not now
            </Button>
            <Button
              rounded="full"
              bg="bg.inverse"
              color="fg.inverse"
              _hover={{ bg: 'bg.inverseHover' }}
              isDisabled={!canImport}
              isLoading={isImporting}
              loadingText="Importing"
              onClick={onImport}
            >
              {canImport ? `Import ${count}` : 'Loading video…'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImportSharedLoopsDialog;
