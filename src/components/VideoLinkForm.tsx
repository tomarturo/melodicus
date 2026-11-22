import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';
import { Box, Icon, IconButton, Input, InputGroup, InputRightElement } from '@chakra-ui/react';
import { ArrowRight } from '@phosphor-icons/react';
import HintRow from './HintRow';

/**
 * Paste a YouTube link and open the video here. A link it can't read gets the
 * try-again badge instead of a broken video page.
 */
const VideoLinkForm = () => {
  const navigate = useNavigate();
  const [videoLink, setVideoLink] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);

  const openVideo = (event: FormEvent) => {
    event.preventDefault();
    const videoId = getYoutubeID(videoLink.trim());
    if (!videoId) {
      setIsInvalid(true);
      return;
    }
    navigate(`/video/${videoId}`);
  };

  return (
    <form onSubmit={openVideo} noValidate>
      <InputGroup>
        <Input
          rounded="full"
          variant="filled"
          bg="bg.muted"
          _hover={{ bg: 'bg.mutedHover' }}
          _focus={{ bg: 'bg.muted', borderColor: 'border.focus' }}
          _placeholder={{ opacity: 1, color: 'fg.placeholder' }}
          borderColor={isInvalid ? 'red.500' : 'transparent'}
          pr="2.75rem"
          type="url"
          aria-label="YouTube link"
          aria-invalid={isInvalid}
          placeholder="Paste a YouTube link"
          value={videoLink}
          onChange={(event) => {
            setVideoLink(event.target.value);
            setIsInvalid(false);
          }}
        />
        <InputRightElement>
          <IconButton
            type="submit"
            aria-label="Open video"
            icon={<Icon as={ArrowRight} boxSize="16px" />}
            isRound
            size="sm"
            variant="loud"
          />
        </InputRightElement>
      </InputGroup>
      {isInvalid && (
        <Box mt={3}>
          <HintRow tone="error" badge="try again">
            That doesn’t look like a YouTube link.
          </HintRow>
        </Box>
      )}
    </form>
  );
};

export default VideoLinkForm;
