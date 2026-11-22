import { Container, Flex, Heading, Icon, Link, Stack, Text } from '@chakra-ui/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import VideoLinkForm from './components/VideoLinkForm';

/** Shown for a link that didn't give us a video: find it on YouTube and paste it again. */
const NullVideoPage = () => (
  <Flex direction="column" flex="1" minH="0" overflowY="auto" overscrollBehavior="contain" bg="bg.panel" borderRadius={['none', 'none', 'xl']}>
    <Container maxW="2xl" pt={{ base: 8, md: 12 }} pb={12}>
      <Stack spacing={6} textAlign="center">
        <Heading as="h1" size="xl" sx={{ textWrap: 'balance' }}>
          We’re having trouble with the link you provided
        </Heading>
        <Text color="fg.default">
          <Link
            isExternal
            href="https://www.youtube.com/"
            fontWeight="semibold"
            color="fg.strong"
            display="inline-flex"
            alignItems="center"
            gap="2px"
          >
            Open YouTube
            {/* Bold, to match the link's weight. */}
            <Icon as={ArrowUpRight} weight="bold" />
          </Link>{' '}
          find your next song, then paste the link here.
        </Text>
        <VideoLinkForm />
      </Stack>
    </Container>
  </Flex>
);

export default NullVideoPage;
