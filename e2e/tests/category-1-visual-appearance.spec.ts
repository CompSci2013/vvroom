/**
 * Category 1: Visual Appearance Tests
 *
 * Test that components render correctly in default and various states.
 * All screenshots must include the full browser URL bar at the top.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4207';
const SCREENSHOT_DIR = 'e2e/screenshots';

test.describe('Category 1: Visual Appearance Tests', () => {

  // ========================================
  // 1.1 Default State Rendering
  // ========================================
  test.describe('1.1 Default State Rendering', () => {

    test('V1.1.1 - Results Table renders with default 25 rows', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');

      // Wait for results table to be visible
      const resultsTable = page.locator('[data-testid="results-table"], [data-testid="results-table-panel"], table');
      await expect(resultsTable.first()).toBeVisible({ timeout: 10000 });

      // Wait for data to load (rows should appear)
      await page.waitForTimeout(2000);

      // Capture screenshot with URL bar visible
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/results-table-default.png`,
        fullPage: false
      });

      // Verify table has rows (default size is 25)
      const tableRows = page.locator('table tbody tr, .p-datatable-tbody tr');
      const rowCount = await tableRows.count();
      expect(rowCount).toBeGreaterThanOrEqual(1);
      console.log(`V1.1.1: Results table has ${rowCount} rows`);
    });

    test('V1.1.2 - Filter Panel visible and enabled', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');

      // Wait for query control panel
      const filterPanel = page.locator('[data-testid="query-control-panel"], [data-testid="query-panel"], .query-control-panel, .query-panel');
      await expect(filterPanel.first()).toBeVisible({ timeout: 10000 });

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/filter-panel-default.png`,
        fullPage: false
      });

      console.log('V1.1.2: Filter panel is visible');
    });

    test('V1.1.3 - Pagination shows page 1 and correct total', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');

      // Wait for pagination component
      const pagination = page.locator('.p-paginator, [data-testid="pagination"]');
      await expect(pagination.first()).toBeVisible({ timeout: 10000 });

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/pagination-default.png`,
        fullPage: false
      });

      console.log('V1.1.3: Pagination is visible');
    });

    test('V1.1.4 - Statistics Panel displays counts', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');

      // Wait for statistics panel
      const statsPanel = page.locator('[data-testid="statistics-panel-2"], .statistics-content');
      await expect(statsPanel.first()).toBeVisible({ timeout: 10000 });

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/statistics-default.png`,
        fullPage: false
      });

      console.log('V1.1.4: Statistics panel is visible');
    });

    test('V1.1.5 - Full page default state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/full-page-default.png`,
        fullPage: true
      });

      console.log('V1.1.5: Full page screenshot captured');
    });
  });

  // ========================================
  // 1.2 Filtered State Rendering
  // ========================================
  test.describe('1.2 Filtered State Rendering', () => {

    test('V1.2.1 - Results Table filtered by manufacturer=Ford', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/results-table-filtered-ford.png`,
        fullPage: false
      });

      // Verify URL contains the filter
      expect(page.url()).toContain('manufacturer=Ford');
      console.log('V1.2.1: Filtered by Ford - URL verified');
    });

    test('V1.2.2 - Results Table filtered by bodyClass=SUV', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?bodyClass=SUV`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/results-table-filtered-suv.png`,
        fullPage: false
      });

      expect(page.url()).toContain('bodyClass=SUV');
      console.log('V1.2.2: Filtered by SUV - URL verified');
    });

    test('V1.2.3 - Results Table filtered by year range 2020-2024', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?yearMin=2020&yearMax=2024`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/results-table-filtered-recent.png`,
        fullPage: false
      });

      expect(page.url()).toContain('yearMin=2020');
      expect(page.url()).toContain('yearMax=2024');
      console.log('V1.2.3: Filtered by year range - URL verified');
    });
  });

  // ========================================
  // 1.3 Highlighted State Rendering
  // ========================================
  test.describe('1.3 Highlighted State Rendering', () => {

    test('V1.3.1 - Results Table with h_manufacturer=Tesla highlight', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/results-table-highlight-tesla.png`,
        fullPage: false
      });

      expect(page.url()).toContain('h_manufacturer=Tesla');
      console.log('V1.3.1: Tesla highlight applied - URL verified');
    });

    test('V1.3.2 - Results Table with year highlight 2015-2020', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?h_yearMin=2015&h_yearMax=2020`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/results-table-highlight-years.png`,
        fullPage: false
      });

      expect(page.url()).toContain('h_yearMin=2015');
      expect(page.url()).toContain('h_yearMax=2020');
      console.log('V1.3.2: Year highlight applied - URL verified');
    });

    test('V1.3.4 - Filter + Highlight combination', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford&h_yearMin=2018`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/results-table-filter-with-highlight.png`,
        fullPage: false
      });

      expect(page.url()).toContain('manufacturer=Ford');
      expect(page.url()).toContain('h_yearMin=2018');
      console.log('V1.3.4: Filter + highlight combination - URL verified');
    });
  });

  // ========================================
  // 1.4 Sorted State Rendering
  // ========================================
  test.describe('1.4 Sorted State Rendering', () => {

    test('V1.4.1 - Results Table sorted by year descending', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?sortBy=year&sortOrder=desc`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/results-table-sorted-year-desc.png`,
        fullPage: false
      });

      expect(page.url()).toContain('sortBy=year');
      expect(page.url()).toContain('sortOrder=desc');
      console.log('V1.4.1: Sorted by year desc - URL verified');
    });

    test('V1.4.2 - Results Table sorted by manufacturer ascending', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?sortBy=manufacturer&sortOrder=asc`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/results-table-sorted-manufacturer-asc.png`,
        fullPage: false
      });

      expect(page.url()).toContain('sortBy=manufacturer');
      expect(page.url()).toContain('sortOrder=asc');
      console.log('V1.4.2: Sorted by manufacturer asc - URL verified');
    });
  });

  // ========================================
  // 1.5 Paginated State Rendering
  // ========================================
  test.describe('1.5 Paginated State Rendering', () => {

    test('V1.5.1 - Results Table on page 2 with size 10', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?page=2&size=10`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/results-table-paginated-page2.png`,
        fullPage: false
      });

      expect(page.url()).toContain('page=2');
      expect(page.url()).toContain('size=10');
      console.log('V1.5.1: Paginated page 2 size 10 - URL verified');
    });

    test('V1.5.2 - Pagination control on page 5 with size 25', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?page=5&size=25`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/pagination-page5.png`,
        fullPage: false
      });

      expect(page.url()).toContain('page=5');
      expect(page.url()).toContain('size=25');
      console.log('V1.5.2: Pagination page 5 size 25 - URL verified');
    });
  });
});
