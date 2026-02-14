import { test, expect } from '@playwright/test';
import {
  PANEL_IDS,
  setPanelVisibility,
  takeScreenshot,
  navigateToDiscover,
} from './screenshot-helper';

test.describe('Category 1: Visual Appearance Tests', () => {
  test.describe('1.1 Default State Rendering', () => {
    test('V1.1.1 - Results table default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Per panel-visibility-reference: Results Table expanded, others collapsed
      await setPanelVisibility(
        page,
        [PANEL_IDS.RESULTS_TABLE],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS]
      );

      // Verify URL is /discover with no filter params
      expect(page.url()).toContain('/discover');

      // Take screenshot
      await takeScreenshot(page, 'V1.1.1', 'results-table-default');
    });

    test('V1.1.2 - Filter panel default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Per panel-visibility-reference: Query Panel expanded, others collapsed
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_PANEL],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS, PANEL_IDS.RESULTS_TABLE]
      );

      expect(page.url()).toContain('/discover');

      await takeScreenshot(page, 'V1.1.2', 'filter-panel-default');
    });

    test('V1.1.3 - Pagination default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Per panel-visibility-reference: Results Table expanded, others collapsed
      await setPanelVisibility(
        page,
        [PANEL_IDS.RESULTS_TABLE],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS]
      );

      expect(page.url()).toContain('/discover');

      await takeScreenshot(page, 'V1.1.3', 'pagination-default');
    });

    test('V1.1.4 - Statistics panel default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Per panel-visibility-reference: Statistics expanded, others collapsed
      await setPanelVisibility(
        page,
        [PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      expect(page.url()).toContain('/discover');

      await takeScreenshot(page, 'V1.1.4', 'statistics-default');
    });

    test('V1.1.5 - Search input default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Per panel-visibility-reference: Query Control expanded, others collapsed
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS, PANEL_IDS.RESULTS_TABLE]
      );

      expect(page.url()).toContain('/discover');

      await takeScreenshot(page, 'V1.1.5', 'search-default');
    });
  });

  test.describe('1.2 Filtered State Rendering', () => {
    test('V1.2.1 - Results table filtered by manufacturer (Ford)', async ({ page }) => {
      await navigateToDiscover(page, 'manufacturer=Ford');

      // Per panel-visibility-reference: Query Control (filter chip) + Statistics expanded
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      expect(page.url()).toContain('manufacturer=Ford');

      await takeScreenshot(page, 'V1.2.1', 'results-table-filtered-ford');
    });

    test('V1.2.2 - Results table filtered by body class (SUV)', async ({ page }) => {
      await navigateToDiscover(page, 'bodyClass=SUV');

      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      expect(page.url()).toContain('bodyClass=SUV');

      await takeScreenshot(page, 'V1.2.2', 'results-table-filtered-suv');
    });

    test('V1.2.3 - Results table filtered by year range (2020-2024)', async ({ page }) => {
      await navigateToDiscover(page, 'yearMin=2020&yearMax=2024');

      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      expect(page.url()).toContain('yearMin=2020');
      expect(page.url()).toContain('yearMax=2024');

      await takeScreenshot(page, 'V1.2.3', 'results-table-filtered-recent');
    });

    test('V1.2.4 - Statistics filtered by manufacturer (Chevrolet)', async ({ page }) => {
      await navigateToDiscover(page, 'manufacturer=Chevrolet');

      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      expect(page.url()).toContain('manufacturer=Chevrolet');

      await takeScreenshot(page, 'V1.2.4', 'statistics-filtered-chevrolet');
    });

    test('V1.2.5 - Results table with model combinations', async ({ page }) => {
      await navigateToDiscover(page, 'models=Ford:Mustang,Chevrolet:Camaro');

      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      expect(page.url()).toContain('models=');

      await takeScreenshot(page, 'V1.2.5', 'results-table-model-combos');
    });
  });
});
