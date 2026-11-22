// Renders scripts/og-image/template.html to public/og-image.png (1200×630).
// Usage: node scripts/og-image/render.mjs   (needs Playwright's Chromium and the Inter font)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../', import.meta.url));
const template = await readFile(`${root}scripts/og-image/template.html`, 'utf8');
const wordmark = (await readFile(`${root}public/wordmark.svg`, 'utf8')).replaceAll('#FAF9F6', '#161719');
const html = template.replace('{{WORDMARK}}', wordmark);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await writeFile(`${root}public/og-image.png`, await page.screenshot({ type: 'png' }));
await browser.close();
console.log('Wrote public/og-image.png');
