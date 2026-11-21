import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Flex, Icon, Image, Kbd, Text, useDisclosure, type FlexProps } from '@chakra-ui/react';
import { ArrowUpRight, Copyright, GithubLogo, MagnifyingGlass, MusicNotes, SignIn, SignOut, UserCircle } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../../AuthModal';
import { useSavedSongsQuery } from '../sections/queries';
import { useCommandSearch } from '../search/CommandSearch';

export const RAIL_WIDTH = 64;
export const EXPANDED_WIDTH = 288;

interface SidebarProps {
  /** Labels and the saved-songs list show only when expanded. */
  expanded: boolean;
  /** Called after any navigation or action, so a drawer or overlay can close. */
  onNavigate?: () => void;
  /** Show the keyboard shortcut for search (not on touch screens). */
  showShortcut?: boolean;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

// How much of the wordmark shows in the collapsed rail: its dots, bar and M,
// stopping just short of the e.
const LOGOMARK_CLIP = '22px';

// Where an item's label starts: its margin and padding, the icon, the gap.
const LABEL_INSET = '56px'; // mx 8 + px 12 + icon 24 + gap 12

const itemStyles: FlexProps = {
  align: 'center',
  gap: '3',
  h: '44px',
  px: '3',
  mx: '2',
  borderRadius: 'lg',
  color: 'chrome.fg',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  _hover: { bg: 'chrome.hover' },
  _focusVisible: { outline: '2px solid', outlineColor: 'chrome.fg', outlineOffset: '-2px' },
};

/** A row in the sidebar: always an icon, a label when expanded. */
function SidebarItem({
  icon,
  label,
  expanded,
  trailing,
  labelFont,
  ...rest
}: { icon: ReactNode; label: string; expanded: boolean; trailing?: ReactNode; labelFont?: string } & FlexProps & {
    to?: string;
    href?: string;
    target?: string;
    rel?: string;
  }) {
  return (
    <Flex {...itemStyles} aria-label={expanded ? undefined : label} {...rest}>
      <Flex w="24px" justify="center" flexShrink={0}>
        {icon}
      </Flex>
      <Text
        as="span"
        fontSize="sm"
        fontWeight="medium"
        fontFamily={labelFont}
        flex="1"
        textAlign="left"
        display={expanded ? 'block' : 'none'}
      >
        {label}
      </Text>
      {expanded && trailing}
    </Flex>
  );
}

function SavedSongsList({ onNavigate }: { onNavigate?: () => void }) {
  const songsQuery = useSavedSongsQuery();
  const songs = songsQuery.data ?? [];

  // Status lines start where "My songs" does, reading as its subcopy.
  const status = (text: string) => (
    <Text color="chrome.fgMuted" pl={`calc(${LABEL_INSET} - var(--chakra-space-3))`}>
      {text}
    </Text>
  );

  let body: ReactNode;
  if (songsQuery.isPending) body = status('Loading…');
  else if (songsQuery.isError) body = status('Couldn’t load your songs.');
  else if (songs.length === 0) body = status('Your saved songs appear here.');
  else
    body = (
      <Box as="ul" listStyleType="none">
        {songs.map((song) => (
          <Box as="li" key={song.videoId}>
            <Flex
              as={RouterLink}
              to={`/video/${song.videoId}`}
              onClick={onNavigate}
              align="center"
              gap="3"
              px="2"
              py="1.5"
              borderRadius="md"
              color="chrome.fg"
              _hover={{ bg: 'chrome.hover' }}
            >
              <Image
                src={`https://img.youtube.com/vi/${song.videoId}/default.jpg`}
                alt=""
                w="40px"
                h="30px"
                objectFit="cover"
                borderRadius="sm"
                flexShrink={0}
              />
              <Text fontSize="sm" noOfLines={2}>
                {song.title || 'Untitled video'}
              </Text>
            </Flex>
          </Box>
        ))}
      </Box>
    );

  return (
    <Box px="3" fontSize="sm">
      {body}
    </Box>
  );
}

/**
 * The app's navigation: logo, search, saved songs, account, and the project's
 * links at the foot. Collapsed it is an icon rail; expanded (on hover, by its
 * toggle, or as the phone drawer) it adds labels and the list of saved songs.
 */
export function Sidebar({ expanded, onNavigate, showShortcut = false }: SidebarProps) {
  const { user, logout } = useAuth();
  const commandSearch = useCommandSearch();
  const authDialog = useDisclosure();

  return (
    <Flex direction="column" h="100%" py="3" gap="1">
      <Flex align="center" h="48px" mb="2" pl="5" pr="2">
        {/* Always the wordmark. Collapsed, it's clipped just after the M, which
            leaves the logomark; the clip widens with the rail, so the rest of
            the name slides out instead of swapping in. */}
        <Flex
          as={RouterLink}
          to="/"
          onClick={onNavigate}
          align="center"
          aria-label="Melodicus home"
          overflow="hidden"
          maxW={expanded ? '120px' : LOGOMARK_CLIP}
          transition="max-width 0.18s ease"
        >
          {/* 15.3px tall makes its M the logomark's size (14px). */}
          <Image src="/wordmark.svg" alt="" h="15.3px" w="auto" maxW="none" ml="2.5px" flexShrink={0} />
        </Flex>
      </Flex>

      <SidebarItem
        as="button"
        expanded={expanded}
        label="Search"
        icon={<Icon as={MagnifyingGlass} boxSize="22px" />}
        trailing={
          showShortcut ? (
            <Kbd bg="chrome.hover" color="chrome.fgMuted" borderColor="chrome.border" fontSize="xs">
              {isMac ? '⌘K' : 'Ctrl K'}
            </Kbd>
          ) : undefined
        }
        onClick={() => {
          onNavigate?.();
          commandSearch.open();
        }}
      />
      <SidebarItem
        as={RouterLink}
        to="/saved-songs"
        onClick={onNavigate}
        expanded={expanded}
        label="My songs"
        icon={<Icon as={MusicNotes} boxSize="22px" />}
      />

      <Box flex="1" overflowY="auto" mt="2" minH="0">
        {expanded && <SavedSongsList onNavigate={onNavigate} />}
      </Box>

      {user ? (
        <>
          {expanded && (
            <Flex align="center" gap="3" px="5" py="2" color="chrome.fgMuted" fontSize="xs">
              <Icon as={UserCircle} boxSize="22px" flexShrink={0} />
              <Text noOfLines={1}>{user.email}</Text>
            </Flex>
          )}
          <SidebarItem
            as="button"
            expanded={expanded}
            label="Log out"
            icon={<Icon as={SignOut} boxSize="22px" />}
            onClick={() => {
              onNavigate?.();
              void logout();
            }}
          />
        </>
      ) : (
        <SidebarItem
          as="button"
          expanded={expanded}
          label="Log in"
          icon={<Icon as={SignIn} boxSize="22px" />}
          onClick={authDialog.onOpen}
        />
      )}
      <SidebarItem
        as="a"
        href="https://github.com/tomarturo/melodicus"
        target="_blank"
        rel="noopener noreferrer"
        expanded={expanded}
        label="tomarturo"
        // The handle in the system monospace, as it reads on GitHub.
        labelFont="mono"
        aria-label="tomarturo on GitHub"
        icon={<Icon as={GithubLogo} boxSize="22px" />}
        trailing={<Icon as={ArrowUpRight} boxSize="14px" color="chrome.fgMuted" />}
      />
      <SidebarItem
        as="a"
        href="https://www.heytk.net"
        target="_blank"
        rel="noopener noreferrer"
        expanded={expanded}
        label="2025 HeyTK"
        // The © is the icon, so the name spells it out.
        aria-label="© 2025 HeyTK"
        icon={<Icon as={Copyright} boxSize="22px" />}
        trailing={<Icon as={ArrowUpRight} boxSize="14px" color="chrome.fgMuted" />}
      />
      <AuthModal isOpen={authDialog.isOpen} onClose={authDialog.onClose} />
    </Flex>
  );
}
