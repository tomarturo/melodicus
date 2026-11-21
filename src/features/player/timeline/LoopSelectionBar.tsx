import { Box, Button, Flex, HStack, Icon, Text } from '@chakra-ui/react';
import { ArrowsClockwise, PlusCircle } from '@phosphor-icons/react';
import { formatLoopTime } from '../../../utils/formatTime';
import type { Section } from '../../sections/types';
import type { Loop } from '../loopLogic';
import type { SelectionStatus } from '../selection';

const fromTablet = { base: 'none', md: 'inline' } as const;
const phoneOnly = { base: 'inline', md: 'none' } as const;

interface LoopSelectionBarProps {
  loop: Loop;
  status: SelectionStatus;
  /** A save or update is in flight: actions show progress and ignore taps. */
  isBusy: boolean;
  onSaveNew: () => void;
  onUpdate: (section: Section) => void;
}

/**
 * The row under the track: what's selected, and what can be done with it.
 * Centered, with the times beside the action, so the action sits where the eye
 * already is. Always the same height, so the video area above doesn't jump.
 */
const LoopSelectionBar = ({ loop, status, isBusy, onSaveNew, onUpdate }: LoopSelectionBarProps) => (
  <Flex h="40px" mt={3} align="center" justify="center" gap={3} data-testid="loop-selection">
    {status.kind === 'none' ? (
      <Text fontSize="sm" color="fg.muted">
        Drag on the track to make a loop
      </Text>
    ) : (
      <Text fontSize="sm" color="fg.default" sx={{ fontVariantNumeric: 'tabular-nums' }} noOfLines={1} minW={0}>
        {status.kind === 'saved' && (
          <Text as="span" fontWeight="semibold">
            {status.section.name || 'Unnamed'} ·{' '}
          </Text>
        )}
        {formatLoopTime(loop.start)} – {formatLoopTime(loop.end)}
      </Text>
    )}

    {status.kind === 'new' && (
      <Button
        variant="pill"
        size="sm"
        leftIcon={<Icon as={PlusCircle} boxSize="18px" />}
        isLoading={isBusy}
        onClick={onSaveNew}
        flexShrink={0}
      >
        Save loop
      </Button>
    )}
    {status.kind === 'modified' && (
      <HStack spacing={2} flexShrink={0}>
        <Button variant="ghost" size="sm" rounded="full" isDisabled={isBusy} onClick={onSaveNew} aria-label="Save as new loop">
          <Box as="span" display={fromTablet}>
            Save as new
          </Box>
          <Box as="span" display={phoneOnly}>
            New
          </Box>
        </Button>
        <Button
          variant="pill"
          size="sm"
          leftIcon={<Icon as={ArrowsClockwise} boxSize="18px" />}
          isLoading={isBusy}
          onClick={() => onUpdate(status.section)}
          aria-label={`Update “${status.section.name || 'Unnamed'}”`}
        >
          {/* Phones drop the name, so the times beside it stay readable. */}
          <Box as="span" display={fromTablet}>
            Update “{status.section.name || 'Unnamed'}”
          </Box>
          <Box as="span" display={phoneOnly}>
            Update
          </Box>
        </Button>
      </HStack>
    )}
  </Flex>
);

export default LoopSelectionBar;
