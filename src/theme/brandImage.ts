// The logo, wordmark and GitHub mark are white SVG files, drawn for a dark
// background. Inverting them in light mode turns them near-black.
export const brandImageProps = { _light: { filter: 'invert(1)' } } as const;
