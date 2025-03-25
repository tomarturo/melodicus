import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Icon
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

const ShareTimestamps = ({ videoId, savedSections }) => {
  const toast = useToast();
  const [shareableLink, setShareableLink] = useState('');
  
  // Create a shareable link with encoded timestamps
  const createShareableLink = () => {
    if (!savedSections || savedSections.length === 0) {
      toast({
        title: 'No sections to share',
        description: 'You have no saved sections to share.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }
    
    try {
      const simplifiedSections = savedSections.map(section => ({
        id: section.id,
        name: section.name,
        start_time: section.start_time,
        end_time: section.end_time,
        video_id: videoId,
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
    const link = createShareableLink();
    
    if (link) {
      navigator.clipboard.writeText(link)
        .then(() => {
          toast({
            title: 'Link copied',
            description: 'Your shareable link has been copied to clipboard.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        })
        .catch((error) => {
          console.error('Error copying to clipboard:', error);
          toast({
            title: 'Copy failed',
            description: 'Failed to copy shareable link to clipboard.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  };
  
  // Handle email share
  const handleEmailShare = () => {
    const link = createShareableLink();
    
    if (link) {
      // Create email content
      const subject = encodeURIComponent('YouTube Video Sections');
      const body = encodeURIComponent(`Check out these sections I found in this video:\n\n${link}`);
      
      // Open default email client
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      
      toast({
        title: 'Email client opened',
        description: 'Your shareable link has been added to a new email.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle open in new tab
  const handleOpenInNewTab = () => {
    const link = createShareableLink();
    
    if (link) {
      // Use a simple window.open approach
      window.open(link, '_blank');
      
      toast({
        title: 'Opened in new tab',
        description: 'Your shareable link has been opened in a new tab. Click "Import Now" to apply the sections.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const ShareIcon = (props) => (
    <Icon viewBox="0 0 24 24" {...props}>
      <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
        <path fill-rule="evenodd" d="M14.516 6.743c-.41-.368-.443-1-.077-1.41a.99.99 0 0 1 1.405-.078l5.487 4.948.007.006A2.047 2.047 0 0 1 22 11.721a2.06 2.06 0 0 1-.662 1.51l-5.584 5.09a.99.99 0 0 1-1.404-.07 1.003 1.003 0 0 1 .068-1.412l5.578-5.082a.05.05 0 0 0 .015-.036.051.051 0 0 0-.015-.036l-5.48-4.942Zm-6.543 9.199v-.42a4.168 4.168 0 0 0-2.715 2.415c-.154.382-.44.695-.806.88a1.683 1.683 0 0 1-2.167-.571 1.705 1.705 0 0 1-.279-1.092V15.88c0-3.77 2.526-7.039 5.967-7.573V7.57a1.957 1.957 0 0 1 .993-1.838 1.931 1.931 0 0 1 2.153.184l5.08 4.248a.646.646 0 0 1 .012.011l.011.01a2.098 2.098 0 0 1 .703 1.57 2.108 2.108 0 0 1-.726 1.59l-5.08 4.25a1.933 1.933 0 0 1-2.929-.614 1.957 1.957 0 0 1-.217-1.04Z" clip-rule="evenodd" />
      </svg>
    </Icon>
  );

  return (
    <>
      <Menu>
        <MenuButton
          as={Button}
          leftIcon={<ShareIcon />}
          rightIcon={<ChevronDownIcon />}
          size='lg'
          rounded='full'
          variant='filled'
          bg="blackAlpha.100"
          border="1px"
          color="blackAlpha.800"
          borderColor="blackAlpha.200"
          _hover={{ 
              boxShadow: "0 0 0 1px", boxShadowColor: "blackAlpha.800", bg:"blackAlpha.200", borderColor:"blackAlpha.700", color:"blackAlpha.900"}}
          aria-label="Share Sections"
        >
          Share
        </MenuButton>
        <MenuList
        minW="0" w="190px"
        sx={{
          borderColor: 'transparent',
          padding: '4px',
          boxShadow: 'md'
        }}>
          <MenuItem 
          onClick={handleCopyShareableLink}
          fontWeight="medium" 
          fontSize="sm" 
          _hover={{bg: 'blackAlpha.100',
            color: 'blackAlpha.900',}}
          sx={{color: 'blackAlpha.800',
            fontWeight: 'medium',
            padding: '8px 12px',
            borderRadius: '4px',
            margin: '0 0 4px 0',
            _hover: {
              bg: 'blackAlpha.100',
              color: 'blackAlpha.900',}
            }}>
            Copy Link
          </MenuItem>
          <MenuItem 
          fontWeight="medium" 
          fontSize="sm" 
          onClick={handleEmailShare}
          sx={{color: 'blackAlpha.800',
            fontWeight: 'medium',
            padding: '8px 12px',
            borderRadius: '4px',
            margin: '0 0 4px 0',
            _hover: {
              bg: 'blackAlpha.100',
              color: 'blackAlpha.900',}
            }}
          >
            Email Link
          </MenuItem>
          <MenuItem 
          fontWeight="medium" 
          fontSize="sm" 
          onClick={handleOpenInNewTab}
          sx={{color: 'blackAlpha.800',
            fontWeight: 'medium',
            padding: '8px 12px',
            borderRadius: '4px',
            margin: '0 0 4px 0',
            _hover: {
              bg: 'blackAlpha.100',
              color: 'blackAlpha.900',}
            }}
          >
            Open in New Tab
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
};

export default ShareTimestamps;