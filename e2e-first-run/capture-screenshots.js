/**
 * Screenshot Capture Script
 *
 * Captures screenshots of vvroom pages for documentation.
 * Run with: node e2e/capture-screenshots.js
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:4228';

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // Capture Home page
  console.log('Capturing Home page...');
  await page.goto(`${BASE_URL}/home`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: `e2e/screenshots/home-${timestamp}.png`,
    fullPage: true
  });
  console.log(`Saved: e2e/screenshots/home-${timestamp}.png`);

  // Capture Discover page
  console.log('Capturing Discover page...');
  await page.goto(`${BASE_URL}/discover`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: `e2e/screenshots/discover-${timestamp}.png`,
    fullPage: true
  });
  console.log(`Saved: e2e/screenshots/discover-${timestamp}.png`);

  await browser.close();
  console.log('Screenshots captured successfully!');
}

captureScreenshots().catch(console.error);
