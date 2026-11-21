import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Icon,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import Logomark from '../../components/Logomark';
import { useSavedSongsQuery } from '../sections/queries';
import { actionPath, commandActions, type CommandAction } from './commandSearch';

interface CommandSearchContextValue {
  open: () => void;
}

const CommandSearchContext = createContext<CommandSearchContextValue | null>(null);

export function useCommandSearch(): CommandSearchContextValue {
  const context = useContext(CommandSearchContext);
  if (!context) throw new Error('useCommandSearch must be used within CommandSearchProvider');
  return context;
}

/** Provides the search dialog to the whole app and opens it on ⌘K / Ctrl+K. */
export function CommandSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo(() => ({ open }), [open]);
  return (
    <CommandSearchContext.Provider value={value}>
      {children}
      {isOpen && <CommandSearchDialog onClose={() => setIsOpen(false)} />}
    </CommandSearchContext.Provider>
  );
}

const thumbnail = (videoId: string) => `https://img.youtube.com/vi/${videoId}/default.jpg`;

function ActionRow({ action }: { action: CommandAction }) {
  switch (action.kind) {
    case 'open-song':
      return (
        <>
          <Image src={thumbnail(action.song.videoId)} alt="" w="48px" h="27px" objectFit="cover" borderRadius="md" />
          <Text noOfLines={1}>{action.song.title || 'Untitled video'}</Text>
        </>
      );
    case 'open-video':
      return (
        <>
          {/* It opens here, in the player, not on YouTube. */}
          <Logomark boxSize="22px" mx="13px" color="fg.strong" />
          <Text>Open in Melodicus</Text>
        </>
      );
    case 'search-youtube':
      return (
        <>
          <Icon as={MagnifyingGlass} boxSize="20px" mx="14px" />
          <Text noOfLines={1}>
            Find songs for <Text as="span" fontWeight="semibold">“{action.query}”</Text>
          </Text>
        </>
      );
  }
}

function CommandSearchDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const songsQuery = useSavedSongsQuery();
  const [input, setInput] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const actions = useMemo(() => commandActions(input, songsQuery.data ?? []), [input, songsQuery.data]);
  const active = Math.min(highlighted, Math.max(actions.length - 1, 0));

  const run = (action: CommandAction | undefined) => {
    if (!action) return;
    onClose();
    navigate(actionPath(action));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((index) => Math.min(index + 1, actions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(actions[active]);
    }
  };

  const firstSongIndex = actions.findIndex((action) => action.kind === 'open-song');
  const listId = 'command-search-results';

  return (
    <Modal isOpen onClose={onClose} size="lg" motionPreset="slideInTop">
      <ModalOverlay />
      <ModalContent mt={['4', '16', '24']} mx="3" overflow="hidden" aria-label="Search">
        <InputGroup size="lg">
          {/* As tall as the field, so the icon centers on the text line. */}
          <InputLeftElement pointerEvents="none" h="56px">
            <Icon as={MagnifyingGlass} color="fg.muted" />
          </InputLeftElement>
          <Input
            autoFocus
            variant="unstyled"
            h="56px"
            pl="12"
            pr="4"
            placeholder="Search your songs, find new ones, or paste a link"
            _placeholder={{ color: 'fg.placeholder' }}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setHighlighted(0);
            }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={actions.length > 0}
            aria-controls={listId}
            aria-activedescendant={actions.length > 0 ? `${listId}-${active}` : undefined}
          />
        </InputGroup>
        {actions.length > 0 && (
          <ModalBody borderTopWidth="1px" borderColor="border.subtle" px="2" py="2">
            <Box as="ul" id={listId} role="listbox" listStyleType="none">
              {actions.map((action, index) => (
                <Fragment key={action.kind === 'open-song' ? action.song.videoId : action.kind}>
                {index === firstSongIndex && (
                  <Text as="li" role="presentation" fontSize="xs" fontWeight="semibold" color="fg.muted" px="3" pt={index === 0 ? 1 : 3} pb="2">
                    Saved songs
                  </Text>
                )}
                <Flex
                  as="li"
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  align="center"
                  gap="3"
                  px="3"
                  py="2"
                  borderRadius="lg"
                  cursor="pointer"
                  color="fg.default"
                  bg={index === active ? 'bg.muted' : 'transparent'}
                  onMouseMove={() => setHighlighted(index)}
                  onClick={() => run(action)}
                >
                  <ActionRow action={action} />
                </Flex>
                </Fragment>
              ))}
            </Box>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
}
