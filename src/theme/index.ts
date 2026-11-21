import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  // 'system' until someone picks light or dark in the sidebar. The saved
  // choice comes from colorModeManager (./colorMode), and the inline script in
  // index.html applies the same rule before React loads.
  initialColorMode: 'system',
  // Chakra's own system listener would override an explicit choice, so
  // following the system is handled in useColorModePreference instead.
  useSystemColorMode: false,
};

// The panel background in dark mode, and the frame around it.
const DARK_PANEL = '#202124';
const DARK_FRAME = '#141517';

/**
 * Named colors with a light and a dark value. Panel tokens cover the content
 * areas; chrome tokens cover the frame around them (page background, sidebar).
 */
const semanticTokens = {
  colors: {
    // Surfaces
    'bg.panel': { default: '#FAF9F6', _dark: DARK_PANEL },
    'bg.surface': { default: 'white', _dark: '#2A2B2F' },
    'bg.subtle': { default: 'blackAlpha.50', _dark: 'whiteAlpha.50' },
    'bg.muted': { default: 'blackAlpha.100', _dark: 'whiteAlpha.100' },
    'bg.mutedHover': { default: 'blackAlpha.200', _dark: 'whiteAlpha.200' },
    // Strong fills for emphasis: primary buttons, icon buttons on hover.
    'bg.inverse': { default: 'blackAlpha.800', _dark: 'whiteAlpha.800' },
    'bg.inverseHover': { default: 'blackAlpha.900', _dark: 'whiteAlpha.900' },
    'bg.inverseStrong': { default: 'black', _dark: 'white' },

    // Text and icons
    'fg.default': { default: 'blackAlpha.800', _dark: 'whiteAlpha.800' },
    'fg.strong': { default: 'blackAlpha.900', _dark: 'whiteAlpha.900' },
    'fg.muted': { default: 'blackAlpha.700', _dark: 'whiteAlpha.700' },
    'fg.placeholder': { default: 'blackAlpha.600', _dark: 'whiteAlpha.500' },
    'fg.max': { default: 'black', _dark: 'white' },
    // On the strong inverse fills.
    'fg.inverse': { default: 'white', _dark: DARK_FRAME },
    'fg.onInverse': { default: 'whiteAlpha.900', _dark: 'blackAlpha.900' },

    // Borders
    'border.subtle': { default: 'blackAlpha.100', _dark: 'whiteAlpha.100' },
    'border.default': { default: 'blackAlpha.200', _dark: 'whiteAlpha.200' },
    'border.strong': { default: 'blackAlpha.300', _dark: 'whiteAlpha.300' },
    'border.strongHover': { default: 'blackAlpha.400', _dark: 'whiteAlpha.400' },
    'border.emphasis': { default: 'blackAlpha.700', _dark: 'whiteAlpha.700' },
    'border.focus': { default: 'blackAlpha.900', _dark: 'whiteAlpha.900' },
    'border.inverse': { default: 'black', _dark: 'white' },

    // Status
    'fg.error': { default: 'red.500', _dark: 'red.300' },
    'fg.danger': { default: 'red.700', _dark: 'red.300' },
    'fg.dangerHover': { default: 'red.800', _dark: 'red.200' },
    'bg.dangerHover': { default: 'red.50', _dark: 'rgba(254, 178, 178, 0.12)' },
    'fg.link': { default: 'blue.500', _dark: 'blue.300' },

    // The frame around the panels: page background and sidebar.
    'chrome.bg': { default: '#E9E8E4', _dark: DARK_FRAME },
    'chrome.raised': { default: '#F4F3EF', _dark: '#1F2023' },
    'chrome.fg': { default: 'blackAlpha.900', _dark: 'whiteAlpha.900' },
    'chrome.fgMuted': { default: 'blackAlpha.700', _dark: 'whiteAlpha.600' },
    'chrome.hover': { default: 'blackAlpha.100', _dark: 'whiteAlpha.100' },
    'chrome.active': { default: 'blackAlpha.200', _dark: 'whiteAlpha.200' },
    'chrome.border': { default: 'blackAlpha.200', _dark: 'whiteAlpha.200' },
  },
};

const styles = {
  global: {
    body: { bg: 'chrome.bg' },
  },
};

const components = {
  Button: {
    variants: {
      /**
       * The app's rounded, softly filled button: playback controls, Add loop,
       * Save and the playback-rate steppers.
       */
      pill: {
        rounded: 'full',
        bg: 'bg.muted',
        border: '1px',
        borderColor: 'border.default',
        color: 'fg.default',
        _hover: {
          boxShadow: '0 0 0 1px',
          boxShadowColor: 'fg.default',
          bg: 'bg.mutedHover',
          borderColor: 'border.emphasis',
          color: 'fg.strong',
          _disabled: { bg: 'bg.muted', boxShadow: 'none', borderColor: 'border.default', color: 'fg.default' },
        },
      },
    },
  },
  // Chakra's dark defaults are bluish grays; match the app's neutral panels.
  Modal: { baseStyle: { dialog: { bg: 'bg.panel', color: 'fg.strong' } } },
  Menu: { baseStyle: { list: { bg: 'bg.panel' }, item: { bg: 'bg.panel', _hover: { bg: 'bg.muted' }, _focus: { bg: 'bg.muted' } } } },
};

export const theme = extendTheme({ config, semanticTokens, styles, components });
