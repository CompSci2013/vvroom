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
});
