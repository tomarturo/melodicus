import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react';
import { errorCause } from '../../lib/errors';

// Typed to confirm, so the red button is never one slip away.
const CONFIRM_WORD = 'DELETE';

// The same filled, rounded field as the other dialogs.
const fieldStyle = {
  rounded: 'full',
  variant: 'filled',
  bg: 'bg.muted',
  _hover: { bg: 'bg.mutedHover' },
  _focus: { bg: 'bg.muted', borderColor: 'border.focus' },
  _placeholder: { opacity: 1, color: 'fg.placeholder' },
} as const;

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** What goes with the account, e.g. "your 3 songs and 12 loops". */
  whatGoes: string;
  onConfirm: () => Promise<void>;
}

const DeleteAccountDialog = ({ isOpen, onClose, whatGoes, onConfirm }: DeleteAccountDialogProps) => {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTyped('');
    setError(null);
  }, [isOpen]);

  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (cause) {
      setError(`Couldn’t delete your account. ${errorCause(cause)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose}>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader pb={1}>Delete your account?</ModalHeader>
        <ModalCloseButton isDisabled={busy} />
        <ModalBody>
          <Text fontSize="sm" color="fg.muted" mb={5}>
            This deletes your account and {whatGoes}, for good. It can’t be undone.
          </Text>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" color="fg.default">
                Type {CONFIRM_WORD} to confirm
              </FormLabel>
              <Input
                {...fieldStyle}
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                placeholder={CONFIRM_WORD}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
              />
            </FormControl>
            {error && (
              <Text role="alert" fontSize="sm" color="red.700">
                {error}
              </Text>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter gap={3} pt={6}>
          <Button variant="quiet" onClick={onClose} isDisabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isDisabled={!confirmed} isLoading={busy} loadingText="Deleting">
            Delete account
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeleteAccountDialog;
