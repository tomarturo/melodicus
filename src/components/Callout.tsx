import type { ElementType, ReactNode } from 'react';
import { Flex, Icon, Text } from '@chakra-ui/react';

/**
 * A short note set apart in the loop purple, with an optional icon: help
 * that sits inside a dialog or page rather than under a single field.
 */
const Callout = ({ icon, children }: { icon?: ElementType; children: ReactNode }) => (
  <Flex align="flex-start" gap={2.5} px={4} py={3} bg="purple.50" borderRadius="lg" color="purple.900">
    {icon && <Icon as={icon} boxSize="18px" color="purple.700" flexShrink={0} mt="1px" />}
    <Text fontSize="sm" lineHeight="1.5">
      {children}
    </Text>
  </Flex>
);

export default Callout;
