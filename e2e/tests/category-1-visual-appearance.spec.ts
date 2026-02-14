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

// Helper to expand panels by clicking the chevron button in panel headers
async function expandPanels(page: any, panelNames: string[]) {
  for (const panelName of panelNames) {
    const panelHeading = page.getByRole('heading', { name: panelName, level: 3 });
    if (await panelHeading.isVisible()) {
      const panelHeader = panelHeading.locator('..').locator('..');
      const expandButton = panelHeader.locator('button:has(.pi-chevron-right)');
      if (await expandButton.count() > 0) {
        await expandButton.click();
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
      await screenshotWithUrl(page, 'V1.1.1-results-table-default.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.1.2 - Filter panel default render', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Query Panel' }).waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels except Query Panel
      await collapsePanels(page, ['Query Control', 'Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'V1.1.2-filter-panel-default.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.1.3 - Pagination default render', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.getByText(/Showing \d+ to \d+ of/).first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels except Results Table (to focus on pagination)
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'V1.1.3-pagination-default.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.1.4 - Statistics panel default render', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels except Statistics
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Results Table']);
      await screenshotWithUrl(page, 'V1.1.4-statistics-default.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.1.5 - Search input default render', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels except Query Control (to show search input)
      await collapsePanels(page, ['Query Panel', 'Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'V1.1.5-search-default.png', true);
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
      await screenshotWithUrl(page, 'V1.2.1-results-table-filtered-ford.png', true);
      await expect(page).toHaveURL(/manufacturer=Ford/);
    });

    test('V1.2.2 - Results table filtered by body class', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?bodyClass=SUV`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForFilteredScreenshot(page);
      await screenshotWithUrl(page, 'V1.2.2-results-table-filtered-suv.png', true);
      await expect(page).toHaveURL(/bodyClass=SUV/);
    });

    test('V1.2.3 - Results table filtered by year range', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?yearMin=2020&yearMax=2024`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForFilteredScreenshot(page);
      await screenshotWithUrl(page, 'V1.2.3-results-table-filtered-recent.png', true);
      await expect(page).toHaveURL(/yearMin=2020/);
      await expect(page).toHaveURL(/yearMax=2024/);
    });

    test('V1.2.4 - Statistics filtered by manufacturer', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Chevrolet`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForFilteredScreenshot(page);
      await screenshotWithUrl(page, 'V1.2.4-statistics-filtered-chevrolet.png', true);
      await expect(page).toHaveURL(/manufacturer=Chevrolet/);
    });

    test('V1.2.5 - Results table with model combinations', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?models=Ford:Mustang,Chevrolet:Camaro`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForFilteredScreenshot(page);
      await screenshotWithUrl(page, 'V1.2.5-results-table-model-combos.png', true);
      await expect(page).toHaveURL(/models=/);
    });
  });

  test.describe('1.3 Highlighted State Rendering', () => {
    // Helper to collapse panels - keep Query Control and Statistics expanded
    async function collapsePanelsForHighlightScreenshot(page: any) {
      const panelsToCollapse = ['Query Panel', 'Manufacturer-Model Picker', 'Results Table'];

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

    test('V1.3.1 - Statistics charts highlight Tesla', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForHighlightScreenshot(page);
      await screenshotWithUrl(page, 'V1.3.1-statistics-highlight-tesla.png', true);
      await expect(page).toHaveURL(/h_manufacturer=Tesla/);
    });

    test('V1.3.2 - Statistics charts highlight year range', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?h_yearMin=2015&h_yearMax=2020`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForHighlightScreenshot(page);
      await screenshotWithUrl(page, 'V1.3.2-statistics-highlight-years.png', true);
      await expect(page).toHaveURL(/h_yearMin=2015/);
    });

    test('V1.3.3 - Statistics charts highlight body class', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?h_bodyClass=Pickup`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForHighlightScreenshot(page);
      await screenshotWithUrl(page, 'V1.3.3-statistics-highlight-pickup.png', true);
      await expect(page).toHaveURL(/h_bodyClass=Pickup/);
    });

    test('V1.3.4 - Statistics charts filter with highlight', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford&h_yearMin=2018`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });
      await collapsePanelsForHighlightScreenshot(page);
      await screenshotWithUrl(page, 'V1.3.4-statistics-filter-with-highlight.png', true);
      await expect(page).toHaveURL(/manufacturer=Ford/);
      await expect(page).toHaveURL(/h_yearMin=2018/);
    });
  });

  test.describe('1.4 Sorted State Rendering', () => {
    test('V1.4.1 - Results table sorted by year descending', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?sortBy=year&sortOrder=desc`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels except Results Table
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'V1.4.1-results-table-sorted-year-desc.png', true);
      await expect(page).toHaveURL(/sortBy=year/);
      await expect(page).toHaveURL(/sortOrder=desc/);
    });

    test('V1.4.2 - Results table sorted by manufacturer ascending', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?sortBy=manufacturer&sortOrder=asc`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels except Results Table
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'V1.4.2-results-table-sorted-manufacturer-asc.png', true);
      await expect(page).toHaveURL(/sortBy=manufacturer/);
      await expect(page).toHaveURL(/sortOrder=asc/);
    });

    test('V1.4.3 - Results table sorted by instance count descending', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?sortBy=instance_count&sortOrder=desc`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels except Results Table
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'V1.4.3-results-table-sorted-instancecount-desc.png', true);
      await expect(page).toHaveURL(/sortBy=instance_count/);
    });
  });

  test.describe('1.5 Paginated State Rendering', () => {
    test('V1.5.1 - Results table page 2 with 10 rows', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?page=2&size=10`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels except Results Table
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'V1.5.1-results-table-paginated-page2.png', true);
      await expect(page).toHaveURL(/page=2/);
      await expect(page).toHaveURL(/size=10/);
    });

    test('V1.5.2 - Pagination control page 5', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?page=5&size=25`);
      await page.waitForLoadState('networkidle');
      await page.getByText(/Showing \d+ to \d+ of/).first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels except Results Table
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'V1.5.2-pagination-page5.png', true);
      await expect(page).toHaveURL(/page=5/);
    });

    test('V1.5.3 - Results table last page', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?page=999&size=25`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels except Results Table
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'V1.5.3-results-table-last-page.png', true);
    });
  });

  test.describe('1.6 Collapsed/Expanded Panel State', () => {
    test('V1.6.1 - Query Control collapsed', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse Query Control only
      await collapsePanels(page, ['Query Control']);
      await screenshotWithUrl(page, 'V1.6.1-query-control-collapsed.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.6.2 - Query Panel collapsed', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse Query Panel only
      await collapsePanels(page, ['Query Panel']);
      await screenshotWithUrl(page, 'V1.6.2-query-panel-collapsed.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.6.3 - Manufacturer-Model Picker collapsed', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse Picker only
      await collapsePanels(page, ['Manufacturer-Model Picker']);
      await screenshotWithUrl(page, 'V1.6.3-picker-collapsed.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.6.4 - All panels expanded (default)', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // All panels should already be expanded by default
      await screenshotWithUrl(page, 'V1.6.4-all-panels-expanded.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.6.5 - All panels collapsed', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all panels
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'V1.6.5-all-panels-collapsed.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });

    test('V1.6.6 - Mixed state (some collapsed, some expanded)', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Keep Query Control and Statistics expanded, collapse others
      await collapsePanels(page, ['Query Panel', 'Manufacturer-Model Picker', 'Results Table']);
      await screenshotWithUrl(page, 'V1.6.6-panels-mixed-state.png', true);
      await expect(page).toHaveURL(/\/discover/);
    });
  });

  test.describe('1.7 Pagination Interaction (Popped-In)', () => {
    test('V1.7.1 - Picker Table click page 2', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all except Picker
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Statistics', 'Results Table']);
      // Find the picker pagination and click page 2
      const pickerPanel = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 }).locator('..').locator('..');
      const paginationButtons = pickerPanel.locator('.p-paginator button');
      // Page 2 button - need to find the right one
      await page.waitForTimeout(300);
      const page2Button = pickerPanel.locator('.p-paginator-pages button').nth(1);
      if (await page2Button.count() > 0) {
        await page2Button.click();
        await page.waitForTimeout(300);
      }
      await screenshotWithUrl(page, 'V1.7.1-picker-page2.png', true);
    });

    test('V1.7.2 - Picker Table click page 3', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all except Picker
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Statistics', 'Results Table']);
      const pickerPanel = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 }).locator('..').locator('..');
      await page.waitForTimeout(300);
      const page3Button = pickerPanel.locator('.p-paginator-pages button').nth(2);
      if (await page3Button.count() > 0) {
        await page3Button.click();
        await page.waitForTimeout(300);
      }
      await screenshotWithUrl(page, 'V1.7.2-picker-page3.png', true);
    });

    test('V1.7.3 - Picker Table change rows to 10', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all except Picker
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Statistics', 'Results Table']);
      const pickerPanel = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 }).locator('..').locator('..');
      // Find and click the rows per page dropdown in Picker panel
      const rowsDropdown = pickerPanel.locator('.p-paginator-rpp-options');
      if (await rowsDropdown.count() > 0) {
        await rowsDropdown.click();
        await page.waitForTimeout(200);
        await page.locator('.p-dropdown-item').filter({ hasText: '10' }).click();
        await page.waitForTimeout(300);
      }
      await screenshotWithUrl(page, 'V1.7.3-picker-rows-10.png', true);
    });

    test('V1.7.4 - Picker Table change rows to 50', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all except Picker
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Statistics', 'Results Table']);
      const pickerPanel = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 }).locator('..').locator('..');
      const rowsDropdown = pickerPanel.locator('.p-paginator-rpp-options');
      if (await rowsDropdown.count() > 0) {
        await rowsDropdown.click();
        await page.waitForTimeout(200);
        await page.locator('.p-dropdown-item').filter({ hasText: '50' }).click();
        await page.waitForTimeout(300);
      }
      await screenshotWithUrl(page, 'V1.7.4-picker-rows-50.png', true);
    });

    test('V1.7.5 - Picker Table change rows to 100', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all except Picker
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Statistics', 'Results Table']);
      const pickerPanel = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 }).locator('..').locator('..');
      const rowsDropdown = pickerPanel.locator('.p-paginator-rpp-options');
      if (await rowsDropdown.count() > 0) {
        await rowsDropdown.click();
        await page.waitForTimeout(200);
        await page.locator('.p-dropdown-item').filter({ hasText: '100' }).click();
        await page.waitForTimeout(300);
      }
      await screenshotWithUrl(page, 'V1.7.5-picker-rows-100.png', true);
    });

    test('V1.7.6 - Results Table navigate via URL page=2', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?page=2`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all except Results Table
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'V1.7.6-results-page2-url.png', true);
      await expect(page).toHaveURL(/page=2/);
    });

    test('V1.7.7 - Results Table navigate via URL size=50', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?size=50`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all except Results Table
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'V1.7.7-results-rows-50-url.png', true);
      await expect(page).toHaveURL(/size=50/);
    });
  });

  test.describe('1.8 Pagination Interaction (Popped-Out)', () => {
    test('V1.8.1 - Picker Table (pop-out) click page 2', async ({ page, context }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Click pop-out button for Picker
      const pickerHeading = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 });
      const pickerHeader = pickerHeading.locator('..').locator('..');
      const popoutButton = pickerHeader.locator('button:has(.pi-window-maximize)');

      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        popoutButton.click()
      ]);

      await popup.waitForLoadState('networkidle');
      await popup.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Navigate to page 2 in popup
      const page2Button = popup.locator('.p-paginator-pages button').nth(1);
      if (await page2Button.count() > 0) {
        await page2Button.click();
        await popup.waitForTimeout(300);
      }

      await screenshotWithUrl(popup, 'V1.8.1-picker-popout-page2.png', true);
      await popup.close();
    });

    test('V1.8.2 - Picker Table (pop-out) change rows to 50', async ({ page, context }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Click pop-out button for Picker
      const pickerHeading = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 });
      const pickerHeader = pickerHeading.locator('..').locator('..');
      const popoutButton = pickerHeader.locator('button:has(.pi-window-maximize)');

      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        popoutButton.click()
      ]);

      await popup.waitForLoadState('networkidle');
      await popup.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Change rows to 50 in popup
      const rowsDropdown = popup.locator('.p-paginator-rpp-options');
      if (await rowsDropdown.count() > 0) {
        await rowsDropdown.click();
        await popup.waitForTimeout(200);
        await popup.locator('.p-dropdown-item').filter({ hasText: '50' }).click();
        await popup.waitForTimeout(300);
      }

      await screenshotWithUrl(popup, 'V1.8.2-picker-popout-rows-50.png', true);
      await popup.close();
    });

    test('V1.8.3 - Picker Table (pop-out) change rows to 100', async ({ page, context }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Click pop-out button for Picker
      const pickerHeading = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 });
      const pickerHeader = pickerHeading.locator('..').locator('..');
      const popoutButton = pickerHeader.locator('button:has(.pi-window-maximize)');

      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        popoutButton.click()
      ]);

      await popup.waitForLoadState('networkidle');
      await popup.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Change rows to 100 in popup
      const rowsDropdown = popup.locator('.p-paginator-rpp-options');
      if (await rowsDropdown.count() > 0) {
        await rowsDropdown.click();
        await popup.waitForTimeout(200);
        await popup.locator('.p-dropdown-item').filter({ hasText: '100' }).click();
        await popup.waitForTimeout(300);
      }

      await screenshotWithUrl(popup, 'V1.8.3-picker-popout-rows-100.png', true);
      await popup.close();
    });
  });

  test.describe('1.9 Picker Selection and Apply', () => {
    test('V1.9.1 - Picker (in) select rows before Apply', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all except Picker
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Statistics', 'Results Table']);

      // Find the picker table and select some rows
      const pickerPanel = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 }).locator('..').locator('..');
      const checkboxes = pickerPanel.locator('table tbody tr .p-checkbox');

      // Select first 2 rows
      if (await checkboxes.count() > 1) {
        await checkboxes.nth(0).click();
        await page.waitForTimeout(100);
        await checkboxes.nth(1).click();
        await page.waitForTimeout(100);
      }

      await screenshotWithUrl(page, 'V1.9.1-picker-selected-before-apply.png', true);
    });

    test('V1.9.2 - Picker (in) after Apply clicked', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all except Picker initially
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Statistics', 'Results Table']);

      // Find the picker table and select some rows
      const pickerPanel = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 }).locator('..').locator('..');
      const checkboxes = pickerPanel.locator('table tbody tr .p-checkbox');

      // Select first 2 rows
      if (await checkboxes.count() > 1) {
        await checkboxes.nth(0).click();
        await page.waitForTimeout(100);
        await checkboxes.nth(1).click();
        await page.waitForTimeout(100);
      }

      // Click Apply button
      const applyButton = pickerPanel.locator('button').filter({ hasText: /Apply/i });
      if (await applyButton.count() > 0) {
        await applyButton.click();
        await page.waitForTimeout(500);
      }

      // Now expand Query Control and Statistics to show the filtered state
      await expandPanels(page, ['Query Control', 'Statistics']);
      await collapsePanels(page, ['Query Panel', 'Manufacturer-Model Picker', 'Results Table']);

      await screenshotWithUrl(page, 'V1.9.2-picker-after-apply.png', true);
      await expect(page).toHaveURL(/models=/);
    });

    test('V1.9.3 - Picker (out) select rows before Apply', async ({ page, context }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Click pop-out button for Picker
      const pickerHeading = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 });
      const pickerHeader = pickerHeading.locator('..').locator('..');
      const popoutButton = pickerHeader.locator('button:has(.pi-window-maximize)');

      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        popoutButton.click()
      ]);

      await popup.waitForLoadState('networkidle');
      await popup.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Select some rows in popup
      const checkboxes = popup.locator('table tbody tr .p-checkbox');
      if (await checkboxes.count() > 1) {
        await checkboxes.nth(0).click();
        await popup.waitForTimeout(100);
        await checkboxes.nth(1).click();
        await popup.waitForTimeout(100);
      }

      await screenshotWithUrl(popup, 'V1.9.3-picker-popout-selected.png', true);
      await popup.close();
    });

    test('V1.9.4 - Picker (out) after Apply clicked', async ({ page, context }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Click pop-out button for Picker
      const pickerHeading = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 });
      const pickerHeader = pickerHeading.locator('..').locator('..');
      const popoutButton = pickerHeader.locator('button:has(.pi-window-maximize)');

      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        popoutButton.click()
      ]);

      await popup.waitForLoadState('networkidle');
      await popup.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Select some rows and click Apply in popup
      const checkboxes = popup.locator('table tbody tr .p-checkbox');
      if (await checkboxes.count() > 1) {
        await checkboxes.nth(0).click();
        await popup.waitForTimeout(100);
        await checkboxes.nth(1).click();
        await popup.waitForTimeout(100);
      }

      const applyButton = popup.locator('button').filter({ hasText: /Apply/i });
      if (await applyButton.count() > 0) {
        await applyButton.click();
        await page.waitForTimeout(500);
      }

      await popup.close();

      // Now take screenshot of main window showing the applied filter
      await page.waitForTimeout(300);
      await collapsePanels(page, ['Query Panel', 'Manufacturer-Model Picker', 'Results Table']);
      await screenshotWithUrl(page, 'V1.9.4-picker-popout-after-apply.png', true);
      await expect(page).toHaveURL(/models=/);
    });

    test('V1.9.5 - Picker (in) clear selection', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?models=Ford:Mustang`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });
      // Collapse all except Picker
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Statistics', 'Results Table']);

      // Find and click the Clear button in picker
      const pickerPanel = page.getByRole('heading', { name: 'Manufacturer-Model Picker', level: 3 }).locator('..').locator('..');
      const clearButton = pickerPanel.locator('button').filter({ hasText: /Clear/i });

      if (await clearButton.count() > 0) {
        await clearButton.click();
        await page.waitForTimeout(300);
      }

      await screenshotWithUrl(page, 'V1.9.5-picker-cleared.png', true);
    });
  });
});
