import { test, expect } from '@playwright/test';
import {
  takeScreenshot,
  navigateToDiscover,
  setPanelVisibility,
  PANEL_IDS,
} from './screenshot-helper';

/**
 * Category 1: Visual Appearance Tests
 *
 * These tests verify that components render correctly in default and various states.
 * All screenshots include a URL bar at the top to verify URL-First state management.
 */

// =============================================================================
// 1.1 Default State Rendering (5 tests)
// =============================================================================

test.describe('Category 1: Visual Appearance Tests', () => {
  test.describe('1.1 Default State Rendering', () => {
    test('V1.1.1: Results Table default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Focus on Results Table - expand only that panel
      await setPanelVisibility(
        page,
        [PANEL_IDS.RESULTS_TABLE],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS]
      );

      // Verify URL is default (no params)
      expect(page.url()).toContain('/discover');

      await takeScreenshot(page, 'V1.1.1', 'results-table-default');
    });

    test('V1.1.2: Filter Panel default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Focus on Query Panel - expand only that panel
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_PANEL],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS, PANEL_IDS.RESULTS_TABLE]
      );

      // Verify URL is default (no params)
      expect(page.url()).toContain('/discover');

      await takeScreenshot(page, 'V1.1.2', 'filter-panel-default');
    });

    test('V1.1.3: Pagination default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Focus on Results Table (contains pagination) - expand only that panel
      await setPanelVisibility(
        page,
        [PANEL_IDS.RESULTS_TABLE],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS]
      );

      // Verify URL is default (no params)
      expect(page.url()).toContain('/discover');

      await takeScreenshot(page, 'V1.1.3', 'pagination-default');
    });

    test('V1.1.4: Statistics Panel default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Focus on Statistics - expand only that panel
      await setPanelVisibility(
        page,
        [PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      // Verify URL is default (no params)
      expect(page.url()).toContain('/discover');

      await takeScreenshot(page, 'V1.1.4', 'statistics-default');
    });

    test('V1.1.5: Search Input default render', async ({ page }) => {
      await navigateToDiscover(page);

      // Focus on Query Control - expand only that panel
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.STATISTICS, PANEL_IDS.RESULTS_TABLE]
      );

      // Verify URL is default (no params)
      expect(page.url()).toContain('/discover');

      await takeScreenshot(page, 'V1.1.5', 'search-default');
    });
  });

  // =============================================================================
  // 1.2 Filtered State Rendering (5 tests)
  // =============================================================================

  test.describe('1.2 Filtered State Rendering', () => {
    test('V1.2.1: Results table filtered by manufacturer (Ford)', async ({ page }) => {
      await navigateToDiscover(page, 'manufacturer=Ford');

      // Show Query Control (filter chip) + Statistics to visualize filtered data
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      // Verify URL contains manufacturer param
      expect(page.url()).toContain('manufacturer=Ford');

      await takeScreenshot(page, 'V1.2.1', 'results-table-filtered-ford');
    });

    test('V1.2.2: Results table filtered by body class (SUV)', async ({ page }) => {
      await navigateToDiscover(page, 'bodyClass=SUV');

      // Show Query Control (filter chip) + Statistics to visualize filtered data
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      // Verify URL contains bodyClass param
      expect(page.url()).toContain('bodyClass=SUV');

      await takeScreenshot(page, 'V1.2.2', 'results-table-filtered-suv');
    });

    test('V1.2.3: Results table filtered by year range (2020-2024)', async ({ page }) => {
      await navigateToDiscover(page, 'yearMin=2020&yearMax=2024');

      // Show Query Control (filter chip) + Statistics to visualize filtered data
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      // Verify URL contains year range params
      expect(page.url()).toContain('yearMin=2020');
      expect(page.url()).toContain('yearMax=2024');

      await takeScreenshot(page, 'V1.2.3', 'results-table-filtered-recent');
    });

    test('V1.2.4: Statistics filtered by manufacturer (Chevrolet)', async ({ page }) => {
      await navigateToDiscover(page, 'manufacturer=Chevrolet');

      // Show Query Control (filter chip) + Statistics to visualize filtered data
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      // Verify URL contains manufacturer param
      expect(page.url()).toContain('manufacturer=Chevrolet');

      await takeScreenshot(page, 'V1.2.4', 'statistics-filtered-chevrolet');
    });

    test('V1.2.5: Results table with model combinations', async ({ page }) => {
      await navigateToDiscover(page, 'models=Ford:Mustang,Chevrolet:Camaro');

      // Show Query Control (models chip) + Statistics to visualize filtered data
      await setPanelVisibility(
        page,
        [PANEL_IDS.QUERY_CONTROL, PANEL_IDS.STATISTICS],
        [PANEL_IDS.QUERY_PANEL, PANEL_IDS.PICKER, PANEL_IDS.RESULTS_TABLE]
      );

      // Verify URL contains models param
      expect(page.url()).toContain('models=Ford');
      expect(page.url()).toContain('Mustang');
      expect(page.url()).toContain('Chevrolet');
      expect(page.url()).toContain('Camaro');

      await takeScreenshot(page, 'V1.2.5', 'results-table-model-combos');
    });
  });
});
