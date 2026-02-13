import { test, expect } from '@playwright/test';
import { screenshotWithUrl } from './screenshot-helper';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 5: Cross-Window Synchronization Tests', () => {
  test.describe('5.1 Main Window to Pop-Out', () => {
    test('S5.1.1 - Change manufacturer filter in main updates pop-out', async ({ context }) => {
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

      // Apply manufacturer filter in main window
      const manufacturerInput = mainPage.getByPlaceholder('Enter manufacturer name');
      await manufacturerInput.click();
      await manufacturerInput.fill('Ford');
      await mainPage.waitForTimeout(300);
      await mainPage.getByRole('option', { name: 'Ford' }).first().click();
      await mainPage.waitForTimeout(1000);

      // Pop-out should reflect Ford data
      await screenshotWithUrl(popoutPage, 'sync-main-to-popout-ford.png', true);
    });

    test('S5.1.2 - Apply year range filter in main updates pop-out', async ({ context }) => {
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

      // Apply year range via UI
      const yearMinInput = mainPage.locator('input[placeholder="Min"]').first();
      await yearMinInput.click();
      await yearMinInput.fill('2015');
      await mainPage.keyboard.press('Enter');
      await mainPage.waitForTimeout(1000);

      // Pop-out should show 2015+ data via BroadcastChannel
      await screenshotWithUrl(popoutPage, 'sync-main-to-popout-year-range.png', true);
    });

    test('S5.1.3 - Change sort column in main updates pop-out', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Pop out statistics (not results table, so we can still click column headers)
      const statisticsHeader = mainPage.getByRole('heading', { name: 'Statistics', level: 3 });
      const panelHeader = statisticsHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('networkidle');

      // Change sort via UI - click Year column header in results table (more specific)
      await mainPage.locator('th').filter({ hasText: 'Year' }).first().click();
      await mainPage.waitForTimeout(1000);

      // Pop-out statistics should reflect sorted data via BroadcastChannel
      await screenshotWithUrl(popoutPage, 'sync-main-to-popout-sort.png', true);
    });

    test('S5.1.4 - Change page in main updates pop-out', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Pop out statistics (not results table, so we can click pagination in main)
      const statisticsHeader = mainPage.getByRole('heading', { name: 'Statistics', level: 3 });
      const panelHeader = statisticsHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('networkidle');

      // Change page via UI - click page 4 in Results Table pagination
      await mainPage.locator('.p-paginator').locator('button:has-text("4")').first().click();
      await mainPage.waitForTimeout(1000);

      // Pop-out statistics should reflect page 4 data via BroadcastChannel
      await screenshotWithUrl(popoutPage, 'sync-main-to-popout-page.png', true);
    });

    test('S5.1.5 - Apply highlight in main updates pop-out', async ({ context }) => {
      // For highlight tests, start with highlight already applied and pop out
      // This verifies the pop-out receives the highlight state
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover?h_bodyClass=Pickup`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });

      // Pop out statistics - it should already have the highlight
      const statisticsHeader = mainPage.getByRole('heading', { name: 'Statistics', level: 3 });
      const panelHeader = statisticsHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.waitForTimeout(500);

      // Pop-out should show Pickup highlights
      await screenshotWithUrl(popoutPage, 'sync-main-to-popout-highlight.png', true);
    });

    test('S5.1.6 - Clear all filters in main updates pop-out', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover?manufacturer=Ford&bodyClass=SUV`);
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

      // Clear filters by clicking Clear All button
      await mainPage.getByRole('button', { name: /Clear All/i }).click();
      await mainPage.waitForTimeout(1000);

      // Pop-out should show unfiltered data
      await screenshotWithUrl(popoutPage, 'sync-main-to-popout-cleared.png', true);
    });
  });

  test.describe('5.2 Pop-Out to Main Window', () => {
    test('S5.2.1 - Change filter in pop-out updates main window URL', async ({ context }) => {
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

      // Apply filter in pop-out
      const manufacturerInput = popoutPage.getByPlaceholder('Enter manufacturer name');
      await manufacturerInput.click();
      await manufacturerInput.fill('Dodge');
      await popoutPage.waitForTimeout(300);
      await popoutPage.getByRole('option', { name: 'Dodge' }).first().click();
      await popoutPage.waitForTimeout(1000);

      // Main window URL should contain manufacturer=Dodge
      await expect(mainPage).toHaveURL(/manufacturer=Dodge/);

      await screenshotWithUrl(mainPage, 'sync-popout-to-main-filter.png', true);
    });

    test('S5.2.2 - Apply year range in pop-out updates main window URL', async ({ context }) => {
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

      // Apply year range in pop-out
      const yearMinInput = popoutPage.locator('input[placeholder="Min"]').first();
      await yearMinInput.click();
      await yearMinInput.fill('2010');
      await popoutPage.keyboard.press('Enter');
      await popoutPage.waitForTimeout(1000);

      // Main window URL should contain yearMin=2010
      await expect(mainPage).toHaveURL(/yearMin=2010/);

      await screenshotWithUrl(mainPage, 'sync-popout-to-main-year.png', true);
    });

    test('S5.2.3 - Clear filters in pop-out updates main window URL', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover?manufacturer=Ford&bodyClass=Coupe`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.getByRole('heading', { name: 'Query Control' }).waitFor({ state: 'visible', timeout: 10000 });

      // Pop out Query Control
      const queryControlHeader = mainPage.getByRole('heading', { name: 'Query Control', level: 3 });
      const panelHeader = queryControlHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('networkidle');

      // Clear filters in pop-out
      await popoutPage.getByRole('button', { name: /Clear All/i }).click();
      await popoutPage.waitForTimeout(1000);

      // Main window URL should not have filter params
      await expect(mainPage).not.toHaveURL(/manufacturer=/);
      await expect(mainPage).not.toHaveURL(/bodyClass=/);

      await screenshotWithUrl(mainPage, 'sync-popout-to-main-cleared.png', true);
    });
  });

  test.describe('5.3 BroadcastChannel Verification', () => {
    test('S5.3.1 - Filter change propagates via BroadcastChannel', async ({ context }) => {
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

      // Track initial pop-out state
      const initialPopoutUrl = popoutPage.url();

      // Apply filter in main window via UI
      const manufacturerInput = mainPage.getByPlaceholder('Enter manufacturer name');
      await manufacturerInput.click();
      await manufacturerInput.fill('Tesla');
      await mainPage.waitForTimeout(300);
      await mainPage.getByRole('option', { name: 'Tesla' }).first().click();
      await mainPage.waitForTimeout(1000);

      // Pop-out URL should remain same (sync via BroadcastChannel, not URL)
      expect(popoutPage.url()).toBe(initialPopoutUrl);

      // But the content should have updated - take screenshot to verify
      await screenshotWithUrl(popoutPage, 'broadcast-channel-sync.png', true);
    });

    test('S5.3.2 - Multiple pop-outs receive same BroadcastChannel message', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Pop out results table
      const resultsTableHeader = mainPage.getByRole('heading', { name: 'Results Table', level: 3 });
      const resultsPanel = resultsTableHeader.locator('..').locator('..');
      const resultsPopout = resultsPanel.locator('button:has(.pi-external-link)');

      const popout1Promise = context.waitForEvent('page');
      await resultsPopout.click();
      const popoutResults = await popout1Promise;
      await popoutResults.waitForLoadState('networkidle');

      // Pop out statistics
      const statisticsHeader = mainPage.getByRole('heading', { name: 'Statistics', level: 3 });
      const statsPanel = statisticsHeader.locator('..').locator('..');
      const statsPopout = statsPanel.locator('button:has(.pi-external-link)');

      const popout2Promise = context.waitForEvent('page');
      await statsPopout.click();
      const popoutStats = await popout2Promise;
      await popoutStats.waitForLoadState('networkidle');

      // Apply filter in main window via UI
      const manufacturerInput = mainPage.getByPlaceholder('Enter manufacturer name');
      await manufacturerInput.click();
      await manufacturerInput.fill('Jeep');
      await mainPage.waitForTimeout(300);
      await mainPage.getByRole('option', { name: 'Jeep' }).first().click();
      await mainPage.waitForTimeout(1000);

      // Both pop-outs should have updated via BroadcastChannel
      await screenshotWithUrl(popoutResults, 'broadcast-multi-results-jeep.png', true);
      await screenshotWithUrl(popoutStats, 'broadcast-multi-stats-jeep.png', true);
    });

    test('S5.3.3 - Highlight state transfers to statistics pop-out', async ({ context }) => {
      // For highlight tests, start with highlight applied and verify pop-out receives it
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover?h_yearMin=2020&h_yearMax=2024`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });

      // Pop out statistics - should receive the highlight state
      const statisticsHeader = mainPage.getByRole('heading', { name: 'Statistics', level: 3 });
      const panelHeader = statisticsHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.waitForTimeout(500);

      // Pop-out should show highlighted years (2020-2024)
      await screenshotWithUrl(popoutPage, 'broadcast-highlight-years.png', true);
    });
  });
});
