import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

// Rasterize the editable SVG sources for social platforms that require PNG.
// Run from the repository root after installing Playwright's Chromium.
const browser = await chromium.launch();
try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    for (const suffix of ['', '-ko']) {
        const basename = `html/assets/og-image${suffix}`;
        const svg = readFileSync(`${basename}.svg`, 'utf8').replace(/<\?xml[^>]*\?>/, '');
        await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `${basename}.png` });
    }
} finally {
    await browser.close();
}
