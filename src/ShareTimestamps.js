import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  Icon,
  Text,
  HStack,
  Input,
  Box,
  VStack
} from '@chakra-ui/react';
import { Paperclip } from 'lucide-react';

const ShareTimestamps = ({ videoId, savedSections }) => {
  const toast = useToast();
  const [shareableLink, setShareableLink] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  
  // Generate the shareable link when modal opens
  useEffect(() => {
    if (isOpen) {
      createShareableLink();
    }
  }, [isOpen]);
  
  // Check if there are sections to share before opening the modal
  const handleOpen = () => {
    if (!savedSections || savedSections.length === 0) {
      toast({
        title: 'No loops to save',
        description: 'Isolate the part of the song you want to practice then click Add Loop',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Open the modal if there are sections
    onOpen();
  };
  
  // Create a shareable link with encoded timestamps
  const createShareableLink = () => {
    if (!savedSections || savedSections.length === 0) {
      setShareableLink('');
      return null;
    }
    
    try {
      const simplifiedSections = savedSections.map(section => ({
        id: section.id,
        name: section.name,
        start_time: section.start_time,
        end_time: section.end_time,
        video_id: videoId,
        video_title: section.video_title || ''
      }));
      
      // Convert sections to a compressed string representation
      const sectionsString = JSON.stringify(simplifiedSections);
      const encodedData = btoa(encodeURIComponent(sectionsString));
      
      // Create a URL with the encoded data as a query parameter
      const url = new URL(window.location.origin);
      
      // For direct link to video page
      url.pathname = `/video/${videoId}`;
      
      // Add the encoded sections data
      url.searchParams.set('sections', encodedData);
      
      // Store the full URL
      const shareableUrl = url.toString();
      setShareableLink(shareableUrl);
      
      return shareableUrl;
    } catch (error) {
      console.error('Error creating shareable link:', error);
      toast({
        title: 'Error creating link',
        description: 'There was an error creating your shareable link.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }
  };
  
  // Handle copy to clipboard
  const handleCopyShareableLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink)
        .then(() => {
          toast({
            title: 'Link copied',
            description: 'Your unique link has been copied to the clipboard.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        })
        .catch((error) => {
          console.error('Error copying to clipboard:', error);
          toast({
            title: 'Copy failed',
            description: 'Failed to copy link to clipboard.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  };
  
  // Handle email share
  const handleEmailShare = () => {
    if (shareableLink) {
      // Create email content
      const subject = encodeURIComponent('YouTube Video Sections');
      const body = encodeURIComponent(`Check out these sections I found in this video:\n\n${shareableLink}`);
      
      // Open default email client
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      
    }
  };

  // Handle open in new tab
  const handleOpenInNewTab = () => {
    if (shareableLink) {
      // Use a simple window.open approach
      window.open(shareableLink, '_blank');
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        leftIcon={<Icon as={Paperclip} />}
        size='lg'
        width="153px"
        rounded='full'
        variant='filled'
        bg="blackAlpha.100"
        border="1px"
        color="blackAlpha.800"
        borderColor="blackAlpha.200"
        _hover={{ 
          boxShadow: "0 0 0 1px", 
          boxShadowColor: "blackAlpha.900", 
          bg:"blackAlpha.200", 
          borderColor:"blackAlpha.700", 
          color:"blackAlpha.900"
        }}
        aria-label="Save"
      >
        Save
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Loops saved to link</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                We saved your loops to a unique link. Copy this link or add it to your browser bookmarks.
              </Text>
              <Box>
                <Input
                  value={shareableLink}
                  isReadOnly
                  variant="filled"
                  rounded='full'
                  size="md"
                  bg="blackAlpha.100"
                  fontFamily="mono"
                  fontSize="sm"
                  overflow="hidden"
                  whiteSpace="nowrap"
                  _hover={{boxShadow: "0 0 0 1px", boxShadowColor: "blackAlpha.800", bg: "blackAlpha.200", borderColor: "blackAlpha.700", color: "blackAlpha.900"}}
                />
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={4} width="100%" justifyContent="end">
              <Button
                size="md"
                rounded="full"
                bg="none"
                color="blackAlpha.800"
                border="1px"
                borderColor="blackAlpha.300"
                _hover={{
                  boxShadow: "0 0 0 1px", boxShadowColor: "blackAlpha.800", bg: "blackAlpha.200", borderColor: "blackAlpha.700", color: "blackAlpha.900"
                }}
                onClick={handleOpenInNewTab}
              >
                Open in new tab
              </Button>
              <Button
                size="md"
                rounded="full"
                bg="blackAlpha.100"
                border="1px"
                color="blackAlpha.800"
                borderColor="blackAlpha.200"
                _hover={{
                  boxShadow: "0 0 0 1px", boxShadowColor: "blackAlpha.800", bg: "blackAlpha.200", borderColor: "blackAlpha.700", color: "blackAlpha.900"
                }}
                onClick={handleCopyShareableLink}
              >
                Copy link
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ShareTimestamps;