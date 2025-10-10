import React from 'react';
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
  Box,
  Text
} from '@chakra-ui/react';

const SectionNameModal = ({
  isOpen,
  onClose,
  isEditing,
  sectionName,
  onSectionNameChange,
  onSave,
}) => {
  const musicTerms = ['lick', 'riff', 'solo', 'melody', 'chorus', 'verse', 'bridge', 'refrain', 'intro', 'outro', ];
  const numbersAndLetters = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g'];

  const handleQuickSelect = (text) => {
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
            bg="blackAlpha.100"
            _hover={{ bg: "blackAlpha.200" }}
            _focus={{ bg: "blackAlpha.100", borderColor: "blackAlpha.900" }}
            placeholder="Loop name (optional)"
            _placeholder={{ opacity: 1, color: 'blackAlpha.600' }}
            value={sectionName}
            onChange={(e) => onSectionNameChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') onSave();
            }}
          />

            {/* <Text fontSize="md" color="blackAlpha.700" mb="1">Quick add</Text> */}
            <Box overflowX="auto" pb="1">
              <HStack spacing="1" minW="max-content">
                {musicTerms.map((term) => (
                  <Button
                    key={term}
                    size="sm"
                    rounded="full"
                    bg="blackAlpha.50"
                    color="blackAlpha.800"
                    border="1px"
                    borderColor="blackAlpha.200"
                    _hover={{ bg: "blackAlpha.100", borderColor: "blackAlpha.400" }}
                    _active={{ bg: "blackAlpha.200" }}
                    onClick={() => handleQuickSelect(term)}
                    flexShrink={0}
                  >
                    {term}
                  </Button>
                ))}
              </HStack>
            </Box>
            <Box overflowX="auto" pb="2">
              <HStack spacing="1" minW="max-content">
                {numbersAndLetters.map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    rounded="full"
                    bg="blackAlpha.50"
                    color="blackAlpha.800"
                    border="1px"
                    borderColor="blackAlpha.200"
                    _hover={{ bg: "blackAlpha.100", borderColor: "blackAlpha.400" }}
                    _active={{ bg: "blackAlpha.200" }}
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
          <Button 
          w="100px"
          size="md"
          rounded="full"
          bg="none"
          color="blackAlpha.800"
          border="1px"
          borderColor="blackAlpha.300"
          _hover={{ bg:"blackAlpha.200", borderColor:"blackAlpha.100", border:"2px", color:"blackAlpha.900"}}
          onClick={onClose}>
            Cancel
          </Button>
          <Button
          w="130px"
          size='md'
          rounded='full'
          variant='filled'
          bg="blackAlpha.100"
          border="1px"
          color="blackAlpha.800"
          borderColor="blackAlpha.100"
          _hover={{ bg:"blackAlpha.200", borderColor:"blackAlpha.700", border:"2px", color:"blackAlpha.900"}}
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