const { test, expect } = require('@playwright/test');

for (const locale of ['', '/ko']) {
    test(`fork contact page ${locale || 'English'} routes feedback to its maintainer`, async ({ page }) => {
        const requests = [];
        page.on('request', request => requests.push(request.url()));
        const response = await page.goto(`${locale}/contact.html`);
        expect(response.status()).toBe(200);
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.locator('main .fork-action')).toHaveAttribute('href',
            'https://github.com/i2na/controlsfreak.dev/issues/new/choose');
        await expect(page.locator('form')).toHaveCount(0);
        expect(requests.filter(url => /turnstile|api\/contact|resend/.test(url))).toEqual([]);
    });
}
