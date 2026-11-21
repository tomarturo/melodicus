import type { ChangeEvent } from 'react';
import { Select, HStack, IconButton } from '@chakra-ui/react';
import { Plus, Minus } from '@phosphor-icons/react';
import { HOVER_EDGE, HOVER_RING } from './theme';

const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface PlaybackRateSelectorProps {
  /** The current speed, from the player controller. */
  rate: number;
  onRateChange: (rate: number) => void;
}

function PlaybackRateSelector({ rate, onRateChange }: PlaybackRateSelectorProps) {
  const index = RATES.indexOf(rate);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => onRateChange(parseFloat(event.target.value));

  return (
    <HStack maxW="fit-content">
      <IconButton
        size="sm"
        variant="pill"
        // On phones the select alone, so the controls fit one row.
        display={{ base: 'none', md: 'inline-flex' }}
        isDisabled={index <= 0}
        onClick={() => onRateChange(RATES[index - 1]!)}
        icon={<Minus size={20} />}
        aria-label="Decrease playback rate"
      />
      <Select
        size="lg"
        variant="filled"
        rounded="full"
        bg="bg.muted"
        border="1px"
        color="fg.default"
        borderColor="border.default"
        minW="100px"
        _hover={{
          // Matches the pill buttons beside it.
          boxShadow: HOVER_RING,
          bg: 'bg.mutedHover',
          borderColor: HOVER_EDGE,
          color: 'fg.strong',
        }}
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
      <IconButton
        size="sm"
        variant="pill"
        display={{ base: 'none', md: 'inline-flex' }}
        icon={<Plus size={20} />}
        onClick={() => onRateChange(RATES[index + 1]!)}
        isDisabled={index === RATES.length - 1}
        aria-label="Increase playback rate"
      />
    </HStack>
  );
}

export default PlaybackRateSelector;
