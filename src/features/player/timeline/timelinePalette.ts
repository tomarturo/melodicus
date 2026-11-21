// The timeline draws on canvas and in wavesurfer's shadow DOM, where theme
// tokens don't reach, so its colors are plain values per color mode.
//
// Track and played colors are opaque on purpose: the progress canvas is the
// main canvas recomposited with 'source-in', which multiplies the two alphas,
// so translucent colors would wash the played portion out. Each is the
// intended translucent color pre-blended against that mode's panel background.

export interface TimelinePalette {
  track: string;
  played: string;
  playhead: string;
  loop: string;
  loopEdge: string;
  section: string;
  chip: string;
  chipText: string;
  hoverLabel: string;
  hoverLabelText: string;
}

const LIGHT: TimelinePalette = {
  track: '#A09F9D', // blackAlpha.500 over #FAF9F6
  played: '#323231', // blackAlpha.800 over #FAF9F6
  playhead: '#C53030', // red.600
  loop: 'rgba(128, 90, 213, 0.30)', // purple.500
  loopEdge: '#553C9A', // purple.700
  section: 'rgba(85, 60, 154, 0.13)', // purple.700, well under the loop
  chip: '#553C9A', // purple.700
  chipText: '#FAF9F6',
  hoverLabel: 'rgba(0, 0, 0, 0.80)',
  hoverLabelText: '#FAF9F6',
};

const DARK: TimelinePalette = {
  track: '#444548', // whiteAlpha.300 over #202124
  played: '#D2D2D3', // whiteAlpha.800 over #202124
  playhead: '#FC8181', // red.300
  loop: 'rgba(183, 148, 244, 0.30)', // purple.300
  loopEdge: '#B794F4', // purple.300
  section: 'rgba(183, 148, 244, 0.14)', // purple.300, well under the loop
  chip: '#B794F4', // purple.300
  chipText: '#1A1A1D',
  hoverLabel: 'rgba(255, 255, 255, 0.90)',
  hoverLabelText: '#141517',
};

export const timelinePalette = (colorMode: 'light' | 'dark'): TimelinePalette =>
  colorMode === 'dark' ? DARK : LIGHT;
