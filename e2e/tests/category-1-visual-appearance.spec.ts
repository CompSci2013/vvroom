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
});
