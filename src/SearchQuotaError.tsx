import { Container, Heading, Icon, Link, Stack, Text } from '@chakra-ui/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import VideoLinkForm from './components/VideoLinkForm';

/**
 * Shown when the day's YouTube search quota is used up: search on YouTube
 * itself, then paste the video's link here.
 */
const SearchQuotaError = ({ query }: { query: string }) => {
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
            <Icon as={ArrowUpRight} weight="bold" boxSize="14px" />
          </Link>{' '}
          instead, then paste the video’s link here.
        </Text>
        <VideoLinkForm />
      </Stack>
    </Container>
  );
};

export default SearchQuotaError;
