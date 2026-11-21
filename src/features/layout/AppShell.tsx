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
import Footer from '../../Footer';
import { EXPANDED_WIDTH, RAIL_WIDTH, Sidebar } from './Sidebar';

// 'hover': open while the mouse is over it. 'pinned': opened with the toggle,
// stays open until toggled, tapped outside, Escape or navigation.
type RailState = 'closed' | 'hover' | 'pinned';

// A short wait before hover opens the rail, so sweeping the mouse past it on
// the way somewhere else doesn't flash it open.
const HOVER_OPEN_DELAY_MS = 150;

function Rail() {
  const [state, setState] = useState<RailState>('closed');
  const [canHover] = useMediaQuery('(hover: hover) and (pointer: fine)');
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

/**
 * The frame every page sits in: the sidebar (a rail from tablet width up, a
 * drawer on phones), the page itself, and the footer.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const isPhone = useBreakpointValue({ base: true, md: false }, { ssr: false });

  return (
    <Flex direction="column" minH="100vh" bg="chrome.bg" pl={isPhone ? 0 : `${RAIL_WIDTH}px`}>
      {isPhone ? <PhoneBar /> : <Rail />}
      <Flex direction="column" flex="1" pt={isPhone ? 0 : 4} px={['0', '0', 6]}>
        <Box maxW="1400px" w="100%" mx="auto" display="flex" flexDirection="column" flex="1">
          {children}
        </Box>
        <Box maxW="1400px" w="100%" mx="auto">
          <Footer />
        </Box>
      </Flex>
    </Flex>
  );
}
