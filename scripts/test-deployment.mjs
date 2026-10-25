import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { resolveSiteOrigin } = require('../lib/site-config.js');
const config = require('../vercel.json');
const yaml = require('js-yaml');
for (const file of readdirSync('.github/workflows').filter(name => /\.ya?ml$/.test(name))) {
    yaml.load(readFileSync(path.join('.github/workflows', file), 'utf8'));
}

assert.equal(resolveSiteOrigin({}), 'https://controlsfreak-ko.vercel.app');
assert.equal(resolveSiteOrigin({ VERCEL_PROJECT_PRODUCTION_URL: 'assigned-project.vercel.app' }),
    'https://assigned-project.vercel.app');
assert.equal(resolveSiteOrigin({ SITE_URL: 'https://korean.example/',
    VERCEL_PROJECT_PRODUCTION_URL: 'assigned-project.vercel.app' }), 'https://korean.example');
for (const SITE_URL of ['https://controlsfreak.dev', 'https://www.controlsfreak.dev',
    'http://insecure.example', 'https://fork.example/path', 'https://user:pass@fork.example']) {
    assert.throws(() => resolveSiteOrigin({ SITE_URL }));
}
assert.equal(config.outputDirectory, '_site');
assert.equal(config.cleanUrls, true);
assert.deepEqual(config.redirects.find(rule => rule.source === '/'),
    { source: '/', destination: '/ko/', permanent: false });

// Build to an isolated directory: never overwrite a site being browser-tested.
const output = mkdtempSync(path.join(tmpdir(), 'controlsfreak-deployment-'));
try {
    execFileSync(process.execPath, ['node_modules/@11ty/eleventy/cmd.cjs', `--output=${output}`], {
        env: { ...process.env, SITE_URL: 'https://korean.example', VERCEL_ENV: 'preview' },
        stdio: 'pipe', maxBuffer: 8 * 1024 * 1024,
    });
    const read = file => readFileSync(path.join(output, file), 'utf8');
    const ko = read('ko/index.html');
    assert.match(ko, /<link rel="canonical" href="https:\/\/korean\.example\/ko\/">/);
    assert.match(ko, /hreflang="en" href="https:\/\/korean\.example\/en\/"/);
    assert.match(ko, /hreflang="x-default" href="https:\/\/korean\.example\/ko\/"/);
    assert.match(ko, /<meta name="robots" content="noindex">/);
    assert.match(ko, /href="https:\/\/controlsfreak\.dev\/"/);
    assert.match(ko, /한국의 전문 제어·설비 엔지니어가 번역하거나 검수한 자료가 아닙니다/);
    assert.match(ko, /property="og:image" content="https:\/\/korean\.example\/assets\/og-image-ko\.png"/);
    assert.equal(read('en/index.html'), read('index.html'));
    assert.match(read('en/index.html'), /<html lang="en">/);
    assert.match(read('robots.txt'), /Disallow: \//);
    const locations = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    assert.ok(locations.length >= 270);
    assert.ok(locations.every(url => url.startsWith('https://korean.example/')));
    const contact = read('ko/contact.html');
    assert.ok(!/turnstile|<form|api\/contact/i.test(contact));
    assert.match(contact, /https:\/\/github\.com\/i2na\/controlsfreak\.dev\/issues\/new\/choose/);
    console.log(`Deployment checks passed: ${locations.length} canonical pages, custom origin, preview noindex, attribution, English home, fork contact.`);
} catch (error) {
    if (error.stdout) process.stderr.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    throw error;
} finally {
    rmSync(output, { recursive: true, force: true });
}
