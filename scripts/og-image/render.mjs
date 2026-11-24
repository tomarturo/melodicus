// Renders scripts/og-image/template.html into:
//   public/og-image.png     the social card (1200×630), with the player mock-up
//   public/readme/banner.png the README's banner: the same card without the
//                            mock-up, cut down to the wordmark, headline and the
//                            three lines in a row
// Usage: node scripts/og-image/render.mjs   (needs Playwright's Chromium and the Inter font)
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../', import.meta.url));
const template = await readFile(`${root}scripts/og-image/template.html`, 'utf8');
const wordmark = (await readFile(`${root}public/wordmark.svg`, 'utf8')).replaceAll('#FAF9F6', '#161719');
const html = template.replace('{{WORDMARK}}', wordmark);

const VARIANTS = [
  { file: 'public/og-image.png', width: 1200, height: 630, css: '' },
  {
    file: 'public/readme/banner.png',
    width: 1200,
    height: 430,
    // No player card; the three lines sit in a row under the headline.
    css: '.card { display: none; } .points { bottom: auto; top: 332px; display: flex; gap: 40px; }',
  },
];

const browser = await chromium.launch();
await mkdir(`${root}public/readme`, { recursive: true });
for (const { file, width, height, css } of VARIANTS) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html.replace('</style>', `${css}\n  html, body { height: ${height}px; }\n</style>`));
  await page.evaluate(() => document.fonts.ready);
  await writeFile(`${root}${file}`, await page.screenshot({ type: 'png' }));
  await page.close();
  console.log(`Wrote ${file}  ${width}×${height}`);
}
await browser.close();
