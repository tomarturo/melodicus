import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Flex, Grid, GridItem, Heading, Icon, Image, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import {
  ArrowRight,
  MagnifyingGlass,
  Minus,
  MusicNotes,
  Plus,
  ShareFat,
  CaretDown,
} from '@phosphor-icons/react';
import { SongPill } from '../songs/SongListRow';
import { DEMO_LOOPS, DEMO_VIDEO_ID, demoPath } from './demo';

/**
 * Below the search on the homepage, for someone new: how Melodicus works, a
 * song to try it on, and what they get. The pictures are drawn from the
 * app's own controls, so they read as the real thing.
 */

const LOOP_FILL = 'rgba(128, 90, 213, 0.28)';
// How many of the demo's loop names to show before summing up the rest.
const DEMO_PILLS = 3;

/** A loop name as it looks above the timeline. */
const LoopPill = ({ children, active, onDark }: { children: ReactNode; active?: boolean; onDark?: boolean }) => (
  <Flex
    as="li"
    align="center"
    h="26px"
    px={3}
    borderRadius="full"
    fontSize="13px"
    fontWeight="medium"
    whiteSpace="nowrap"
    border="1.5px solid"
    borderColor={active ? 'purple.700' : 'purple.300'}
    bg={active ? 'purple.700' : onDark ? 'transparent' : 'bg.surface'}
    color={active ? 'white' : onDark ? 'purple.100' : 'purple.700'}
  >
    {children}
  </Flex>
);

// ---------------------------------------------------------------- Pictures

/**
 * The picture at the top of a step's tile, on the tile's own white: an inset
 * in the page's off-white would stripe page, card, page. A hairline sets it
 * apart from the copy below.
 */
const Stage = ({ children }: { children: ReactNode }) => (
  <Flex h="176px" align="center" justify="center" px={6} py={5} borderBottom="1px" borderColor="border.subtle" overflow="hidden" aria-hidden>
    {children}
  </Flex>
);

/** A placeholder result row: a thumbnail and two lines of text. */
const ResultSketch = ({ faded }: { faded?: boolean }) => (
  <Flex gap={2.5} align="center" opacity={faded ? 0.5 : 1}>
    <Flex w="72px" flexShrink={0} aspectRatio={16 / 9} borderRadius="md" bgGradient="linear(135deg, #3A3B40, ink)" align="center" justify="center">
      <Box borderLeft="8px solid rgba(255,255,255,0.85)" borderY="5px solid transparent" />
    </Flex>
    <Stack flex="1" spacing={1.5}>
      <Box h="8px" borderRadius="sm" bg="bg.mutedHover" />
      <Box h="8px" w="55%" borderRadius="sm" bg="bg.muted" />
    </Stack>
  </Flex>
);

const SearchPicture = () => (
  <Stack w="100%" spacing={2.5}>
    <Flex h="38px" align="center" justify="space-between" pl={3.5} pr={3} borderRadius="full" bg="bg.muted" fontSize="sm" color="fg.default">
      <Text as="span">
        kid charlemagne steely dan
        <Box
          as="span"
          display="inline-block"
          w="1.5px"
          h="16px"
          ml="1px"
          verticalAlign="-3px"
          bg="fg.default"
          sx={{ animation: 'home-blink 1.1s steps(1) infinite', '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}
        />
      </Text>
      <Icon as={MagnifyingGlass} boxSize="16px" />
    </Flex>
    <ResultSketch />
    <ResultSketch faded />
  </Stack>
);

const Grip = ({ left }: { left: string }) => (
  <Box position="absolute" top="50%" left={left} w="12px" h="22px" mt="-11px" ml="-6px" bg="white" border="2px solid" borderColor="purple.700" borderRadius="5px" />
);

const LoopPicture = () => (
  <Stack w="100%" spacing={3}>
    <Flex as="ul" listStyleType="none" gap={1.5}>
      <LoopPill>Full guitar solo</LoopPill>
      <LoopPill active>Solo section 1</LoopPill>
    </Flex>
    <Box position="relative" h="56px" borderRadius="lg" bg="bg.muted" overflow="hidden">
      <Box position="absolute" insetY={0} left={0} w="32%" bg="bg.mutedHover" />
      <Box position="absolute" insetY={0} left="44%" w="30%" bg={LOOP_FILL} borderX="2px solid" borderColor="purple.700" />
      <Grip left="44%" />
      <Grip left="74%" />
      <Box
        position="absolute"
        insetY={0}
        left="58%"
        w="2px"
        bg="ink"
        sx={{ animation: 'home-sweep 3.2s linear infinite', '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}
      />
    </Box>
    <Box position="relative" h="16px" fontSize="xs" fontWeight="semibold" color="fg.muted" sx={{ fontVariantNumeric: 'tabular-nums' }}>
      <Text as="span" position="absolute" left="44%" transform="translateX(-50%)">2:16</Text>
      <Text as="span" position="absolute" left="74%" transform="translateX(-50%)">2:25</Text>
    </Box>
  </Stack>
);

const RATES = ['0.25', '0.5', '0.75', '1', '1.5', '2'];

const SpeedPicture = () => (
  <Stack align="center" spacing={3}>
    <Flex h="40px" align="stretch" borderRadius="full" border="1px" borderColor="border.strong" bg="bg.muted" overflow="hidden" color="fg.default">
      <Flex w="40px" align="center" justify="center"><Icon as={Minus} boxSize="16px" /></Flex>
      <Flex w="84px" align="center" justify="center" gap={1.5} borderX="1px" borderColor="border.strong" fontWeight="semibold" color="fg.strong">
        0.75x <Icon as={CaretDown} boxSize="12px" weight="bold" />
      </Flex>
      <Flex w="40px" align="center" justify="center"><Icon as={Plus} boxSize="16px" /></Flex>
    </Flex>
    <Flex gap={1} fontSize="xs" fontWeight="semibold" color="fg.placeholder" sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {RATES.map((rate) => (
        <Box key={rate} px={1.5} py={0.5} borderRadius="md" bg={rate === '0.75' ? 'ink' : undefined} color={rate === '0.75' ? 'white' : undefined}>
          {rate}
        </Box>
      ))}
    </Flex>
  </Stack>
);

// ---------------------------------------------------------------- Sections

const STEPS = [
  { title: 'Find a song', body: 'Search by title and artist, or paste a YouTube link.', picture: <SearchPicture /> },
  { title: 'Loop the hard part', body: 'Drag across the timeline to mark a section. It repeats until you stop it.', picture: <LoopPicture /> },
  { title: 'Slow it down', body: 'Drop to half speed to hear every note, then speed back up as it sticks.', picture: <SpeedPicture /> },
];

const HowItWorks = () => (
  <Box as="section" aria-labelledby="how-it-works">
    <Stack spacing={2} textAlign="center" mb={7}>
      <Heading id="how-it-works" as="h2" size="lg" color="fg.strong" sx={{ textWrap: 'balance' }}>
        Tackle hard songs one part at a time
      </Heading>
      <Text color="fg.muted" fontSize="lg">
        Loop each tricky part, slow it down until it’s clean, then play the whole thing through.
      </Text>
    </Stack>
    {/* Each step is one tile: its picture, then its number, title and copy. */}
    <SimpleGrid as="ol" listStyleType="none" columns={{ base: 1, md: 3 }} spacing={6}>
      {STEPS.map((step, index) => (
        <Stack as="li" key={step.title} spacing={0} bg="bg.surface" border="1px" borderColor="border.subtle" borderRadius="xl" overflow="hidden">
          <Stage>{step.picture}</Stage>
          <Stack spacing={2.5} px={5} pt={5} pb={5}>
            <Flex as="h3" align="center" gap={2.5} fontSize="lg" fontWeight="semibold" color="fg.strong">
              <Flex as="span" w="24px" h="24px" flexShrink={0} align="center" justify="center" borderRadius="full" bg="ink" color="white" fontSize="13px" fontWeight="bold" lineHeight={1} aria-hidden>
                {/* Trimmed to the digit's own height, so it centers in the circle
                    (as in HintBadge); line-height 1 covers browsers without text-box. */}
                <Box as="span" display="block" sx={{ textBox: 'trim-both cap alphabetic' }}>
                  {index + 1}
                </Box>
              </Flex>
              {step.title}
            </Flex>
            <Text color="fg.muted" fontSize="15px" lineHeight="1.5">
              {step.body}
            </Text>
          </Stack>
        </Stack>
      ))}
    </SimpleGrid>
  </Box>
);

const DemoSong = () => {
  const shown = DEMO_LOOPS.slice(0, DEMO_PILLS);
  const rest = DEMO_LOOPS.length - shown.length;
  return (
    <Grid
      as="section"
      aria-labelledby="demo-song"
      templateColumns={{ base: 'minmax(0, 1fr)', md: 'minmax(0, 1.1fr) minmax(0, 1fr)' }}
      gap={7}
      alignItems="center"
      bg="ink"
      color="chrome.fg"
      borderRadius="2xl"
      p={{ base: 6, md: 8 }}
    >
      <Box>
        <Heading id="demo-song" as="h2" size="lg" color="white" mb={2.5}>
          Try it on a guitar solo
        </Heading>
        <Text color="chrome.fgMuted" fontSize="md" lineHeight="1.5" mb={6}>
          {DEMO_LOOPS.length > 0
            ? 'We’ve split the solo into short parts. Press play, pick a part, then slow it down.'
            : 'Press play, drag across the timeline to loop a part, then slow it down.'}
        </Text>
        <Button
          as={RouterLink}
          to={demoPath()}
          size="lg"
          h="44px"
          fontSize="md"
          borderRadius="full"
          bg="bg.panel"
          color="ink"
          _hover={{ bg: 'white' }}
          _active={{ bg: 'whiteAlpha.800' }}
          rightIcon={<Icon as={ArrowRight} weight="bold" boxSize="16px" />}
        >
          Open the demo
        </Button>
      </Box>
      <Stack spacing={3} p={3.5} bg="chrome.raised" border="1px" borderColor="whiteAlpha.100" borderRadius="xl" aria-hidden>
        <Image
          src={`https://img.youtube.com/vi/${DEMO_VIDEO_ID}/hqdefault.jpg`}
          alt=""
          aspectRatio={16 / 9}
          objectFit="cover"
          borderRadius="lg"
          bg="whiteAlpha.100"
        />
        {shown.length > 0 && (
          <Flex as="ul" listStyleType="none" wrap="wrap" gap={1.5} align="center">
            {shown.map((loop, index) => (
              <LoopPill key={loop.name} active={index === 0} onDark>
                {loop.name}
              </LoopPill>
            ))}
            {rest > 0 && (
              <Text as="li" fontSize="13px" color="chrome.fgMuted" px={1}>
                +{rest} more
              </Text>
            )}
          </Flex>
        )}
      </Stack>
    </Grid>
  );
};

// ---------------------------------------------------------------- What you get

/** A tile in the bento: a picture, a hairline, then a title and a line of copy. */
const FeatureTile = ({ title, body, picture, wide }: { title: string; body: string; picture: ReactNode; wide?: boolean }) => (
  <GridItem
    as="li"
    colSpan={{ base: 1, md: wide ? 2 : 1 }}
    display="flex"
    flexDirection="column"
    bg="bg.surface"
    border="1px"
    borderColor="border.subtle"
    borderRadius="xl"
    overflow="hidden"
  >
    <Stage>{picture}</Stage>
    <Stack spacing={1.5} p={5}>
      <Heading as="h3" fontSize="lg" fontWeight="semibold" color="fg.strong">
        {title}
      </Heading>
      <Text color="fg.muted" fontSize="15px" lineHeight="1.5">
        {body}
      </Text>
    </Stack>
  </GridItem>
);

/** A song as My songs lists it: the demo, with its parts. */
const SavedSongPicture = () => {
  const shown = DEMO_LOOPS.slice(0, 3);
  const rest = DEMO_LOOPS.length - shown.length;
  return (
    <Flex w="100%" maxW="460px" gap={4} align="center">
      {/* A background, so a thumbnail that can't load leaves a plain tile. */}
      <Box
        w={{ base: '96px', sm: '150px' }}
        flexShrink={0}
        aspectRatio={16 / 9}
        borderRadius="lg"
        bg="bg.muted"
        bgImage={`url(https://img.youtube.com/vi/${DEMO_VIDEO_ID}/mqdefault.jpg)`}
        bgSize="cover"
        bgPosition="center"
      />
      <Stack spacing={2} minW="0">
        <Box>
          <Text fontWeight="semibold" color="fg.strong" noOfLines={1}>
            Kid Charlemagne
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {DEMO_LOOPS.length} loops · Steely Dan
          </Text>
        </Box>
        <Flex as="ul" listStyleType="none" wrap="wrap" gap={1.5}>
          {shown.map((loop) => (
            <SongPill key={loop.name}>{loop.name}</SongPill>
          ))}
          {rest > 0 && (
            <Flex as="li" align="center" h="24px" px={1} fontSize="xs" color="fg.muted">
              +{rest} more
            </Flex>
          )}
        </Flex>
      </Stack>
    </Flex>
  );
};

/** The share dialog's link and its button. */
const SharePicture = () => (
  <Stack w="100%" spacing={3} align="center">
    <Box w="100%" h="38px" lineHeight="38px" px={4} borderRadius="full" bg="bg.muted" fontFamily="mono" fontSize="xs" color="fg.default" noOfLines={1} wordBreak="break-all">
      {`melodicus.xyz${demoPath()}`}
    </Box>
    <Flex h="32px" align="center" gap={2} px={4} borderRadius="full" bg="ink" color="white" fontSize="sm" fontWeight="semibold">
      <Icon as={ShareFat} boxSize="14px" />
      Copy link
    </Flex>
  </Stack>
);

/** A phone rising from the bottom of the tile, with the player on it. */
const PhonePicture = () => (
  <Box position="relative" w="132px" h="100%" alignSelf="flex-end" mb={-5}>
    <Stack position="absolute" inset={0} top={1} spacing={2} p={2} pb={0} bg="ink" borderTopRadius="22px">
      <Box mx="auto" w="34px" h="5px" borderRadius="full" bg="whiteAlpha.300" />
      <Box h="56px" borderRadius="md" bg="whiteAlpha.200" />
      <Box position="relative" h="26px" borderRadius="sm" bg="whiteAlpha.200" overflow="hidden">
        <Box position="absolute" insetY={0} left="38%" w="34%" bg="purple.300" borderX="2px solid" borderColor="purple.700" />
      </Box>
      <Flex justify="space-between" align="center" px={1}>
        <Box w="18px" h="18px" borderRadius="full" bg="whiteAlpha.300" />
        <Box w="26px" h="26px" borderRadius="full" bg="white" />
        <Box w="18px" h="18px" borderRadius="full" bg="whiteAlpha.300" />
      </Flex>
    </Stack>
  </Box>
);

/** The repertoire grid guests see on My songs, starting to fill. */
const GuestPicture = () => (
  <Box display="grid" gridTemplateColumns={{ base: 'repeat(6, 36px)', sm: 'repeat(6, 44px)' }} gap={{ base: 1.5, sm: 2 }}>
    {Array.from({ length: 6 }, (_, index) => {
      const filled = index < 2;
      return (
        <Flex
          key={index}
          align="center"
          justify="center"
          boxSize={{ base: '36px', sm: '44px' }}
          borderRadius="lg"
          {...(filled
            ? { bg: 'purple.700', color: 'white' }
            : { border: '2px dashed', borderColor: 'purple.200', color: 'purple.300' })}
        >
          <Icon as={MusicNotes} boxSize={{ base: '18px', sm: '22px' }} />
        </Flex>
      );
    })}
  </Box>
);

const WhatYouGet = () => (
  <Box as="section" aria-labelledby="what-you-get">
    <Heading id="what-you-get" as="h2" size="lg" color="fg.strong" mb={7}>
      What you get
    </Heading>
    {/* Wide, narrow; then narrow, wide, so the two rows don't match. */}
    <Grid as="ul" listStyleType="none" templateColumns={{ base: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' }} gap={6}>
      <FeatureTile
        wide
        title="Keep track of every part"
        body="Every loop is named and saved with its song, so your parts are there next time."
        picture={<SavedSongPicture />}
      />
      <FeatureTile title="Share your loops" body="Send a link and your teacher or bandmate gets the same loops." picture={<SharePicture />} />
      <FeatureTile title="Works on your phone" body="Prop it on the music stand. The controls are sized for thumbs." picture={<PhonePicture />} />
      <FeatureTile
        wide
        title="No account needed"
        body="Everything works right away. Log in when you want to keep your songs."
        picture={<GuestPicture />}
      />
    </Grid>
  </Box>
);

const HomeStory = () => (
  <Stack
    spacing={{ base: 14, md: 20 }}
    sx={{
      '@keyframes home-blink': { '50%': { opacity: 0 } },
      '@keyframes home-sweep': { from: { left: '44%' }, to: { left: '74%' } },
    }}
  >
    <HowItWorks />
    <DemoSong />
    <WhatYouGet />
  </Stack>
);

export default HomeStory;
