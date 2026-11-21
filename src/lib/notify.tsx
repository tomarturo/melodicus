import { useCallback } from 'react';
import { Box, Button, Flex, Icon, IconButton, Text, useToast } from '@chakra-ui/react';
import { CheckCircle, Warning, WarningCircle, X } from '@phosphor-icons/react';

/**
 * The app's one toast. Every notice is ink with white text; a small colored
 * icon carries the tone, so they all look like they belong to Melodicus.
 */
export type NoticeTone = 'neutral' | 'success' | 'warning' | 'error';

export interface Notice {
  tone?: NoticeTone;
  title: string;
  description?: string;
  /** A single action, like Undo or Try again. Taking it closes the toast. */
  action?: { label: string; onClick: () => void };
  /** In milliseconds. Errors default to staying until closed. */
  duration?: number | null;
}

const DEFAULT_DURATION_MS = 4000;

const TONE_ICON = {
  success: { icon: CheckCircle, color: 'green.300' },
  warning: { icon: Warning, color: 'orange.300' },
  error: { icon: WarningCircle, color: 'red.300' },
} as const;

interface NoticeViewProps extends Notice {
  onClose: () => void;
  isClosable: boolean;
}

const NoticeView = ({ tone = 'neutral', title, description, action, onClose, isClosable }: NoticeViewProps) => {
  const toneIcon = tone === 'neutral' ? null : TONE_ICON[tone];
  return (
    <Flex
      // Chakra's wrapper is already a polite status region; errors interrupt.
      role={tone === 'error' ? 'alert' : undefined}
      align="flex-start"
      gap={3}
      bg="ink"
      color="white"
      pl={4}
      pr={isClosable ? 2 : 4}
      py={3}
      borderRadius="lg"
      boxShadow="lg"
      // One width for every toast, so a stack lines up.
      w={{ base: 'calc(100vw - 32px)', sm: '400px' }}
    >
      {toneIcon && <Icon as={toneIcon.icon} weight="fill" boxSize="18px" color={toneIcon.color} mt="1px" flexShrink={0} />}
      <Box flex="1" minW="0">
        <Text fontSize="sm" fontWeight="medium">
          {title}
        </Text>
        {description && (
          <Text fontSize="sm" color="whiteAlpha.700" mt={0.5}>
            {description}
          </Text>
        )}
      </Box>
      {action && (
        <Button
          size="sm"
          variant="link"
          color="white"
          fontWeight="semibold"
          alignSelf="center"
          flexShrink={0}
          onClick={() => {
            action.onClick();
            onClose();
          }}
        >
          {action.label}
        </Button>
      )}
      {isClosable && (
        <IconButton
          aria-label="Close"
          icon={<Icon as={X} boxSize="14px" />}
          size="xs"
          variant="ghost"
          color="whiteAlpha.700"
          borderRadius="md"
          _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
          onClick={onClose}
          flexShrink={0}
        />
      )}
    </Flex>
  );
};

/** Shows a notice. Errors stay until closed; everything else fades after 4s. */
export function useNotify() {
  const toast = useToast();
  return useCallback(
    (notice: Notice) => {
      const duration =
        notice.duration !== undefined ? notice.duration : notice.tone === 'error' ? null : DEFAULT_DURATION_MS;
      return toast({
        duration,
        render: ({ onClose }) => <NoticeView {...notice} onClose={onClose} isClosable={duration === null} />,
      });
    },
    [toast],
  );
}
