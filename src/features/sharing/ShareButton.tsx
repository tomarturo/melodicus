import { useMemo } from 'react';
import {
  Button,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { ShareFat } from '@phosphor-icons/react';
import type { Section } from '../sections/types';
import { buildShareUrl } from './shareFormat';

interface ShareButtonProps {
  videoId: string;
  savedSections: Section[];
}

/** Link to this video, carrying its saved loops when there are any. */
export const shareLinkFor = (origin: string, videoId: string, sections: Section[]) =>
  sections.length > 0 ? buildShareUrl(origin, videoId, sections) : `${origin}/video/${encodeURIComponent(videoId)}`;

/**
 * An icon button that opens a copy-link dialog. With saved loops the link
 * brings them along; without, it shares the song on its own.
 */
const ShareButton = ({ videoId, savedSections }: ShareButtonProps) => {
  const toast = useToast();
  const dialog = useDisclosure();
  const link = useMemo(() => shareLinkFor(window.location.origin, videoId, savedSections), [videoId, savedSections]);
  const count = savedSections.length;

  const copy = () =>
    navigator.clipboard.writeText(link).then(
      () => toast({ title: 'Link copied', status: 'success', duration: 3000 }),
      () => toast({ title: 'Could not copy the link', description: 'Select it and copy it instead.', status: 'error', duration: 4000 }),
    );

  return (
    <>
      <IconButton
        aria-label="Share"
        icon={<Icon as={ShareFat} boxSize="16px" />}
        onClick={dialog.onOpen}
        variant="loud"
        boxSize="32px"
        minW="32px"
      />
      <Modal isOpen={dialog.isOpen} onClose={dialog.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{count > 0 ? 'Share this song and its loops' : 'Share this song'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                {count > 0
                  ? `Anyone with this link opens this video with your ${count === 1 ? 'loop' : `${count} loops`}, ready to import.`
                  : 'Anyone with this link opens this video in Melodicus.'}
              </Text>
              <Input
                value={link}
                isReadOnly
                aria-label="Share link"
                variant="filled"
                rounded="full"
                bg="bg.muted"
                fontFamily="mono"
                fontSize="sm"
                onFocus={(event) => event.currentTarget.select()}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="quiet" onClick={() => window.open(link, '_blank')}>
                Open in new tab
              </Button>
              <Button variant="pill" onClick={copy}>
                Copy link
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ShareButton;
