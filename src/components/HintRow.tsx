import type { ReactNode } from 'react';
import { Badge, Box, Center, HStack, Text } from '@chakra-ui/react';

type HintTone = 'tip' | 'error';

// One line of hint text, and the badge's height.
const HINT_LINE = '20px';

/**
 * The small uppercase label (PRO TIP, TRY AGAIN). A fixed-height flex box
 * with a line height of 1, so its letters sit in the middle rather than on
 * an inherited line box.
 */
export const HintBadge = ({ tone, children }: { tone: HintTone; children: ReactNode }) => (
  <Badge
    colorScheme={tone === 'error' ? 'red' : 'purple'}
    display="inline-flex"
    alignItems="center"
    // The same height as a line of the text beside it, so centered on one line
    // or on two the badge lands on a whole pixel.
    h={HINT_LINE}
    px={1.5}
    lineHeight={1}
    flexShrink={0}
  >
    {/* The font's box leaves room for descenders that capitals never use, so
        the letters sat high. Trimming this block to cap height and baseline
        lets the flex centering center the letters themselves. Browsers
        without text-box (Firefox, for now) keep the line-height centering. */}
    <Box as="span" display="block" sx={{ textBox: 'trim-both cap alphabetic' }}>
      {children}
    </Box>
  </Badge>
);

interface HintRowProps {
  tone: HintTone;
  badge: string;
  children: ReactNode;
}

/**
 * A badge and its line of text, centered under a field: the pro tip, or the
 * try-again error it turns into. Badge and text are centered on each other,
 * on one line or wrapped.
 */
const HintRow = ({ tone, badge, children }: HintRowProps) => (
  <Center role={tone === 'error' ? 'alert' : undefined}>
    <HStack align="center" spacing={2}>
      <HintBadge tone={tone}>{badge}</HintBadge>
      <Text
        fontSize="sm"
        lineHeight={HINT_LINE}
        textAlign={['left', 'left', 'center']}
        color={tone === 'error' ? 'red.500' : 'inherit'}
      >
        {children}
      </Text>
    </HStack>
  </Center>
);

export default HintRow;
