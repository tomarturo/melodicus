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
  HStack
} from '@chakra-ui/react';

const SectionNameModal = ({
  isOpen,
  onClose,
  isEditing,
  sectionName,
  onSectionNameChange,
  onSave,
}) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>
        {isEditing ? 'Edit Loop Name' : 'Name This Loop'}
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody>
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

export default SectionNameModal;