import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Flex, Icon, Image, Kbd, Link, Text, useDisclosure, type FlexProps } from '@chakra-ui/react';
import { ArrowSquareOut, GithubLogo, MagnifyingGlass, MusicNotes, SignIn, SignOut, UserCircle } from '@phosphor-icons/react';
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
  ...rest
}: { icon: ReactNode; label: string; expanded: boolean; trailing?: ReactNode } & FlexProps & {
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
      <Text as="span" fontSize="sm" fontWeight="medium" flex="1" textAlign="left" display={expanded ? 'block' : 'none'}>
        {label}
      </Text>
      {expanded && trailing}
    </Flex>
  );
}

function SavedSongsList({ onNavigate }: { onNavigate?: () => void }) {
  const songsQuery = useSavedSongsQuery();
  const songs = songsQuery.data ?? [];

  let body: ReactNode;
  if (songsQuery.isPending) body = <Text color="chrome.fgMuted">Loading…</Text>;
  else if (songsQuery.isError) body = <Text color="chrome.fgMuted">Couldn’t load your songs.</Text>;
  else if (songs.length === 0) body = <Text color="chrome.fgMuted">Songs you save loops for appear here.</Text>;
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
 * toggle, or as the phone drawer) it adds labels, the list of saved songs and
 * the copyright line.
 */
export function Sidebar({ expanded, onNavigate, showShortcut = false }: SidebarProps) {
  const { user, logout } = useAuth();
  const commandSearch = useCommandSearch();
  const authDialog = useDisclosure();

  return (
    <Flex direction="column" h="100%" py="3" gap="1">
      <Flex align="center" h="48px" mb="2" pl="5" pr="2">
        <Flex as={RouterLink} to="/" onClick={onNavigate} align="center" gap="2" aria-label="Melodicus home">
          {/* The wordmark includes the logomark's dots, so it replaces it rather than following it. */}
          {expanded ? (
            <Image src="/wordmark.svg" alt="" w="112px" />
          ) : (
            <Image src="/favicon.svg" alt="" boxSize="24px" flexShrink={0} />
          )}
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
        label="GitHub"
        icon={<Icon as={GithubLogo} boxSize="22px" />}
        trailing={<Icon as={ArrowSquareOut} boxSize="14px" color="chrome.fgMuted" />}
      />
      {expanded && (
        <Text px="5" pt="2" fontSize="xs" color="chrome.fgMuted" whiteSpace="nowrap">
          © 2025{' '}
          <Link
            href="https://www.heytk.net"
            isExternal
            display="inline-flex"
            alignItems="center"
            gap="2px"
            fontWeight="semibold"
            color="chrome.fg"
          >
            HeyTK
            <Icon as={ArrowSquareOut} boxSize="12px" />
          </Link>
        </Text>
      )}
      <AuthModal isOpen={authDialog.isOpen} onClose={authDialog.onClose} />
    </Flex>
  );
}
