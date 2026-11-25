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

// Quick-add words, capitalized as they'd start a name ("Solo"). Added after a
// word they're lowercase, in the app's sentence case: "Verse riff". The parts
// people learn by ear come first, then a song's sections in the order they play.
const MUSIC_TERMS = ['Melody', 'Solo', 'Intro', 'Verse', 'Chorus', 'Bridge', 'Outro', 'Riff', 'Lick'];
// Numbers, and letters for sections (A, B), which stay uppercase: "Solo A".
const NUMBERS_AND_LETTERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

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
  /** Adds a suggestion to the name; a word after the first is lowercased, unless keepCase. */
  const addToName = (text: string, keepCase = false) => {
    const current = sectionName.trimEnd();
    onSectionNameChange(current ? `${current} ${keepCase ? text : text.toLowerCase()}` : text);
  };

  return (
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>
        {isEditing ? 'Rename Loop' : 'Name This Loop'}
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
                {MUSIC_TERMS.map((term) => (
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
                    onClick={() => addToName(term)}
                    flexShrink={0}
                  >
                    {term}
                  </Button>
                ))}
              </HStack>
            </Box>
            <Box overflowX="auto" pb="2" sx={scrollRow}>
              <HStack spacing="1" minW="max-content" pr={FADE_WIDTH}>
                {NUMBERS_AND_LETTERS.map((item) => (
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
                    onClick={() => addToName(item, true)}
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
          loadingText="Saving"
          onClick={onSave}>
            {isEditing ? 'Save' : 'Save Loop'}
          </Button>
        </HStack>
      </ModalFooter>
    </ModalContent>
  </Modal>
  );
};

export default SectionNameModal;