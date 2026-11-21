import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import getYoutubeID from 'get-youtube-id';
import {
  Box,
  Container,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import HintRow from './components/HintRow';

/**
 * Shown when the day's YouTube search quota is used up: search on YouTube
 * itself, then paste the video's link here.
 */
const SearchQuotaError = ({ query }: { query: string }) => {
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
    <Container maxW="2xl" pt={{ base: 8, md: 12 }} pb={12}>
      <Stack spacing={6} textAlign="center">
        <Heading as="h1" size="xl" sx={{ textWrap: 'balance' }}>
          We can’t search YouTube right now
        </Heading>
        <Text color="fg.default">
          Our search allowance for today is used up.{' '}
          <Link
            isExternal
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
            fontWeight="semibold"
            color="fg.strong"
            textDecoration="underline"
            textUnderlineOffset="3px"
            display="inline-flex"
            alignItems="center"
            gap="2px"
          >
            Search on YouTube
            <Icon as={ArrowUpRight} boxSize="14px" />
          </Link>{' '}
          instead, then paste the video’s link here.
        </Text>
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
      </Stack>
    </Container>
  );
};

export default SearchQuotaError;
