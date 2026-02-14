import { Page } from '@playwright/test';

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

/**
 * Take a full-page screenshot with test ID prefix
 */
export async function takeScreenshot(
  page: Page,
  testId: string,
  description: string
): Promise<string> {
  const filename = `${testId}-${description}.png`;
  await page.screenshot({
    path: `e2e/screenshots/${filename}`,
    fullPage: true,
  });
  return filename;
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
