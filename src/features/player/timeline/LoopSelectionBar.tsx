import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { ArrowsClockwise, PlusCircle } from '@phosphor-icons/react';
import type { Section } from '../../sections/types';
import type { SelectionStatus } from '../selection';

const fromTablet = { base: 'none', md: 'inline' } as const;
const phoneOnly = { base: 'inline', md: 'none' } as const;

interface LoopSelectionBarProps {
  status: SelectionStatus;
  /** A save or update is in flight: actions show progress and ignore taps. */
  isBusy: boolean;
  onSaveNew: () => void;
  onUpdate: (section: Section) => void;
  /** Drops a new selection, back to the hint. */
  onCancel: () => void;
  /** Cancels an edit: puts the saved loop back to its saved edges. */
  onReset: (section: Section) => void;
}

const textButton = { variant: 'ghost', size: 'sm', rounded: 'full' } as const;

/**
 * The row under the track: what can be done with the selection, centered
 * under it. Empty while a saved loop is selected as is; its pill shows which.
 * Always the same height, so the video area above doesn't jump as it changes.
 */
const LoopSelectionBar = ({ status, isBusy, onSaveNew, onUpdate, onCancel, onReset }: LoopSelectionBarProps) => (
  <Flex h="40px" mt={3} align="center" justify="center" gap={2} data-testid="loop-selection">
    {status.kind === 'none' && (
      <Text fontSize="sm" color="fg.muted">
        Drag on the track to make a loop
      </Text>
    )}

    {status.kind === 'new' && (
      <>
        <Button variant="pill" size="sm" leftIcon={<Icon as={PlusCircle} boxSize="18px" />} isLoading={isBusy} onClick={onSaveNew}>
          Save loop
        </Button>
        <Button {...textButton} isDisabled={isBusy} onClick={onCancel}>
          Cancel
        </Button>
      </>
    )}

    {status.kind === 'modified' && (
      <>
        <Button
          variant="pill"
          size="sm"
          leftIcon={<Icon as={ArrowsClockwise} boxSize="18px" />}
          isLoading={isBusy}
          onClick={() => onUpdate(status.section)}
          aria-label={`Update “${status.section.name || 'Unnamed'}”`}
        >
          {/* A long name would crowd a phone; the selected pill names the loop there. */}
          <Box as="span" display={fromTablet} maxW="16ch" overflow="hidden" textOverflow="ellipsis">
            Update “{status.section.name || 'Unnamed'}”
          </Box>
          <Box as="span" display={phoneOnly}>
            Update
          </Box>
        </Button>
        <Button {...textButton} isDisabled={isBusy} onClick={onSaveNew} aria-label="Save as new loop">
          Save as new
        </Button>
        <Button {...textButton} isDisabled={isBusy} onClick={() => onReset(status.section)}>
          Cancel
        </Button>
      </>
    )}
  </Flex>
);

export default LoopSelectionBar;
