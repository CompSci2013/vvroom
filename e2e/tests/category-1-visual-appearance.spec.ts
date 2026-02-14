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
});
