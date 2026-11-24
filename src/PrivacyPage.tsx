import type { ReactNode } from 'react';
import { Box, Container, Flex, Heading, Link, Stack, Text } from '@chakra-ui/react';

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <Box p={{ base: 5, md: 6 }} bg="bg.surface" border="1px" borderColor="border.subtle" borderRadius="xl">
    <Heading as="h2" size="sm" color="fg.strong" mb={2}>
      {title}
    </Heading>
    <Stack spacing={2} fontSize="sm" color="fg.muted">
      {children}
    </Stack>
  </Box>
);

/** What Melodicus collects, in plain words. */
const PrivacyPage = () => (
  <Flex direction="column" flex="1" bg="bg.panel" borderRadius={['none', 'none', 'xl']} minH="0" overflowY="auto" overscrollBehavior="contain">
    <Container w="100%" pt={{ base: 6, md: 12 }} pb="8">
      <Stack spacing={6}>
        <Heading as="h1" size="lg">
          Privacy
        </Heading>
        <Section title="Analytics">
          <Text>
            Melodicus uses Google Analytics to count visits and see which features get used: the pages you open, the
            YouTube videos you play, what you do with loops (saving, renaming, playing, sharing), and your browser,
            device and country.
          </Text>
          <Text>
            It records what you search for, to learn which songs people look for, but leaves out anything that looks
            like an email address, a link or a phone number. It doesn’t record the loops in share links. If you’re in
            the EU, the EEA, the UK or Switzerland, Google Analytics stores no cookies on your device.
          </Text>
          <Text>Melodicus shows no ads, and nothing is used for advertising.</Text>
        </Section>
        <Section title="Your account">
          <Text>
            If you sign up, your email address, saved songs and loops are stored with Supabase so they follow you
            between devices. Without an account, your loops stay in this browser and are never sent anywhere.
          </Text>
          <Text>
            You can delete your account and everything in it from the Account page. Melodicus keeps counts of what
            happened, like how many loops were made on a given day, but they no longer point to you once your account
            is gone.
          </Text>
        </Section>
        <Section title="Questions">
          <Text>
            Melodicus is open source. Ask anything on{' '}
            <Link href="https://github.com/tomarturo/melodicus/issues" isExternal textDecoration="underline">
              GitHub
            </Link>
            .
          </Text>
        </Section>
      </Stack>
    </Container>
  </Flex>
);

export default PrivacyPage;
