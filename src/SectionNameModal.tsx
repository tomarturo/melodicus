import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  HStack,
  VStack,
  Box
} from '@chakra-ui/react';

// The suggestion rows scroll sideways with no scrollbar; a fade at the right
// edge shows there's more. The rows end with matching padding, so the last
// suggestion can scroll clear of the fade.
const FADE_WIDTH = '40px';
const scrollRow = {
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
  maskImage: `linear-gradient(to right, black calc(100% - ${FADE_WIDTH}), transparent)`,
  WebkitMaskImage: `linear-gradient(to right, black calc(100% - ${FADE_WIDTH}), transparent)`,
} as const;

interface SectionNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  sectionName: string;
  onSectionNameChange: (value: string) => void;
  onSave: () => void;
  /** While true the save button shows progress and further saves are ignored. */
  isSaving: boolean;
}

const SectionNameModal = ({
  isOpen,
  onClose,
  isEditing,
  sectionName,
  onSectionNameChange,
  onSave,
  isSaving,
}: SectionNameModalProps) => {
  const musicTerms = ['lick', 'riff', 'solo', 'melody', 'chorus', 'verse', 'bridge', 'refrain', 'intro', 'outro', ];
  const numbersAndLetters = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g'];

  const handleQuickSelect = (text: string) => {
    const currentValue = sectionName || '';
    const newValue = currentValue ? `${currentValue} ${text}` : text;
    onSectionNameChange(newValue);
  };

  return (
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>
        {isEditing ? 'Edit Loop Name' : 'Name This Loop'}
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <VStack spacing="4" align="stretch">
          <Input
            rounded='full'
            variant='filled'
            bg="bg.muted"
            _hover={{ bg: "bg.mutedHover" }}
            _focus={{ bg: "bg.muted", borderColor: "border.focus" }}
            placeholder="Loop name (optional)"
            _placeholder={{ opacity: 1, color: 'fg.placeholder' }}
            value={sectionName}
            onChange={(e) => onSectionNameChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isSaving) onSave();
            }}
          />

            {/* <Text fontSize="md" color="fg.muted" mb="1">Quick add</Text> */}
            <Box overflowX="auto" pb="1" sx={scrollRow}>
              <HStack spacing="1" minW="max-content" pr={FADE_WIDTH}>
                {musicTerms.map((term) => (
                  <Button
                    key={term}
                    size="sm"
                    rounded="full"
                    bg="bg.subtle"
                    color="fg.default"
                    border="1px"
                    borderColor="border.default"
                    _hover={{ bg: "bg.muted", borderColor: "border.strongHover" }}
                    _active={{ bg: "bg.mutedHover" }}
                    onClick={() => handleQuickSelect(term)}
                    flexShrink={0}
                  >
                    {term}
                  </Button>
                ))}
              </HStack>
            </Box>
            <Box overflowX="auto" pb="2" sx={scrollRow}>
              <HStack spacing="1" minW="max-content" pr={FADE_WIDTH}>
                {numbersAndLetters.map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    rounded="full"
                    bg="bg.subtle"
                    color="fg.default"
                    border="1px"
                    borderColor="border.default"
                    _hover={{ bg: "bg.muted", borderColor: "border.strongHover" }}
                    _active={{ bg: "bg.mutedHover" }}
                    onClick={() => handleQuickSelect(item)}
                    flexShrink={0}
                    minW="40px"
                  >
                    {item}
                  </Button>
                ))}
              </HStack>
          </Box>
        </VStack>
      </ModalBody>
      <ModalFooter>
        <HStack gap="4">
          <Button w="100px" variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button
          w="130px"
          variant="pill"
          isLoading={isSaving}
          loadingText={isEditing ? 'Updating' : 'Saving'}
          onClick={onSave}>
            {isEditing ? 'Update' : 'Save Loop'}
          </Button>
        </HStack>
      </ModalFooter>
    </ModalContent>
  </Modal>
  );
};

export default SectionNameModal;