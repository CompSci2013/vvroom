import { test, expect } from '@playwright/test';
import { screenshotWithUrl } from './screenshot-helper';

const BASE_URL = 'http://localhost:4228';

// Helper to collapse panels by clicking the chevron button in panel headers
async function collapsePanels(page: any, panelNames: string[]) {
  for (const panelName of panelNames) {
    const panelHeading = page.getByRole('heading', { name: panelName, level: 3 });
    if (await panelHeading.isVisible()) {
      const panelHeader = panelHeading.locator('..').locator('..');
      const collapseButton = panelHeader.locator('button:has(.pi-chevron-down)');
      if (await collapseButton.count() > 0) {
        await collapseButton.click();
        await page.waitForTimeout(100);
      }
    }
  }
  await page.waitForTimeout(200);
}

test.describe('Category 8: Visual Verification Tests', () => {
  test.describe('8.1 Component Screenshots - Default State', () => {
    test('VS8.1.1 - Full page default state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Take full page screenshot showing all components
      await screenshotWithUrl(page, 'full-page-default.png', true);

      await expect(page).toHaveURL(/\/discover/);
    });

    test('VS8.1.2 - Results table default state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Collapse other panels to focus on results table
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);

      await screenshotWithUrl(page, 'vs-results-table-default.png', true);
    });

    test('VS8.1.3 - Filter panel default state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Query Panel' }).waitFor({ state: 'visible', timeout: 10000 });

      // Collapse other panels to focus on filter panel
      await collapsePanels(page, ['Query Control', 'Manufacturer-Model Picker', 'Statistics', 'Results Table']);

      await screenshotWithUrl(page, 'vs-filter-panel-default.png', true);
    });

    test('VS8.1.4 - Statistics panel default state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });

      // Collapse other panels to focus on statistics
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Results Table']);

      await screenshotWithUrl(page, 'vs-statistics-default.png', true);
    });

    test('VS8.1.5 - Pagination default state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.getByText(/Showing \d+ to \d+ of/).first().waitFor({ state: 'visible', timeout: 10000 });

      // Collapse other panels to show pagination
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);

      await screenshotWithUrl(page, 'vs-pagination-default.png', true);
    });
  });

  test.describe('8.2 Component Screenshots - Filtered State', () => {
    test('VS8.2.1 - Full page filtered by Ford', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      await screenshotWithUrl(page, 'full-page-filtered-ford.png', true);

      await expect(page).toHaveURL(/manufacturer=Ford/);
    });

    test('VS8.2.2 - Full page filtered by SUV', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?bodyClass=SUV`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      await screenshotWithUrl(page, 'full-page-filtered-suv.png', true);

      await expect(page).toHaveURL(/bodyClass=SUV/);
    });

    test('VS8.2.3 - Full page filtered by recent years', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?yearMin=2020&yearMax=2024`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      await screenshotWithUrl(page, 'full-page-filtered-recent.png', true);

      await expect(page).toHaveURL(/yearMin=2020/);
      await expect(page).toHaveURL(/yearMax=2024/);
    });

    test('VS8.2.4 - Full page with combined filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Chevrolet&bodyClass=Pickup`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      await screenshotWithUrl(page, 'full-page-filtered-combined.png', true);

      await expect(page).toHaveURL(/manufacturer=Chevrolet/);
      await expect(page).toHaveURL(/bodyClass=Pickup/);
    });
  });

  test.describe('8.3 Component Screenshots - Highlighted State', () => {
    test('VS8.3.1 - Full page with Tesla highlight', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });

      // Keep Query Control and Statistics expanded for highlight visibility
      await collapsePanels(page, ['Query Panel', 'Manufacturer-Model Picker', 'Results Table']);

      await screenshotWithUrl(page, 'full-page-highlight-tesla.png', true);

      await expect(page).toHaveURL(/h_manufacturer=Tesla/);
    });

    test('VS8.3.2 - Full page with year range highlight', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?h_yearMin=2015&h_yearMax=2020`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });

      // Keep Query Control and Statistics expanded for highlight visibility
      await collapsePanels(page, ['Query Panel', 'Manufacturer-Model Picker', 'Results Table']);

      await screenshotWithUrl(page, 'full-page-highlight-years.png', true);

      await expect(page).toHaveURL(/h_yearMin=2015/);
      await expect(page).toHaveURL(/h_yearMax=2020/);
    });

    test('VS8.3.3 - Full page with filter and highlight combined', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford&h_yearMin=2018&h_yearMax=2022`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });

      // Keep Query Control and Statistics expanded
      await collapsePanels(page, ['Query Panel', 'Manufacturer-Model Picker', 'Results Table']);

      await screenshotWithUrl(page, 'full-page-filter-with-highlight.png', true);

      await expect(page).toHaveURL(/manufacturer=Ford/);
      await expect(page).toHaveURL(/h_yearMin=2018/);
    });
  });

  test.describe('8.4 Pop-Out Screenshots', () => {
    test('VS8.4.1 - Results table pop-out standalone and with main', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Pop out results table
      const resultsTableHeader = mainPage.getByRole('heading', { name: 'Results Table', level: 3 });
      const panelHeader = resultsTableHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Screenshot of pop-out standalone
      await screenshotWithUrl(popoutPage, 'vs-results-table-popout-standalone.png', true);

      // Screenshot of main window showing placeholder
      await screenshotWithUrl(mainPage, 'vs-results-table-popout-with-main.png', true);
    });

    test('VS8.4.2 - Statistics pop-out standalone and with main', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });

      // Pop out statistics
      const statisticsHeader = mainPage.getByRole('heading', { name: 'Statistics', level: 3 });
      const panelHeader = statisticsHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('networkidle');

      // Screenshot of pop-out standalone
      await screenshotWithUrl(popoutPage, 'vs-statistics-popout-standalone.png', true);

      // Screenshot of main window showing placeholder
      await screenshotWithUrl(mainPage, 'vs-statistics-popout-with-main.png', true);
    });

    test('VS8.4.3 - Filter panel pop-out standalone and with main', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.getByRole('heading', { name: 'Query Panel' }).waitFor({ state: 'visible', timeout: 10000 });

      // Pop out Query Panel
      const queryPanelHeader = mainPage.getByRole('heading', { name: 'Query Panel', level: 3 });
      const panelHeader = queryPanelHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('networkidle');

      // Screenshot of pop-out standalone
      await screenshotWithUrl(popoutPage, 'vs-filter-panel-popout-standalone.png', true);

      // Screenshot of main window showing placeholder
      await screenshotWithUrl(mainPage, 'vs-filter-panel-popout-with-main.png', true);
    });
  });
});
