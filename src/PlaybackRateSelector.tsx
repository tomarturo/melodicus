import type { ChangeEvent } from 'react';
import { Box, Flex, IconButton, Select, type SystemStyleObject } from '@chakra-ui/react';
import { Plus, Minus } from '@phosphor-icons/react';
import { HOVER_EDGE, HOVER_RING } from './theme';

/**
 * The playback row's standard height, shared with Restart. Phones keep 44px,
 * the smallest comfortable tap target; desktop goes to 40px.
 */
export const CONTROL_HEIGHT = { base: '44px', md: '40px' } as const;

const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface PlaybackRateSelectorProps {
  /** The current speed, from the player controller. */
  rate: number;
  onRateChange: (rate: number) => void;
}

// Each part of the split button fills on hover; the outline belongs to the whole.
const segment: SystemStyleObject = {
  h: '100%',
  rounded: 'none',
  bg: 'transparent',
  color: 'fg.default',
  _hover: { bg: 'bg.mutedHover', color: 'fg.strong', _disabled: { bg: 'transparent', color: 'fg.default' } },
  _active: { bg: 'bg.mutedHover' },
  // Drawn inside, since the rounded outline clips anything outside.
  _focusVisible: { boxShadow: 'inset 0 0 0 2px var(--chakra-colors-border-focus)' },
};

// Full height, meeting the outline top and bottom, in the outline's color.
const Divider = () => <Box w="1px" alignSelf="stretch" bg="border.default" flexShrink={0} aria-hidden />;

/** Speed as one split button: step down, pick from the list, step up. */
function PlaybackRateSelector({ rate, onRateChange }: PlaybackRateSelectorProps) {
  const index = RATES.indexOf(rate);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => onRateChange(parseFloat(event.target.value));

  return (
    <Flex
      role="group"
      aria-label="Playback speed"
      align="center"
      h={CONTROL_HEIGHT}
      rounded="full"
      overflow="hidden"
      bg="bg.muted"
      border="1px"
      borderColor="border.default"
      flexShrink={0}
      // The same hover edge as the pill buttons beside it.
      _hover={{ boxShadow: HOVER_RING, borderColor: HOVER_EDGE }}
    >
      <IconButton
        sx={segment}
        w="40px"
        minW="40px"
        pl="1"
        isDisabled={index <= 0}
        onClick={() => onRateChange(RATES[index - 1]!)}
        icon={<Minus size={16} />}
        aria-label="Decrease playback rate"
      />
      <Divider />
      <Select
        variant="unstyled"
        size="md"
        h="100%"
        // Wide enough for the longest label ("0.25x") beside the chevron, so
        // no speed is clipped, and the control doesn't change width with it.
        w="96px"
        pl="3.5"
        fontWeight="semibold"
        sx={segment}
        aria-label="Playback rate"
        value={rate.toString()}
        onChange={handleChange}
      >
        {RATES.map((option) => (
          <option key={option} value={option}>
            {option}x
          </option>
        ))}
      </Select>
      <Divider />
      <IconButton
        sx={segment}
        w="40px"
        minW="40px"
        pr="1"
        icon={<Plus size={16} />}
        onClick={() => onRateChange(RATES[index + 1]!)}
        isDisabled={index === RATES.length - 1}
        aria-label="Increase playback rate"
      />
    </Flex>
  );
}

export default PlaybackRateSelector;
