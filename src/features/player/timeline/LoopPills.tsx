import { useMemo } from 'react';
import { Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Portal } from '@chakra-ui/react';
import { CaretDown, PencilSimpleLine, Trash } from '@phosphor-icons/react';
import { formatSecondsToDuration } from '../../../utils/formatTime';
import type { Section } from '../../sections/types';
import { orderedLoops } from './timelineLogic';

interface LoopPillsProps {
  sections: Section[];
  /** The saved loop the current selection is, or is being edited from, shown as selected. */
  activeSectionId: string | null;
  onSelectSection: (section: Section) => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (sectionId: string) => void;
  /** Hovering a pill highlights its span on the track. */
  onHighlight: (sectionId: string | null) => void;
}

/**
 * The saved loops as a fixed list in start-time order. Unlike labels on the
 * track, it doesn't move when the timeline zooms or scrolls; hovering a pill
 * highlights its span on the track instead.
 */
const LoopPills = ({
  sections,
  activeSectionId,
  onSelectSection,
  onEditSection,
  onDeleteSection,
  onHighlight,
}: LoopPillsProps) => {
  const loops = useMemo(() => orderedLoops(sections), [sections]);
  if (loops.length === 0) return null;

  return (
    <Flex as="ul" aria-label="Saved loops" listStyleType="none" wrap="wrap" gap="2" flex="1" minW="0">
      {loops.map((section) => {
        const name = section.name || 'Unnamed';
        const active = section.id === activeSectionId;
        return (
          <Flex
            as="li"
            key={section.id}
            align="center"
            h="30px"
            borderRadius="full"
            bg={active ? 'purple.700' : 'purple.50'}
            color={active ? 'bg.panel' : 'purple.800'}
            borderWidth="1px"
            borderColor={active ? 'purple.700' : 'purple.200'}
            fontSize="xs"
            whiteSpace="nowrap"
            onMouseEnter={() => onHighlight(section.id)}
            onMouseLeave={() => onHighlight(null)}
          >
            <Flex
              as="button"
              type="button"
              aria-current={active ? 'true' : undefined}
              title={`${formatSecondsToDuration(section.start_time)} – ${formatSecondsToDuration(section.end_time)}`}
              align="center"
              h="100%"
              pl="3"
              // Set on the button itself: buttons don't inherit font weight.
              fontWeight="medium"
              pr="1"
              onClick={() => onSelectSection(section)}
            >
              <span>{name}</span>
            </Flex>
            <Menu isLazy placement="bottom-start" gutter={4}>
              <MenuButton
                aria-label={`Options for ${name}`}
                h="100%"
                pl="1"
                pr="2.5"
                borderRightRadius="full"
                _hover={{ bg: active ? 'whiteAlpha.200' : 'purple.100' }}
              >
                <CaretDown size={12} weight="bold" />
              </MenuButton>
              <Portal>
                <MenuList minW="0" w="136px" py="1" boxShadow="md" borderColor="transparent" rootProps={{ zIndex: 'dropdown' }}>
                  <MenuItem
                    fontSize="14px"
                    fontWeight="medium"
                    color="fg.default"
                    icon={<Icon as={PencilSimpleLine} boxSize="16px" />}
                    iconSpacing="2"
                    // Hover and keyboard focus in the app's neutrals.
                    _hover={{ bg: 'bg.muted', color: 'fg.strong' }}
                    _focus={{ bg: 'bg.muted', color: 'fg.strong' }}
                    onClick={() => onEditSection(section)}
                  >
                    Rename
                  </MenuItem>
                  <MenuItem
                    fontSize="14px"
                    fontWeight="medium"
                    color="red.700"
                    icon={<Icon as={Trash} boxSize="16px" />}
                    iconSpacing="2"
                    _hover={{ bg: 'red.50', color: 'red.800' }}
                    _focus={{ bg: 'red.50', color: 'red.800' }}
                    onClick={() => onDeleteSection(section.id)}
                  >
                    Delete
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </Flex>
        );
      })}
    </Flex>
  );
};

export default LoopPills;
