import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../lib/contact';
import { Box, Flex, Icon, Image, Kbd, Link, Text, VisuallyHidden, type FlexProps } from '@chakra-ui/react';
import { Copyright, EnvelopeSimple, MagnifyingGlass, MusicNotes, SignIn, UserCircle } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';
import { useSavedSongsQuery } from '../sections/queries';
import { useCommandSearch } from '../search/CommandSearch';

export const RAIL_WIDTH = 64;

// Icon sizes: the app's own navigation, then the smaller Support and © icons
// at the foot, so they read as secondary.
const NAV_ICON = '22px';
const LINK_ICON = '18px';
export const EXPANDED_WIDTH = 288;

interface SidebarProps {
  /** Labels and the saved-songs list show only when expanded. */
  expanded: boolean;
  /** Called after any navigation or action, so a drawer or overlay can close. */
  onNavigate?: () => void;
  /** Show the keyboard shortcut for search (not on touch screens). */
  showShortcut?: boolean;
  /**
   * Opens the login dialog. It lives with the app shell, not in here, so
   * closing the sidebar (onNavigate) first doesn't take the dialog with it.
   */
  onLogIn: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

// How much of the wordmark shows in the collapsed rail: its dots, bar and M,
// stopping just short of the e.
const LOGOMARK_CLIP = '22px';

// Where an item's label starts: its margin and padding, the icon, the gap.
const LABEL_INSET = '56px'; // mx 8 + px 12 + icon 24 + gap 12

// The footer's text links: muted and underlined, so they read as links beside
// the plain year; brightening on hover like the rows above.
const footerLinkStyle = {
  color: 'chrome.fgMuted',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  _hover: { color: 'chrome.fg', textDecoration: 'underline' },
  _focusVisible: { outline: '2px solid', outlineColor: 'chrome.fg', outlineOffset: '2px', borderRadius: 'sm' },
} as const;

// The © row: a row's shape and alignment, without a row's hover, since its
// links are the things to click.
const footerRowStyles: FlexProps = {
  align: 'center',
  gap: '3',
  h: '44px',
  flexShrink: 0,
  // No right padding: the line of links needs the width; nothing sits after it.
  pl: '3',
  mx: '2',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
};

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
  labelWeight = 'medium',
  ...rest
}: {
  icon: ReactNode;
  label: string;
  expanded: boolean;
  trailing?: ReactNode;
  labelFont?: string;
  labelWeight?: string;
} & FlexProps & {
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
        fontWeight={labelWeight}
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
export function Sidebar({ expanded, onNavigate, showShortcut = false, onLogIn }: SidebarProps) {
  const { user } = useAuth();
  const commandSearch = useCommandSearch();

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
        icon={<Icon as={MagnifyingGlass} boxSize={NAV_ICON} />}
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
        icon={<Icon as={MusicNotes} boxSize={NAV_ICON} />}
      />

      <Box flex="1" overflowY="auto" mt="2" minH="0">
        {expanded && <SavedSongsList onNavigate={onNavigate} />}
      </Box>

      {user ? (
        // Who's signed in, and the way to their account page (where Log out is).
        <SidebarItem
          as={RouterLink}
          to="/account"
          onClick={onNavigate}
          expanded={expanded}
          label={user.email ?? 'Account'}
          aria-label={expanded ? `Account: ${user.email ?? ''}` : 'Account'}
          icon={<Icon as={UserCircle} boxSize={NAV_ICON} />}
        />
      ) : (
        <SidebarItem
          as="button"
          expanded={expanded}
          label="Log in"
          labelWeight="bold"
          icon={<Icon as={SignIn} weight="bold" boxSize={NAV_ICON} />}
          // The sidebar closes first, so the dialog opens on its own.
          onClick={() => {
            onNavigate?.();
            onLogIn();
          }}
        />
      )}
      {/* Separates the account from the project's links below it. */}
      <Box h="1px" bg="chrome.border" mx="5" my="2" flexShrink={0} aria-hidden />
      <SidebarItem
        as="a"
        href={SUPPORT_MAILTO}
        expanded={expanded}
        label="Support"
        aria-label={`Email support: ${SUPPORT_EMAIL}`}
        icon={<Icon as={EnvelopeSimple} boxSize={LINK_ICON} />}
      />
      {/* The © row: an icon like the rows above, and in place of a label, the
          year and the reference links on one line. A fixed-height row like the others, so
          opening the rail moves nothing; the links show when it's open. */}
      <Flex as="nav" aria-label="About Melodicus" {...footerRowStyles}>
        {/* The same size and color as the Support icon above it. */}
        <Flex w="24px" justify="center" flexShrink={0} color="chrome.fg" aria-hidden>
          <Icon as={Copyright} boxSize={LINK_ICON} />
        </Flex>
        <Flex display={expanded ? 'flex' : 'none'} align="center" gap="1" fontSize="xs" color="chrome.fgMuted">
          {/* Plain text: the year beside the © icon (named for screen readers). */}
          <Text as="span">
            <VisuallyHidden>Copyright </VisuallyHidden>2026
          </Text>
          <Text as="span" aria-hidden>
            •
          </Text>
          <Link as={RouterLink} to="/privacy" onClick={onNavigate} {...footerLinkStyle}>
            Privacy
          </Link>
          <Text as="span" aria-hidden>
            •
          </Text>
          <Link href="https://github.com/tomarturo/melodicus" isExternal aria-label="View source on GitHub" {...footerLinkStyle}>
            Source
          </Link>
        </Flex>
      </Flex>
    </Flex>
  );
}
