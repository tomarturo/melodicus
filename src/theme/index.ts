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
// The app's black: the near-black of the page frame and sidebar. Used for
// strong fills and text in place of pure black.
const INK = '#161719';

const semanticTokens = {
  colors: {
    ink: { default: INK },
    'ink.hover': { default: '#2B2C30' },
    'ink.active': { default: '#3A3B40' },
    // Surfaces
    'bg.panel': { default: '#FAF9F6' },
    'bg.surface': { default: 'white' },
    'bg.subtle': { default: 'blackAlpha.50' },
    'bg.muted': { default: 'blackAlpha.100' },
    'bg.mutedHover': { default: 'blackAlpha.200' },
    // Dark fills for emphasis: primary buttons, icon buttons on hover.
    'bg.inverse': { default: 'blackAlpha.800' },
    'bg.inverseHover': { default: 'blackAlpha.900' },
    'bg.inverseStrong': { default: 'ink' },

    // Text and icons
    'fg.default': { default: 'blackAlpha.800' },
    'fg.strong': { default: 'blackAlpha.900' },
    'fg.muted': { default: 'blackAlpha.700' },
    'fg.placeholder': { default: 'blackAlpha.600' },
    'fg.max': { default: 'ink' },
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
    'border.inverse': { default: 'ink' },

    // The dark frame around the panels: page background and sidebar.
    'chrome.bg': { default: INK },
    'chrome.raised': { default: '#1F2023' },
    'chrome.fg': { default: 'whiteAlpha.900' },
    'chrome.fgMuted': { default: 'whiteAlpha.600' },
    'chrome.hover': { default: 'whiteAlpha.100' },
    'chrome.active': { default: 'whiteAlpha.200' },
    'chrome.border': { default: 'whiteAlpha.200' },
  },
};

/*
 * Three button styles, all rounded. Each works at any Chakra size: sm in the
 * row under the timeline, md in dialogs.
 *   loud:  black fill. The action answering what the person just did (Save
 *          loop, Update), and the Share button over the video.
 *   pill:  soft fill. Standing controls and dialog actions.
 *   quiet: hairline outline. Secondary choices beside a louder one (Cancel).
 * Hover thickens the outline with a 1px shadow rather than a wider border, so
 * nothing shifts.
 */
// The hover edge is the darkest text color, border and ring alike, so it
// reads as one 2px line. Chakra has no boxShadowColor prop, so the color is
// written into the shadow itself.
export const HOVER_EDGE = 'fg.strong';
export const HOVER_RING = '0 0 0 1px var(--chakra-colors-fg-strong)';
const components = {
  Button: {
    variants: {
      loud: {
        rounded: 'full',
        bg: 'ink',
        border: '1px',
        borderColor: 'ink',
        color: 'fg.inverse',
        _hover: {
          bg: 'ink.hover',
          borderColor: 'ink.hover',
          _disabled: { bg: 'ink', borderColor: 'ink' },
        },
        _active: { bg: 'ink.active', borderColor: 'ink.active' },
      },
      pill: {
        rounded: 'full',
        bg: 'bg.muted',
        border: '1px',
        borderColor: 'border.default',
        color: 'fg.default',
        _hover: {
          boxShadow: HOVER_RING,
          bg: 'bg.mutedHover',
          borderColor: HOVER_EDGE,
          color: 'fg.strong',
          _disabled: { bg: 'bg.muted', boxShadow: 'none', borderColor: 'border.default', color: 'fg.default' },
        },
      },
      quiet: {
        rounded: 'full',
        bg: 'transparent',
        border: '1px',
        borderColor: 'border.strong',
        color: 'fg.default',
        _hover: {
          boxShadow: HOVER_RING,
          bg: 'bg.mutedHover',
          borderColor: HOVER_EDGE,
          color: 'fg.strong',
          _disabled: { bg: 'transparent', boxShadow: 'none', borderColor: 'border.strong', color: 'fg.default' },
        },
        _active: { bg: 'bg.muted' },
      },
    },
  },
};

const styles = {
  global: {
    // Toasts at the bottom sit 16px higher than Chakra's default, so a strip of
    // the page shows beneath them: the dark ones otherwise run into the dark
    // frame around the content panel.
    '[id^="chakra-toast-manager-bottom"]': { marginBottom: '16px !important' },
  },
};

export const theme = extendTheme({ config, semanticTokens, components, styles });
