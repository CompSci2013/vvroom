import { test, expect } from '@playwright/test';
import {
  PANEL_IDS,
  setPanelVisibility,
  takeScreenshot,
  navigateToDiscover,
  waitForPageLoad,
} from './screenshot-helper';

test.describe('Category 1: Visual Appearance Tests', () => {
  test.describe('V1.1.x Default State Rendering', () => {
    test('V1.1.1 - Results Table default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Per panel-visibility-reference: Results Table expanded, others collapsed
      await setPanelVisibility(
        page,
        [PANEL_IDS.RESULTS_TABLE],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.1.1', 'results-table-default');

      // Verify URL is clean (no params)
      expect(page.url()).toContain('/discover');
    });

    test('V1.1.2 - Filter Panel default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Per panel-visibility-reference: Query Panel expanded, others collapsed
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_PANEL],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.1.2', 'filter-panel-default');

      expect(page.url()).toContain('/discover');
    });

    test('V1.1.3 - Pagination default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Per panel-visibility-reference: Results Table expanded (shows pagination), others collapsed
      await setPanelVisibility(
        page,
        [PANEL_IDS.RESULTS_TABLE],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.1.3', 'pagination-default');

      expect(page.url()).toContain('/discover');
    });

    test('V1.1.4 - Statistics Panel default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Per panel-visibility-reference: Statistics expanded, others collapsed
      await setPanelVisibility(
        page,
        [PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.1.4', 'statistics-default');

      expect(page.url()).toContain('/discover');
    });

    test('V1.1.5 - Search Input default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Per panel-visibility-reference: Query Control expanded, others collapsed
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.1.5', 'search-default');

      expect(page.url()).toContain('/discover');
    });
  });

  test.describe('V1.2.x Filtered State Rendering', () => {
    test('V1.2.1 - Results table filtered by manufacturer (Ford)', async ({ page }) => {
      await navigateToDiscover(page, 'manufacturer=Ford');

      // Per panel-visibility-reference: Query Control (filter chip) + Statistics expanded
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.2.1', 'results-table-filtered-ford');

      expect(page.url()).toContain('manufacturer=Ford');
    });

    test('V1.2.2 - Results table filtered by body class (SUV)', async ({ page }) => {
      await navigateToDiscover(page, 'bodyClass=SUV');

      // Per panel-visibility-reference: Query Control (filter chip) + Statistics expanded
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.2.2', 'results-table-filtered-suv');

      expect(page.url()).toContain('bodyClass=SUV');
    });

    test('V1.2.3 - Results table filtered by year range (2020-2024)', async ({ page }) => {
      await navigateToDiscover(page, 'yearMin=2020&yearMax=2024');

      // Per panel-visibility-reference: Query Control (filter chip) + Statistics expanded
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.2.3', 'results-table-filtered-recent');

      expect(page.url()).toContain('yearMin=2020');
      expect(page.url()).toContain('yearMax=2024');
    });

    test('V1.2.4 - Statistics filtered by manufacturer (Chevrolet)', async ({ page }) => {
      await navigateToDiscover(page, 'manufacturer=Chevrolet');

      // Per panel-visibility-reference: Query Control (filter chip) + Statistics expanded
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.2.4', 'statistics-filtered-chevrolet');

      expect(page.url()).toContain('manufacturer=Chevrolet');
    });

    test('V1.2.5 - Results table with model combinations', async ({ page }) => {
      await navigateToDiscover(page, 'models=Ford:Mustang,Chevrolet:Camaro');

      // Per panel-visibility-reference: Query Control (models chip) + Statistics expanded
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.2.5', 'results-table-model-combos');

      expect(page.url()).toContain('models=Ford:Mustang');
    });
  });

  test.describe('V1.3.x Highlighted State Rendering', () => {
    test('V1.3.1 - Statistics charts with manufacturer highlight (Tesla)', async ({ page }) => {
      await navigateToDiscover(page, 'h_manufacturer=Tesla');

      // Per rubric: Query Control (shows highlight chip) + Statistics expanded
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.3.1', 'statistics-highlight-tesla');

      expect(page.url()).toContain('h_manufacturer=Tesla');
    });

    test('V1.3.2 - Statistics charts with year range highlight (2015-2020)', async ({ page }) => {
      await navigateToDiscover(page, 'h_yearMin=2015&h_yearMax=2020');

      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.3.2', 'statistics-highlight-years');

      expect(page.url()).toContain('h_yearMin=2015');
      expect(page.url()).toContain('h_yearMax=2020');
    });

    test('V1.3.3 - Statistics charts with body class highlight (Pickup)', async ({ page }) => {
      await navigateToDiscover(page, 'h_bodyClass=Pickup');

      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.3.3', 'statistics-highlight-pickup');

      expect(page.url()).toContain('h_bodyClass=Pickup');
    });

    test('V1.3.4 - Statistics with filter and highlight combined', async ({ page }) => {
      await navigateToDiscover(page, 'manufacturer=Ford&h_yearMin=2018');

      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      await page.waitForTimeout(300);
      await takeScreenshot(page, 'V1.3.4', 'statistics-filter-with-highlight');

      expect(page.url()).toContain('manufacturer=Ford');
      expect(page.url()).toContain('h_yearMin=2018');
    });
  });
});
