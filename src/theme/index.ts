import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  // Light only for now; dark values arrive with the color-mode toggle.
  initialColorMode: 'light',
  useSystemColorMode: false,
};

/**
 * Named colors, so each has one place to get a dark value later. Panel tokens
 * cover the light content areas; chrome tokens cover the dark frame around
 * them (page background, sidebar).
 */
const semanticTokens = {
  colors: {
    // Surfaces
    'bg.panel': { default: '#FAF9F6' },
    'bg.surface': { default: 'white' },
    'bg.subtle': { default: 'blackAlpha.50' },
    'bg.muted': { default: 'blackAlpha.100' },
    'bg.mutedHover': { default: 'blackAlpha.200' },
    // Dark fills for emphasis: primary buttons, icon buttons on hover.
    'bg.inverse': { default: 'blackAlpha.800' },
    'bg.inverseHover': { default: 'blackAlpha.900' },
    'bg.inverseStrong': { default: 'black' },

    // Text and icons
    'fg.default': { default: 'blackAlpha.800' },
    'fg.strong': { default: 'blackAlpha.900' },
    'fg.muted': { default: 'blackAlpha.700' },
    'fg.placeholder': { default: 'blackAlpha.600' },
    'fg.max': { default: 'black' },
    // On the dark inverse fills.
    'fg.inverse': { default: 'white' },
    'fg.onInverse': { default: 'whiteAlpha.900' },

    // Borders
    'border.subtle': { default: 'blackAlpha.100' },
    'border.default': { default: 'blackAlpha.200' },
    'border.strong': { default: 'blackAlpha.300' },
    'border.strongHover': { default: 'blackAlpha.400' },
    'border.emphasis': { default: 'blackAlpha.700' },
    'border.focus': { default: 'blackAlpha.900' },
    'border.inverse': { default: 'black' },

    // The dark frame around the panels: page background and sidebar.
    'chrome.bg': { default: '#161719' },
    'chrome.raised': { default: '#1F2023' },
    'chrome.fg': { default: 'whiteAlpha.900' },
    'chrome.fgMuted': { default: 'whiteAlpha.600' },
    'chrome.hover': { default: 'whiteAlpha.100' },
    'chrome.active': { default: 'whiteAlpha.200' },
    'chrome.border': { default: 'whiteAlpha.200' },
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
};

export const theme = extendTheme({ config, semanticTokens, components });
