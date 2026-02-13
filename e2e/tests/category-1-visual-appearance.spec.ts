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

test.describe('Category 1: Visual Appearance Tests', () => {
  test.describe('1.1 Default State Rendering', () => {
    test('V1.1.1 - Results table default render', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels except Results Table
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'results-table-default.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.1.2 - Filter panel default render', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Query Panel' }).waitFor({ state: 'visible', timeout: 10000 });
      await screenshotWithUrl(page, 'filter-panel-default.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.1.3 - Pagination default render', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.getByText(/Showing \d+ to \d+ of/).first().waitFor({ state: 'visible', timeout: 10000 });
      await screenshotWithUrl(page, 'pagination-default.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.1.4 - Statistics panel default render', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await screenshotWithUrl(page, 'statistics-default.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.1.5 - Search input default render', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      await screenshotWithUrl(page, 'search-default.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });
  });

  test.describe('1.2 Filtered State Rendering', () => {
    // Helper to collapse panels so Statistics is visible
    // Keep: Query Control (shows active filters), Statistics (shows charts)
    // Collapse: Query Panel, Manufacturer-Model Picker
    async function collapsePanelsForFilteredScreenshot(page: any) {
      const panelsToCollapse = ['Query Panel', 'Manufacturer-Model Picker'];

      for (const panelName of panelsToCollapse) {
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

    test('V1.2.1 - Results table filtered by manufacturer', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForFilteredScreenshot(page);
      await screenshotWithUrl(page, 'results-table-filtered-ford.png', true);
      await expect(page).toHaveURL(/manufacturer=Ford/);
    });

    test('V1.2.2 - Results table filtered by body class', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?bodyClass=SUV`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForFilteredScreenshot(page);
      await screenshotWithUrl(page, 'results-table-filtered-suv.png', true);
      await expect(page).toHaveURL(/bodyClass=SUV/);
    });

    test('V1.2.3 - Results table filtered by year range', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?yearMin=2020&yearMax=2024`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForFilteredScreenshot(page);
      await screenshotWithUrl(page, 'results-table-filtered-recent.png', true);
      await expect(page).toHaveURL(/yearMin=2020/);
      await expect(page).toHaveURL(/yearMax=2024/);
    });

    test('V1.2.4 - Statistics filtered by manufacturer', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Chevrolet`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForFilteredScreenshot(page);
      await screenshotWithUrl(page, 'statistics-filtered-chevrolet.png', true);
      await expect(page).toHaveURL(/manufacturer=Chevrolet/);
    });

    test('V1.2.5 - Results table with model combinations', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?models=Ford:Mustang,Chevrolet:Camaro`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForFilteredScreenshot(page);
      await screenshotWithUrl(page, 'results-table-model-combos.png', true);
      await expect(page).toHaveURL(/models=/);
    });
  });

  test.describe('1.3 Highlighted State Rendering', () => {
    // Helper to collapse panels - keep Query Control and Statistics expanded
    async function collapsePanelsForHighlightScreenshot(page: any) {
      // Collapse: Query Panel, Manufacturer-Model Picker, Results Table
      // Keep expanded: Query Control (shows active highlights), Statistics (shows charts)

      // Each panel has a collapse button (chevron) next to the title
      // The button has icon pi-chevron-down when expanded, pi-chevron-right when collapsed
      // We need to click the chevron button, not the heading

      // Find panels by their heading, then click the chevron button in the same panel-header
      const panelsToCollapse = ['Query Panel', 'Manufacturer-Model Picker', 'Results Table'];

      for (const panelName of panelsToCollapse) {
        const panelHeading = page.getByRole('heading', { name: panelName, level: 3 });
        if (await panelHeading.isVisible()) {
          // Find the parent panel-header, then find the collapse button within it
          // The button has pi-chevron-down icon when expanded
          const panelHeader = panelHeading.locator('..').locator('..');
          const collapseButton = panelHeader.locator('button:has(.pi-chevron-down)');
          if (await collapseButton.count() > 0) {
            await collapseButton.click();
            await page.waitForTimeout(100);
          }
        }
      }

      // Wait for animations to complete
      await page.waitForTimeout(200);
    }

    test('V1.3.1 - Statistics charts highlight Tesla', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForHighlightScreenshot(page);
      await screenshotWithUrl(page, 'statistics-highlight-tesla.png', true);
      await expect(page).toHaveURL(/h_manufacturer=Tesla/);
    });

    test('V1.3.2 - Statistics charts highlight year range', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?h_yearMin=2015&h_yearMax=2020`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForHighlightScreenshot(page);
      await screenshotWithUrl(page, 'statistics-highlight-years.png', true);
      await expect(page).toHaveURL(/h_yearMin=2015/);
    });

    test('V1.3.3 - Statistics charts highlight body class', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?h_bodyClass=Pickup`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForHighlightScreenshot(page);
      await screenshotWithUrl(page, 'statistics-highlight-pickup.png', true);
      await expect(page).toHaveURL(/h_bodyClass=Pickup/);
    });

    test('V1.3.4 - Statistics charts filter with highlight', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford&h_yearMin=2018`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForHighlightScreenshot(page);
      await screenshotWithUrl(page, 'statistics-filter-with-highlight.png', true);
      await expect(page).toHaveURL(/manufacturer=Ford/);
      await expect(page).toHaveURL(/h_yearMin=2018/);
    });
  });

  test.describe('1.4 Sorted State Rendering', () => {
    test('V1.4.1 - Results table sorted by year descending', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?sortBy=year&sortOrder=desc`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      await screenshotWithUrl(page, 'results-table-sorted-year-desc.png', true);
      await expect(page).toHaveURL(/sortBy=year/);
      await expect(page).toHaveURL(/sortOrder=desc/);
    });

    test('V1.4.2 - Results table sorted by manufacturer ascending', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?sortBy=manufacturer&sortOrder=asc`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      await screenshotWithUrl(page, 'results-table-sorted-manufacturer-asc.png', true);
      await expect(page).toHaveURL(/sortBy=manufacturer/);
      await expect(page).toHaveURL(/sortOrder=asc/);
    });

    test('V1.4.3 - Results table sorted by instance count descending', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?sortBy=instanceCount&sortOrder=desc`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      await screenshotWithUrl(page, 'results-table-sorted-instancecount-desc.png', true);
      await expect(page).toHaveURL(/sortBy=instanceCount/);
    });
  });

  test.describe('1.5 Paginated State Rendering', () => {
    test('V1.5.1 - Results table page 2 with 10 rows', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?page=2&size=10`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      await screenshotWithUrl(page, 'results-table-paginated-page2.png', true);
      await expect(page).toHaveURL(/page=2/);
      await expect(page).toHaveURL(/size=10/);
    });

    test('V1.5.2 - Pagination control page 5', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?page=5&size=25`);
      await page.waitForLoadState('networkidle');
      await page.getByText(/Showing \d+ to \d+ of/).first().waitFor({ state: 'visible', timeout: 10000 });
      await screenshotWithUrl(page, 'pagination-page5.png', true);
      await expect(page).toHaveURL(/page=5/);
    });

    test('V1.5.3 - Results table last page', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?page=999&size=25`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      await screenshotWithUrl(page, 'results-table-last-page.png', true);
    });
  });
});
