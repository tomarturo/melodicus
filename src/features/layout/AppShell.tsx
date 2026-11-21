import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Icon,
  IconButton,
  Image,
  useBreakpointValue,
  useDisclosure,
  useMediaQuery,
} from '@chakra-ui/react';
import { CaretLeft, CaretRight, List } from '@phosphor-icons/react';
import { EXPANDED_WIDTH, RAIL_WIDTH, Sidebar } from './Sidebar';

// 'hover': open while the mouse is over it. 'pinned': opened with the toggle,
// stays open until toggled, tapped outside, Escape or navigation.
type RailState = 'closed' | 'hover' | 'pinned';

// A short wait before hover opens the rail, so sweeping the mouse past it on
// the way somewhere else doesn't flash it open.
const HOVER_OPEN_DELAY_MS = 150;

const HOVER_QUERY = '(hover: hover) and (pointer: fine)';

function Rail() {
  const [state, setState] = useState<RailState>('closed');
  const [canHover] = useMediaQuery(HOVER_QUERY);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const expanded = state !== 'closed';

  const cancelHover = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  }, []);
  const close = useCallback(() => {
    cancelHover();
    setState('closed');
  }, [cancelHover]);

  // Navigating closes it.
  useEffect(() => close(), [location.pathname, close]);

  useEffect(() => {
    if (!expanded) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded, close]);

  useEffect(() => cancelHover, [cancelHover]);

  return (
    <>
      {state === 'pinned' && (
        // Tapping anywhere outside the open rail closes it.
        <Box position="fixed" inset="0" zIndex="banner" onClick={close} data-testid="sidebar-backdrop" />
      )}
      <Box
        as="nav"
        aria-label="Main"
        data-expanded={expanded}
        position="fixed"
        top="0"
        bottom="0"
        left="0"
        zIndex="banner"
        w={`${expanded ? EXPANDED_WIDTH : RAIL_WIDTH}px`}
        bg="chrome.bg"
        borderRightWidth="1px"
        borderColor={expanded ? 'chrome.border' : 'transparent'}
        boxShadow={expanded ? 'dark-lg' : 'none'}
        transition="width 0.18s ease, box-shadow 0.18s ease"
        // Opens on real movement over the rail rather than on mouseenter, which
        // browsers also fire when the page lays out under a resting pointer.
        onMouseMove={() => {
          if (!canHover || state !== 'closed' || hoverTimer.current) return;
          hoverTimer.current = setTimeout(() => {
            hoverTimer.current = null;
            setState('hover');
          }, HOVER_OPEN_DELAY_MS);
        }}
        onMouseLeave={() => {
          cancelHover();
          if (state === 'hover') setState('closed');
        }}
      >
        <Sidebar expanded={expanded} onNavigate={close} showShortcut={canHover} />
        {/* With a mouse, hovering opens the rail. A touch screen has no hover,
            so it gets a button instead. */}
        {!canHover && (
          <IconButton
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={expanded}
            icon={<Icon as={expanded ? CaretLeft : CaretRight} boxSize="14px" />}
            onClick={() => {
              cancelHover();
              setState(state === 'pinned' ? 'closed' : 'pinned');
            }}
            position="absolute"
            top="24px"
            right="-14px"
            size="xs"
            isRound
            minW="28px"
            h="28px"
            bg="chrome.raised"
            color="chrome.fg"
            borderWidth="1px"
            borderColor="chrome.border"
            _hover={{ bg: 'chrome.active' }}
          />
        )}
      </Box>
    </>
  );
}

/** Phones: a top bar with a menu button that opens the sidebar as a drawer. */
function PhoneBar() {
  const drawer = useDisclosure();
  const location = useLocation();
  const { onClose } = drawer;
  useEffect(() => onClose(), [location.pathname, onClose]);

  return (
    <Flex align="center" gap="2" h="48px" px="2">
      <IconButton
        aria-label="Open menu"
        icon={<Icon as={List} boxSize="22px" />}
        variant="ghost"
        color="chrome.fg"
        _hover={{ bg: 'chrome.hover' }}
        onClick={drawer.onOpen}
      />
      <Flex as={RouterLink} to="/" align="center" gap="2" aria-label="Melodicus home">
        <Image src="/wordmark.svg" alt="" w="104px" />
      </Flex>
      <Drawer isOpen={drawer.isOpen} onClose={drawer.onClose} placement="left">
        <DrawerOverlay />
        <DrawerContent bg="chrome.bg" maxW={`${EXPANDED_WIDTH}px`}>
          <Sidebar expanded onNavigate={drawer.onClose} />
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}

// Pages whose content panel is the scroll area: the frame fits the screen,
// so the panel's rounded corners always stay in view.
const SCROLLS_IN_PANEL = [/^\/$/, /^\/search\//, /^\/saved-songs$/, /^\/video\//];

export const scrollsInPanel = (pathname: string) => SCROLLS_IN_PANEL.some((pattern) => pattern.test(pathname));

/**
 * The frame every page sits in: the sidebar (a rail from tablet width up, a
 * drawer on phones) and the page. The copyright and GitHub link live in the
 * sidebar, so the page gets the full height.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const isPhone = useBreakpointValue({ base: true, md: false }, { ssr: false });
  const fitsScreen = scrollsInPanel(useLocation().pathname);
  const [canHover] = useMediaQuery(HOVER_QUERY);
  // A 20px frame on every side of the panel, matching the rail: its icons sit
  // 20px in from its left edge, and the panel starts 20px past their right
  // edge. A touch screen adds room on the left for the rail's toggle, which
  // straddles that edge.
  const frame = isPhone ? 0 : 5;
  const panelLeft = isPhone || canHover ? 0 : 5;

  return (
    <Flex
      direction="column"
      bg="chrome.bg"
      pl={isPhone ? 0 : `${RAIL_WIDTH}px`}
      // dvh follows Safari's toolbar as it shows and hides. On iPad, 100vh is
      // the height with the toolbar hidden, so a page that is 100vh tall
      // scrolls by the toolbar's height (about 50px). Browsers without dvh
      // fall back to vh.
      {...(fitsScreen
        ? { h: '100dvh', overflow: 'hidden', sx: { '@supports not (height: 100dvh)': { height: '100vh' } } }
        : { minH: '100dvh', sx: { '@supports not (height: 100dvh)': { minHeight: '100vh' } } })}
    >
      {isPhone ? <PhoneBar /> : <Rail />}
      <Flex direction="column" flex="1" minH="0" py={frame} pl={panelLeft} pr={frame}>
        <Box maxW="1400px" w="100%" mx="auto" display="flex" flexDirection="column" flex="1" minH="0">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
