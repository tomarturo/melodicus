import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
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
  Gauge,
  Repeat,
  UserCircleDashed,
} from '@phosphor-icons/react';
import { loopPillStyle } from '../player/timeline/LoopPills';
import { LOOP_GRIP } from '../player/timeline/useWaveformTimeline';
import { TICK_COLOR, tickPath } from '../player/timeline/timelineLogic';
import { DEMO_LOOPS, DEMO_VIDEO_ID, demoPath } from './demo';

/**
 * Below the search on the homepage, for someone new: how Melodicus works, a
 * song to try it on, and what they get. The pictures are drawn from the
 * app's own controls, so they read as the real thing.
 */

const LOOP_FILL = 'rgba(128, 90, 213, 0.28)';
// How many of the demo's loop names to show before summing up the rest.
const DEMO_PILLS = 3;

/** A loop name as it looks above the timeline, drawn with the player's own pill style. */
const LoopPill = ({
  children,
  active = false,
  display = 'flex',
}: {
  children: ReactNode;
  active?: boolean;
  display?: string | Record<string, string>;
}) => (
  <Flex as="li" display={display} align="center" px={3} fontWeight="medium" sx={loopPillStyle(active)}>
    {children}
  </Flex>
);

/**
 * "+N more" after a row of loop pills: the pill's own height and type size,
 * so its text sits on the same line as theirs.
 */
const MorePill = ({
  count,
  display = 'flex',
  color = 'fg.muted',
}: {
  count: number;
  display?: string | Record<string, string>;
  color?: string;
}) => {
  const { h, fontSize } = loopPillStyle(false);
  return (
    <Flex as="li" display={display} align="center" h={h as string} px={1} fontSize={fontSize as string} color={color}>
      +{count} more
    </Flex>
  );
};

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

/** A loop edge's grip, at the player's own size: a full pill. */
const Grip = ({ left }: { left: string }) => (
  <Box
    position="absolute"
    top="50%"
    left={left}
    w={`${LOOP_GRIP.width}px`}
    h={`${LOOP_GRIP.height}px`}
    transform="translate(-50%, -50%)"
    bg="white"
    border={`${LOOP_GRIP.border}px solid`}
    borderColor="purple.700"
    borderRadius="full"
  />
);

const LoopPicture = () => (
  <Stack w="100%" spacing={3}>
    <Flex as="ul" listStyleType="none" gap={1.5}>
      <LoopPill>Full guitar solo</LoopPill>
      <LoopPill active>Solo part 1</LoopPill>
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

/** The homepage's dark bands: the demo and the closing call to action share one look. */
const DARK_BAND = {
  bg: 'ink',
  color: 'chrome.fg',
  borderRadius: '2xl',
  p: { base: 6, md: 8 },
} as const;

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
      {...DARK_BAND}
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
          variant="loudInverse"
          size="lg"
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
              <LoopPill key={loop.name} active={index === 0}>
                {loop.name}
              </LoopPill>
            ))}
            {rest > 0 && (
              <MorePill count={rest} color="chrome.fgMuted" />
            )}
          </Flex>
        )}
      </Stack>
    </Grid>
  );
};

// ---------------------------------------------------------------- Built for practice

/** How much of the grid a tile takes: a 2×2 square or a 1×1 square. */
type Size = 'feature' | 'square';

/*
 * Four columns on laptops: the big square, and four small ones beside it.
 *   [ Keep track       ][ Loops      ][ Speed  ]
 *   [ (2×2)            ][ No account ][ Share  ]
 */
const FEATURES: Array<{ icon: ElementType; title: string; body: string; size: Size }> = [
  {
    icon: MusicNotes,
    title: 'Keep track of every part',
    body: 'Every loop is named and saved with its song, so your parts are there next time.',
    size: 'feature',
  },
  { icon: Repeat, title: 'Unlimited loops', body: 'Mark as many parts as the song needs.', size: 'square' },
  { icon: Gauge, title: '0.25x to 2x', body: 'Slow down without dropping the pitch.', size: 'square' },
  {
    icon: UserCircleDashed,
    title: 'No account needed',
    body: 'Everything works right away. Log in when you want to keep your songs.',
    size: 'square',
  },
  { icon: ShareFat, title: 'Share your songs', body: 'Send a link and your teacher or bandmate gets the same loops.', size: 'square' },
];

// ---- The big tile's picture: the demo's solo, broken into its parts.

// The stretch of the song the picture shows, in seconds (2:10 to 3:05).
const PARTS_FROM = 130;
const PARTS_TO = 185;
const at = (seconds: number) => `${((seconds - PARTS_FROM) / (PARTS_TO - PARTS_FROM)) * 100}%`;
const formatClock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const FULL_SOLO = DEMO_LOOPS[0];
const SOLO_PARTS = DEMO_LOOPS.filter((loop) => loop.name?.startsWith('Solo part'));
// The part shown as picked, with its grips and the playhead inside it.
const PICKED = SOLO_PARTS[1];

// Loop names under the track, kept to two rows: fewer on phones.
const PILLS_SHOWN = { base: 3, md: 5 } as const;


const PartsPills = () => (
  <Flex as="ul" listStyleType="none" wrap="wrap" gap={1.5}>
    {DEMO_LOOPS.slice(0, PILLS_SHOWN.md).map((loop, index) => (
      <LoopPill key={loop.name} active={loop === PICKED} display={index < PILLS_SHOWN.base ? 'flex' : { base: 'none', md: 'flex' }}>
        {loop.name}
      </LoopPill>
    ))}
    <MorePill count={DEMO_LOOPS.length - PILLS_SHOWN.base} display={{ base: 'flex', md: 'none' }} />
    <MorePill count={DEMO_LOOPS.length - PILLS_SHOWN.md} display={{ base: 'none', md: 'flex' }} />
  </Flex>
);

/**
 * The player's tick lines for the stretch the picture shows, drawn by the
 * same code as the real track at this track's measured size.
 */
const TrackTicks = ({ from, to }: { from: number; to: number }) => {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const measure = () => setSize({ width: Math.round(svg.clientWidth), height: Math.round(svg.clientHeight) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  return (
    <Box
      as="svg"
      ref={ref}
      position="absolute"
      inset={0}
      w="100%"
      h="100%"
      shapeRendering="crispEdges"
      viewBox={size ? `0 0 ${size.width} ${size.height}` : undefined}
      aria-hidden
    >
      {size && size.width > 0 && (
        <path stroke={TICK_COLOR} strokeWidth={1} d={tickPath({ widthPx: size.width, heightPx: size.height, from, to })} />
      )}
    </Box>
  );
};

const PartsPicture = () => (
  <Stack spacing={4} aria-hidden>
    <Box>
      <Box position="relative" h={{ base: "72px", md: "88px" }} borderRadius="lg" bg="bg.muted" overflow="hidden">
        {/* Over the track's fill, under the loops, as on the video page. */}
        <TrackTicks from={PARTS_FROM} to={PARTS_TO} />
        {SOLO_PARTS.map((loop) => {
          const picked = loop === PICKED;
          return (
            <Box
              key={loop.name}
              position="absolute"
              insetY={0}
              left={at(loop.start_time)}
              w={`calc(${at(loop.end_time)} - ${at(loop.start_time)})`}
              bg={picked ? 'rgba(128, 90, 213, 0.45)' : LOOP_FILL}
              borderX={picked ? '2px solid' : '1px solid'}
              borderColor={picked ? 'purple.700' : 'purple.300'}
            />
          );
        })}
        {PICKED && (
          <>
            <Grip left={at(PICKED.start_time)} />
            <Grip left={at(PICKED.end_time)} />
            <Box
              position="absolute"
              insetY={0}
              w="2px"
              bg="ink"
              left={at(PICKED.start_time)}
              sx={{
                '@keyframes home-parts-sweep': { from: { left: at(PICKED.start_time) }, to: { left: at(PICKED.end_time) } },
                animation: 'home-parts-sweep 2.4s linear infinite',
                '@media (prefers-reduced-motion: reduce)': { animation: 'none', left: at((PICKED.start_time + PICKED.end_time) / 2) },
              }}
            />
          </>
        )}
      </Box>
      {FULL_SOLO && (
        <Box position="relative" h="18px" mt={2} fontSize="xs" fontWeight="semibold" color="fg.muted" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          <Text as="span" position="absolute" left={at(FULL_SOLO.start_time)} transform="translateX(-50%)">
            {formatClock(FULL_SOLO.start_time)}
          </Text>
          <Text as="span" position="absolute" left={at(FULL_SOLO.end_time)} transform="translateX(-50%)">
            {formatClock(FULL_SOLO.end_time)}
          </Text>
        </Box>
      )}
    </Box>
    <PartsPills />
  </Stack>
);

const WhatYouGet = () => (
  <Box as="section" aria-labelledby="what-you-get">
    <Heading id="what-you-get" as="h2" size="lg" color="fg.strong" mb={6}>
      Built for practice
    </Heading>
    <Grid
      as="ul"
      listStyleType="none"
      templateColumns={{ base: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }}
      // On laptops both rows are one height, near square, growing together
      // when one tile's copy needs more room.
      autoRows={{ lg: 'minmax(232px, 1fr)' }}
      gap={3}
    >
      {FEATURES.map((feature) => {
        const isFeature = feature.size === 'feature';
        return (
          <GridItem
            as="li"
            key={feature.title}
            // Two columns on tablets: the big tile spans the row and the rest
            // pair up. Four on laptops, where the small tiles are squares.
            colSpan={{ base: 1, md: isFeature ? 2 : 1, lg: feature.size === 'square' ? 1 : 2 }}
            rowSpan={{ base: 1, lg: isFeature ? 2 : 1 }}
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            gap={6}
            p={6}
            bg="bg.surface"
            border="1px"
            borderColor="border.subtle"
            borderRadius="xl"
          >
            {/* The big tile shows its promise; the rest an icon. */}
            {isFeature ? (
              // Centered in the room the title and copy leave.
              <Flex flex="1" direction="column" justify="center">
                <PartsPicture />
              </Flex>
            ) : (
              <Flex boxSize="48px" align="center" justify="center" borderRadius="xl" bg="purple.50" color="purple.700" flexShrink={0} aria-hidden>
                <Icon as={feature.icon} boxSize="28px" />
              </Flex>
            )}
            <Stack spacing={isFeature ? 2 : 1.5}>
              <Heading as="h3" fontSize={isFeature ? { base: 'xl', lg: '2xl' } : 'lg'} fontWeight="semibold" color="fg.strong">
                {feature.title}
              </Heading>
              <Text color="fg.muted" fontSize={isFeature ? 'md' : '15px'} lineHeight="1.5" maxW="44ch">
                {feature.body}
              </Text>
            </Stack>
          </GridItem>
        );
      })}
    </Grid>
  </Box>
);

// The band's vertical padding, which the repeat signs reach past to its edges.
const CTA_PAD_Y = { base: 10, md: 14 } as const;

/**
 * A repeat sign, as in sheet music: a thick bar, a thin bar and two dots
 * facing the music to repeat. The bars run 80% of the band's height,
 * centered; the dots keep the logomark's size and spacing. In the grey of
 * the demo card's thumbnail block: whiteAlpha.100 over the card, which is
 * ink.hover as a solid. The end sign is the start sign mirrored.
 */
const RepeatSign = ({ end = false }: { end?: boolean }) => (
  <Flex
    alignSelf="stretch"
    my={{ base: -CTA_PAD_Y.base, md: -CTA_PAD_Y.md }}
    direction={end ? 'row-reverse' : 'row'}
    align="center"
    gap={{ base: '3px', md: '6px' }}
    flexShrink={0}
    color="ink.hover"
    aria-hidden
  >
    <Box w={{ base: '6px', md: '10px' }} h="80%" bg="currentColor" />
    <Box w={{ base: '2px', md: '4px' }} h="80%" bg="currentColor" />
    <Flex direction="column" justify="center" gap={{ base: '14px', md: '24px' }} ml={end ? 0 : { base: '4px', md: '6px' }} mr={end ? { base: '4px', md: '6px' } : 0}>
      <Box boxSize={{ base: '7px', md: '12px' }} borderRadius="full" bg="currentColor" />
      <Box boxSize={{ base: '7px', md: '12px' }} borderRadius="full" bg="currentColor" />
    </Flex>
  </Flex>
);

/** The page's last word: back up to the search, ready to type, between repeat signs. */
const FindYourSong = ({ onFindSong }: { onFindSong: () => void }) => (
  <Flex
    as="section"
    aria-labelledby="find-your-song"
    align="center"
    // The signs sit at the band's sides, inside its 24px (32px from tablets) padding.
    justify="space-between"
    gap={{ base: 3, sm: 6 }}
    {...DARK_BAND}
    py={CTA_PAD_Y}
    overflow="hidden"
  >
    <RepeatSign />
    <Stack flex="1" align="center" spacing={6} textAlign="center" minW="0">
      <Heading id="find-your-song" as="h2" size="xl" color="white" sx={{ textWrap: 'balance' }}>
        What will you learn first?
      </Heading>
      <Button
        variant="loudInverse"
        size="lg"
        leftIcon={<Icon as={MagnifyingGlass} weight="bold" boxSize="18px" />}
        onClick={onFindSong}
      >
        Find your song
      </Button>
    </Stack>
    <RepeatSign end />
  </Flex>
);

const HomeStory = ({ onFindSong }: { onFindSong: () => void }) => (
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
    <FindYourSong onFindSong={onFindSong} />
  </Stack>
);

export default HomeStory;
