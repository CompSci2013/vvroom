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

  // After changing panel visibility, scroll back to top
  // Panel clicks can cause the page to scroll to focus on them
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
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
 * Check if there's whitespace between the header/banner and the first control.
 *
 * The header/banner is the nav bar at the very top (contains "Home", "Discover").
 * There must be a visible gap between its bottom and the top of the first panel/control.
 * This gap contains the page title, results count, etc.
 *
 * If the first control is flush against the header, content is being truncated.
 */
async function isHeaderFullyVisible(page: Page): Promise<{ ok: boolean; debug: string }> {
  return page.evaluate(() => {
    // 1. Check that page is scrolled to top
    if (window.scrollY > 0) {
      return { ok: false, debug: `scrollY=${window.scrollY}` };
    }

    // 2. Find the header/nav bar at the top
    const header = document.querySelector('header') ||
                   document.querySelector('nav') ||
                   document.querySelector('[class*="navbar"]');

    if (!header) {
      return { ok: false, debug: 'no header found' };
    }

    const headerRect = header.getBoundingClientRect();

    // Header must start at or near top of viewport
    if (headerRect.top < -5) {
      return { ok: false, debug: `header.top=${headerRect.top}` };
    }

    // 3. Find the page title (H1) - it must be fully visible below the header
    const pageTitle = document.querySelector('h1');
    if (pageTitle) {
      const titleRect = pageTitle.getBoundingClientRect();
      // Title must start BELOW the header bottom with some gap
      if (titleRect.top < headerRect.bottom) {
        return { ok: false, debug: `title at ${titleRect.top}, header.bottom=${headerRect.bottom} (title behind or above header)` };
      }
      // Title must not be cut off at top
      if (titleRect.top < 0) {
        return { ok: false, debug: `title.top=${titleRect.top} (cut off)` };
      }
    }

    // 4. Find the first panel and ensure it's below the title area
    const contentSelectors = [
      '[id^="panel-"]',
      '.p-panel'
    ];

    let firstPanelTop = Infinity;
    let firstPanelId = '';

    for (const selector of contentSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.height > 0 && rect.top < firstPanelTop) {
          firstPanelTop = rect.top;
          firstPanelId = (el as HTMLElement).id || selector;
        }
      });
    }

    // First panel must be below header (with gap for title row)
    // At minimum, first panel should start at header.bottom + 80 (title area)
    const minPanelTop = headerRect.bottom + 60; // 60px for title row minimum
    if (firstPanelTop < minPanelTop) {
      return { ok: false, debug: `firstPanel (${firstPanelId}) at ${firstPanelTop}, min=${minPanelTop}` };
    }

    const debug = `header.bottom=${headerRect.bottom}, firstPanel.top=${firstPanelTop} (${firstPanelId}), ok`;
    return { ok: true, debug };
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
 * Reset all scrollable elements to top position.
 *
 * CRITICAL: The vvroom app has an internal scrollable <main> element.
 * Panel clicks (expand/collapse) cause this element to scroll internally,
 * even when window.scrollY === 0. Without resetting main.scrollTop,
 * the "Vvroom Discovery" title will be cut off in screenshots.
 */
async function resetAllScrollPositions(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector('main') || document.querySelector('app-discover');
    if (main) {
      (main as HTMLElement).scrollTop = 0;
    }
    const dc = document.querySelector('.discover-container');
    if (dc && dc.parentElement) {
      dc.parentElement.scrollTop = 0;
    }
    document.querySelectorAll('*').forEach(el => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.scrollTop > 0) {
        htmlEl.scrollTop = 0;
      }
    });
  });
}

/**
 * Take screenshot(s) with URL bar composited at top.
 *
 * Takes full-page screenshots, scrolling down by half-page increments
 * until the footer whitespace rule is satisfied.
 *
 * Returns array of filenames created.
 */
export async function takeScreenshot(
  page: Page,
  testId: string,
  description: string
): Promise<string[]> {
  const filenames: string[] = [];
  const currentUrl = page.url();

  // Set viewport to landscape for consistent width
  await page.setViewportSize(VIEWPORT.LANDSCAPE);

  // Reset to top
  await resetAllScrollPositions(page);
  await page.waitForTimeout(200);

  // First screenshot - full page from top
  const buffer1 = await page.screenshot({ fullPage: true });
  const filename1 = `${testId}-${description}.png`;
  const withUrlBar1 = await addUrlBarToScreenshot(page, buffer1, currentUrl, VIEWPORT.LANDSCAPE.width);
  fs.writeFileSync(path.join('e2e/screenshots', filename1), withUrlBar1);
  filenames.push(filename1);

  // Check if footer rule is satisfied
  let footerOk = await isFooterFullyVisible(page, VIEWPORT.LANDSCAPE.height);

  // If footer rule not satisfied, take additional screenshots scrolling down
  let shotIndex = 1;
  const halfPage = Math.floor(VIEWPORT.LANDSCAPE.height / 2);

  while (!footerOk && shotIndex < 10) {
    shotIndex++;

    // Scroll down by half page
    await page.evaluate((scrollAmount) => {
      const main = document.querySelector('main') || document.querySelector('app-discover');
      if (main) {
        (main as HTMLElement).scrollTop += scrollAmount;
      } else {
        window.scrollBy(0, scrollAmount);
      }
    }, halfPage);
    await page.waitForTimeout(200);

    // Take another full-page screenshot
    const buffer = await page.screenshot({ fullPage: true });
    const filename = `${testId}-${description}-${shotIndex}.png`;
    const withUrlBar = await addUrlBarToScreenshot(page, buffer, currentUrl, VIEWPORT.LANDSCAPE.width);
    fs.writeFileSync(path.join('e2e/screenshots', filename), withUrlBar);
    filenames.push(filename);

    footerOk = await isFooterFullyVisible(page, VIEWPORT.LANDSCAPE.height);
  }

  // Reset scroll position
  await resetAllScrollPositions(page);

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
