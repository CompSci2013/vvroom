import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

export async function screenshotWithUrl(
  page: Page,
  filename: string,
  fullPage: boolean = false
): Promise<string> {
  const url = page.url();

  await page.evaluate((urlText) => {
    const existingBar = document.getElementById('playwright-url-bar');
    if (existingBar) existingBar.remove();

    const urlBar = document.createElement('div');
    urlBar.id = 'playwright-url-bar';
    urlBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 32px;
      background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
      border-bottom: 1px solid #ccc;
      display: flex;
      align-items: center;
      padding: 0 12px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      z-index: 999999;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `;

    const urlInput = document.createElement('div');
    urlInput.style.cssText = `
      flex: 1;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px 8px;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    urlInput.textContent = urlText;

    urlBar.appendChild(urlInput);
    document.body.insertBefore(urlBar, document.body.firstChild);
    document.body.style.paddingTop = '32px';
  }, url);

  await page.waitForTimeout(100);

  const filepath = path.join(SCREENSHOTS_DIR, filename);

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  await page.screenshot({
    path: filepath,
    fullPage: fullPage,
  });

  await page.evaluate(() => {
    const urlBar = document.getElementById('playwright-url-bar');
    if (urlBar) urlBar.remove();
    document.body.style.paddingTop = '';
  });

  return filepath;
}
