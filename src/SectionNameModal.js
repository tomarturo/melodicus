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
          placeholder="Loop name (optional)"
          value={sectionName}
          onChange={(e) => onSectionNameChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') onSave();
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button colorScheme="blue" mr={3} onClick={onSave}>
          {isEditing ? 'Update' : 'Save Loop'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export default SectionNameModal;