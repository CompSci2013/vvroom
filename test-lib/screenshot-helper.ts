import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// We'll use canvas to composite the URL bar onto screenshots
// For now, we'll create a simple HTML-based approach using Playwright itself

/**
 * 8.5" x 11" paper at 150 DPI
 */
export const VIEWPORT = {
  LANDSCAPE: { width: 1650, height: 1275 },  // 11" x 8.5"
  PORTRAIT: { width: 1275, height: 1650 },   // 8.5" x 11"
} as const;

/**
 * Panel IDs matching the discover component's panel order
 */
export const PANEL_IDS = {
  QUERY_CONTROL: 'query-control',
  QUERY_PANEL: 'query-panel',
  PICKER: 'manufacturer-model-picker',
  STATISTICS: 'statistics-panel-2',
  RESULTS_TABLE: 'basic-results-table',
} as const;

/**
 * Collapse a panel by clicking its collapse button
 */
export async function collapsePanel(page: Page, panelId: string): Promise<void> {
  const collapseButton = page.locator(`#panel-${panelId} .panel-header button.p-button-text`).first();
  const icon = collapseButton.locator('span.p-button-icon');

  // Only collapse if currently expanded (chevron-down visible)
  if (await icon.getAttribute('class').then(c => c?.includes('pi-chevron-down'))) {
    await collapseButton.click();
    // Wait for animation
    await page.waitForTimeout(300);
  }
}

/**
 * Expand a panel by clicking its expand button
 */
export async function expandPanel(page: Page, panelId: string): Promise<void> {
  const expandButton = page.locator(`#panel-${panelId} .panel-header button.p-button-text`).first();
  const icon = expandButton.locator('span.p-button-icon');

  // Only expand if currently collapsed (chevron-right visible)
  if (await icon.getAttribute('class').then(c => c?.includes('pi-chevron-right'))) {
    await expandButton.click();
    // Wait for animation
    await page.waitForTimeout(300);
  }
}

/**
 * Set panel visibility state - expand some, collapse others
 */
export async function setPanelVisibility(
  page: Page,
  expanded: string[],
  collapsed: string[]
): Promise<void> {
  // Collapse panels first
  for (const panelId of collapsed) {
    await collapsePanel(page, panelId);
  }

  // Then expand panels
  for (const panelId of expanded) {
    await expandPanel(page, panelId);
  }
}

const URL_BAR_HEIGHT = 36;

/**
 * Create a URL bar image and composite it with the page screenshot
 */
async function addUrlBarToScreenshot(
  page: Page,
  screenshotBuffer: Buffer,
  url: string,
  width: number
): Promise<Buffer> {
  // Create a new page context to render just the URL bar
  const context = page.context();
  const urlBarPage = await context.newPage();

  try {
    // Set viewport to match width
    await urlBarPage.setViewportSize({ width, height: URL_BAR_HEIGHT });

    // Create HTML for URL bar
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${width}px;
            height: ${URL_BAR_HEIGHT}px;
            background: linear-gradient(to bottom, #3a3a3a, #2d2d2d);
            display: flex;
            align-items: center;
            padding: 0 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            gap: 8px;
          }
          .nav-buttons {
            display: flex;
            gap: 4px;
            color: #666;
            font-size: 12px;
          }
          .nav-buttons span {
            padding: 2px 6px;
          }
          .url-input {
            flex: 1;
            background: #1a1a1a;
            border: 1px solid #555;
            border-radius: 6px;
            padding: 6px 12px;
            color: #e0e0e0;
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div class="nav-buttons">
          <span>◀</span>
          <span>▶</span>
        </div>
        <div class="url-input">${url}</div>
      </body>
      </html>
    `;

    await urlBarPage.setContent(html);
    const urlBarBuffer = await urlBarPage.screenshot({ fullPage: true });

    // Now composite the two images using canvas in the page
    const composited = await urlBarPage.evaluate(
      async ({ urlBarBase64, screenshotBase64, w, h, barHeight }) => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h + barHeight;
        const ctx = canvas.getContext('2d')!;

        // Load URL bar image
        const urlBarImg = new Image();
        await new Promise((resolve) => {
          urlBarImg.onload = resolve;
          urlBarImg.src = 'data:image/png;base64,' + urlBarBase64;
        });

        // Load screenshot image
        const screenshotImg = new Image();
        await new Promise((resolve) => {
          screenshotImg.onload = resolve;
          screenshotImg.src = 'data:image/png;base64,' + screenshotBase64;
        });

        // Draw URL bar at top
        ctx.drawImage(urlBarImg, 0, 0);
        // Draw screenshot below
        ctx.drawImage(screenshotImg, 0, barHeight);

        // Return as base64
        return canvas.toDataURL('image/png').split(',')[1];
      },
      {
        urlBarBase64: urlBarBuffer.toString('base64'),
        screenshotBase64: screenshotBuffer.toString('base64'),
        w: width,
        h: screenshotBuffer.length > 0 ? await getImageHeight(screenshotBuffer, urlBarPage) : 0,
        barHeight: URL_BAR_HEIGHT,
      }
    );

    return Buffer.from(composited, 'base64');
  } finally {
    await urlBarPage.close();
  }
}

/**
 * Get image height from buffer
 */
async function getImageHeight(buffer: Buffer, page: Page): Promise<number> {
  return page.evaluate(async (base64) => {
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = 'data:image/png;base64,' + base64;
    });
    return img.height;
  }, buffer.toString('base64'));
}

/**
 * Set page zoom level
 */
async function setZoom(page: Page, scale: number): Promise<void> {
  await page.evaluate((s) => {
    document.body.style.transform = `scale(${s})`;
    document.body.style.transformOrigin = 'top left';
    document.body.style.width = `${100 / s}%`;
  }, scale);
  await page.waitForTimeout(100);
}

/**
 * Reset page zoom
 */
async function resetZoom(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.body.style.transform = '';
    document.body.style.transformOrigin = '';
    document.body.style.width = '';
  });
}

/**
 * Check if the footer is visible AND there's whitespace between
 * the last control/content and the footer.
 *
 * If a control is flush against the footer (no gap), content is being truncated.
 */
async function isFooterFullyVisible(page: Page, viewportHeight: number): Promise<boolean> {
  return page.evaluate((vpHeight) => {
    // Find the footer element (contains "© 2026 vvroom")
    const footer = document.querySelector('footer') ||
                   Array.from(document.querySelectorAll('*')).find(el =>
                     el.textContent?.includes('© 2026 vvroom') &&
                     el.children.length === 0
                   )?.parentElement;

    if (!footer) {
      // No footer found - can't verify, assume content might be truncated
      return false;
    }

    const footerRect = footer.getBoundingClientRect();

    // Footer must be visible in viewport
    if (footerRect.top >= vpHeight || footerRect.bottom <= 0) {
      return false;
    }

    // Find the last content element before the footer
    // Look for panels, tables, or other main content containers
    const contentSelectors = [
      '.p-panel',
      '.p-datatable',
      '.p-paginator',
      '[class*="panel"]',
      '[class*="table"]',
      'app-statistics',
      'app-query-control',
      'app-query-panel',
      'app-results-table'
    ];

    let lastContentBottom = 0;

    for (const selector of contentSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        // Only consider elements that are visible (have height and are in viewport)
        if (rect.height > 0 && rect.bottom > 0) {
          lastContentBottom = Math.max(lastContentBottom, rect.bottom);
        }
      });
    }

    // There must be a gap (at least 20px) between last content and footer
    const gapBetweenContentAndFooter = footerRect.top - lastContentBottom;

    return gapBetweenContentAndFooter >= 20;
  }, viewportHeight);
}

/**
 * Take screenshot(s) with adaptive orientation:
 * 1. Default to landscape at 100%
 * 2. If content too tall, try landscape at 90% zoom
 * 3. If still too tall, switch to portrait at 100%
 * 4. If still too tall, try portrait at 90% zoom
 * 5. If still too tall, take multiple portrait shots with scrolling
 *
 * CRITICAL RULES:
 * - First image must ALWAYS capture the banner/header at top
 * - Last image must show the footer "© 2026 vvroom" with whitespace below
 * - If content is flush against footer, it's truncated - need more shots
 *
 * All screenshots include a URL bar composited at the top.
 * Returns array of filenames created.
 */
export async function takeScreenshot(
  page: Page,
  testId: string,
  description: string
): Promise<string[]> {
  const filenames: string[] = [];
  const currentUrl = page.url();

  // Helper to get content height
  const getContentHeight = async () => {
    return page.evaluate(() => document.documentElement.scrollHeight);
  };

  // Helper to take screenshot and add URL bar
  const captureWithUrlBar = async (filename: string, viewport: { width: number; height: number }) => {
    const buffer = await page.screenshot({ fullPage: false });
    const withUrlBar = await addUrlBarToScreenshot(page, buffer, currentUrl, viewport.width);
    fs.writeFileSync(path.join('e2e/screenshots', filename), withUrlBar);
    filenames.push(filename);
  };

  // Helper to check if single shot captures everything (footer visible with space)
  const canFitInSingleShot = async (viewport: { width: number; height: number }) => {
    const contentHeight = await getContentHeight();
    if (contentHeight > viewport.height) {
      return false;
    }
    // Content height fits, but verify footer is actually visible with whitespace
    return isFooterFullyVisible(page, viewport.height);
  };

  // Helper to take multiple scrolling shots
  const takeMultipleShots = async (viewport: { width: number; height: number }, zoom: number) => {
    const contentHeight = await getContentHeight();
    // Calculate overlap to ensure continuity (10% overlap)
    const effectiveHeight = Math.floor(viewport.height * 0.85);
    let scrollY = 0;
    let shotIndex = 1;

    // First shot - always from top (captures banner)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    await captureWithUrlBar(`${testId}-${description}-${shotIndex}.png`, viewport);

    // Continue scrolling until footer is fully visible
    while (!(await isFooterFullyVisible(page, viewport.height))) {
      scrollY += effectiveHeight;
      // Safety check - don't scroll beyond content
      if (scrollY >= contentHeight) {
        break;
      }
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(100);
      shotIndex++;
      await captureWithUrlBar(`${testId}-${description}-${shotIndex}.png`, viewport);

      // Safety limit to prevent infinite loops
      if (shotIndex > 10) {
        console.warn(`Warning: Exceeded 10 shots for ${testId}-${description}`);
        break;
      }
    }

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
  };

  // Try landscape at 100%
  await page.setViewportSize(VIEWPORT.LANDSCAPE);
  await resetZoom(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);

  if (await canFitInSingleShot(VIEWPORT.LANDSCAPE)) {
    await captureWithUrlBar(`${testId}-${description}.png`, VIEWPORT.LANDSCAPE);
  } else {
    // Try landscape at 90% zoom
    await setZoom(page, 0.9);
    await page.waitForTimeout(100);

    if (await canFitInSingleShot(VIEWPORT.LANDSCAPE)) {
      await captureWithUrlBar(`${testId}-${description}.png`, VIEWPORT.LANDSCAPE);
    } else {
      // Try portrait at 100%
      await resetZoom(page);
      await page.setViewportSize(VIEWPORT.PORTRAIT);
      await page.waitForTimeout(100);

      if (await canFitInSingleShot(VIEWPORT.PORTRAIT)) {
        await captureWithUrlBar(`${testId}-${description}.png`, VIEWPORT.PORTRAIT);
      } else {
        // Try portrait at 90% zoom
        await setZoom(page, 0.9);
        await page.waitForTimeout(100);

        if (await canFitInSingleShot(VIEWPORT.PORTRAIT)) {
          await captureWithUrlBar(`${testId}-${description}.png`, VIEWPORT.PORTRAIT);
        } else {
          // Need multiple portrait shots with scrolling (at 90% zoom)
          await takeMultipleShots(VIEWPORT.PORTRAIT, 0.9);
        }
      }
    }
  }

  // Cleanup
  await resetZoom(page);

  return filenames;
}

/**
 * Wait for page to be fully loaded with data
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  // Wait for the results table to have data
  await page.waitForSelector('[data-testid="dynamic-results-table"]', { timeout: 10000 });
  // Wait for any loading spinners to disappear
  await page.waitForTimeout(500);
}

/**
 * Navigate to discover page and wait for load
 */
export async function navigateToDiscover(page: Page, urlParams = ''): Promise<void> {
  const url = urlParams ? `/discover?${urlParams}` : '/discover';
  await page.goto(url);
  await waitForPageLoad(page);
}
