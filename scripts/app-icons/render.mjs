// Renders the PNG icons from the logomark: the off-white mark on an ink tile,
// which reads on light and dark backgrounds alike. public/favicon.svg is the
// same tile (rounded at 22%); these are for browsers that don't take an SVG
// icon (Safari), the iPhone home screen and the app manifest.
// Usage: node scripts/app-icons/render.mjs
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../', import.meta.url));
const MARK = `
  <path fill="#FAF9F6" d="M33 99.6436H29V25H33V99.6436ZM69.1514 75.1514H70.0293L90.6533 25H110.18V99.6436H94.8213V51.0596H94.2002L74.8193 99.2783H64.3613L44.9805 50.8779H44.3584V99.6436H37V25H48.5273L69.1514 75.1514Z"/>
  <circle fill="#FAF9F6" cx="19" cy="44.7354" r="6"/>
  <circle fill="#FAF9F6" cx="19" cy="79.7354" r="6"/>`;

// [file, size, corner radius as a share of the size]. The home-screen icon is
// square: iOS rounds its corners itself.
const ICONS = [
  ['favicon.png', 32, 0.22],
  ['apple-touch-icon.png', 180, 0],
  ['icon-192.png', 192, 0.22],
  ['icon-512.png', 512, 0.22],
];

const browser = await chromium.launch();
for (const [file, size, radius] of ICONS) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  // The mark's own box is 124 units with margins built in; a little more
  // padding on the tile keeps it clear of the rounded corners.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-12 -12 148 148">
    <rect x="-12" y="-12" width="148" height="148" rx="${148 * radius}" fill="#161719"/>${MARK}</svg>`;
  await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
  await writeFile(`${root}public/${file}`, await page.screenshot({ omitBackground: true, type: 'png' }));
  console.log(`public/${file}  ${size}×${size}`);
}
await browser.close();
