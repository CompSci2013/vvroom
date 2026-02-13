import { test, expect, BrowserContext, Page } from '@playwright/test';
import { screenshotWithUrl } from './screenshot-helper';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 4: Pop-Out Behavior Tests', () => {
  test.describe('4.1 Pop-Out Window Rendering', () => {
    test('P4.1.1 - Pop out results table', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Find and click the pop-out button for Results Table
      const resultsTableHeader = mainPage.getByRole('heading', { name: 'Results Table', level: 3 });
      const panelHeader = resultsTableHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      // Listen for new page (pop-out window)
      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;

      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Verify pop-out URL is the panel route
      await expect(popoutPage).toHaveURL(/\/panel\/discover\//);

      // Take screenshot of pop-out window
      await screenshotWithUrl(popoutPage, 'results-table-popout-standalone.png', true);
    });

    test('P4.1.2 - Pop out statistics panel', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });

      // Find and click the pop-out button for Statistics
      const statisticsHeader = mainPage.getByRole('heading', { name: 'Statistics', level: 3 });
      const panelHeader = statisticsHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;

      await popoutPage.waitForLoadState('networkidle');

      // Verify pop-out URL is the panel route
      await expect(popoutPage).toHaveURL(/\/panel\/discover\//);

      await screenshotWithUrl(popoutPage, 'statistics-popout-standalone.png', true);
    });

    test('P4.1.3 - Pop out filter panel (Query Panel)', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.getByRole('heading', { name: 'Query Panel' }).waitFor({ state: 'visible', timeout: 10000 });

      // Find and click the pop-out button for Query Panel
      const queryPanelHeader = mainPage.getByRole('heading', { name: 'Query Panel', level: 3 });
      const panelHeader = queryPanelHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;

      await popoutPage.waitForLoadState('networkidle');

      // Verify pop-out URL is the panel route
      await expect(popoutPage).toHaveURL(/\/panel\/discover\//);

      await screenshotWithUrl(popoutPage, 'filter-panel-popout-standalone.png', true);
    });

    test('P4.1.4 - Pop-out URL contains popout parameter', async ({ context }) => {
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

      // Verify URL structure - pop-outs use /panel/ route
      const url = popoutPage.url();
      expect(url).toContain('/panel/');
    });

    test('P4.1.5 - Pop-out hides site banner/header', async ({ context }) => {
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

      // Verify no site header/navigation is visible in pop-out
      // The main header/nav should be hidden in pop-out mode
      const mainNav = popoutPage.locator('nav.main-nav, header.site-header, .app-header');
      const navCount = await mainNav.count();

      // Pop-out should either have no header or it should be hidden
      if (navCount > 0) {
        await expect(mainNav.first()).not.toBeVisible();
      }

      await screenshotWithUrl(popoutPage, 'popout-no-header.png', true);
    });

    test('P4.1.6 - Main window shows placeholder for popped-out component', async ({ context }) => {
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
      await mainPage.waitForTimeout(500);

      // Main window should show a placeholder or indicator that the component is popped out
      await screenshotWithUrl(mainPage, 'results-table-popout-with-main.png', true);
    });
  });

  test.describe('4.2 Pop-Out Synchronization', () => {
    test('P4.2.1 - Change filter in main window updates pop-out', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Pop out statistics
      const statisticsHeader = mainPage.getByRole('heading', { name: 'Statistics', level: 3 });
      const panelHeader = statisticsHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('networkidle');

      // Apply filter in main window via UI interaction (not navigation)
      const manufacturerInput = mainPage.getByPlaceholder('Enter manufacturer name');
      await manufacturerInput.click();
      await manufacturerInput.fill('Ford');
      await mainPage.waitForTimeout(300);
      await mainPage.getByRole('option', { name: 'Ford' }).first().click();
      await mainPage.waitForTimeout(1000);

      // Pop-out should update to show Ford data via BroadcastChannel
      await screenshotWithUrl(popoutPage, 'popout-sync-filter-ford.png', true);
    });

    test('P4.2.2 - Change filter in pop-out updates main window URL', async ({ context }) => {
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
      await manufacturerInput.fill('Chevrolet');
      await popoutPage.waitForTimeout(300);
      await popoutPage.getByRole('option', { name: 'Chevrolet' }).first().click();
      await popoutPage.waitForTimeout(500);

      // Main window URL should update
      await mainPage.waitForTimeout(500);
      await expect(mainPage).toHaveURL(/manufacturer=Chevrolet/);

      await screenshotWithUrl(mainPage, 'main-sync-from-popout.png', true);
    });

    test('P4.2.3 - Change sort in main window updates pop-out', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Pop out statistics (not results table, because we need to click on results table to sort)
      const statisticsHeader = mainPage.getByRole('heading', { name: 'Statistics', level: 3 });
      const panelHeader = statisticsHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('networkidle');

      // Apply sort in main window via UI - click Year column header
      await mainPage.locator('th').filter({ hasText: 'Year' }).click();
      await mainPage.waitForTimeout(1000);

      // Pop-out statistics should show sorted data via BroadcastChannel
      await screenshotWithUrl(popoutPage, 'popout-sync-sort.png', true);
    });

    test('P4.2.4 - Apply highlight via Query Control updates pop-out', async ({ context }) => {
      // For highlights, we need Query Control which has the highlight dropdown
      // This test verifies the BroadcastChannel communication works
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
      await mainPage.waitForLoadState('networkidle');
      await mainPage.getByRole('heading', { name: 'Statistics' }).waitFor({ state: 'visible', timeout: 10000 });

      // Pop out statistics - it should already have the highlight applied
      const statisticsHeader = mainPage.getByRole('heading', { name: 'Statistics', level: 3 });
      const panelHeader = statisticsHeader.locator('..').locator('..');
      const popoutButton = panelHeader.locator('button:has(.pi-external-link)');

      const popoutPromise = context.waitForEvent('page');
      await popoutButton.click();
      const popoutPage = await popoutPromise;
      await popoutPage.waitForLoadState('networkidle');
      await popoutPage.waitForTimeout(500);

      // Pop-out should show highlighted data (Tesla highlighted)
      await screenshotWithUrl(popoutPage, 'popout-sync-highlight.png', true);
    });

    test('P4.2.5 - Navigate page in main window updates pop-out', async ({ context }) => {
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

      // Navigate to page 3 via UI click in main window
      await mainPage.getByRole('button', { name: '3' }).click();
      await mainPage.waitForTimeout(1000);

      // Pop-out should show page 3 via BroadcastChannel
      await screenshotWithUrl(popoutPage, 'popout-sync-pagination.png', true);
    });

    test('P4.2.6 - Clear filters in main window updates pop-out', async ({ context }) => {
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

      // Clear filters via UI in main window
      await mainPage.getByRole('button', { name: /Clear All/i }).click();
      await mainPage.waitForTimeout(1000);

      // Pop-out should show unfiltered data via BroadcastChannel
      await screenshotWithUrl(popoutPage, 'popout-sync-cleared.png', true);
    });
  });

  test.describe('4.3 Pop-Out API Behavior', () => {
    test('P4.3.1 - Pop-out does NOT update its own URL after load', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover?manufacturer=Ford`);
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

      const initialUrl = popoutPage.url();

      // Change filter in main window via UI
      const manufacturerInput = mainPage.getByPlaceholder('Enter manufacturer name');
      await manufacturerInput.click();
      await manufacturerInput.fill('Chevrolet');
      await mainPage.waitForTimeout(300);
      await mainPage.getByRole('option', { name: 'Chevrolet' }).first().click();
      await mainPage.waitForTimeout(1000);

      // Pop-out URL should remain unchanged (state sync via BroadcastChannel, not URL)
      const finalUrl = popoutPage.url();
      expect(finalUrl).toBe(initialUrl);
    });

    test('P4.3.2 - Pop-out receives data via BroadcastChannel', async ({ context }) => {
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

      // Apply a filter in main window via UI
      const manufacturerInput = mainPage.getByPlaceholder('Enter manufacturer name');
      await manufacturerInput.click();
      await manufacturerInput.fill('Tesla');
      await mainPage.waitForTimeout(300);
      await mainPage.getByRole('option', { name: 'Tesla' }).first().click();
      await mainPage.waitForTimeout(1000);

      // Pop-out should have updated (showing Tesla data means BroadcastChannel worked)
      await screenshotWithUrl(popoutPage, 'popout-broadcast-tesla.png', true);
    });

    test('P4.3.3 - Main window API refresh updates pop-outs', async ({ context }) => {
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

      // Apply year filter via UI to trigger API refresh in main window
      const yearMinInput = mainPage.locator('input[placeholder="Min"]').first();
      await yearMinInput.click();
      await yearMinInput.fill('2020');
      await mainPage.keyboard.press('Enter');
      await mainPage.waitForTimeout(1000);

      // Pop-out should show the updated data
      await screenshotWithUrl(popoutPage, 'popout-api-refresh.png', true);
    });
  });

  test.describe('4.4 Multiple Pop-Out Tests', () => {
    test('P4.4.1 - Multiple pop-outs of different types', async ({ context }) => {
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

      // Both pop-outs should be open
      expect(context.pages().length).toBeGreaterThanOrEqual(3);

      // Apply filter in main window via UI
      const manufacturerInput = mainPage.getByPlaceholder('Enter manufacturer name');
      await manufacturerInput.click();
      await manufacturerInput.fill('Chevrolet');
      await mainPage.waitForTimeout(300);
      await mainPage.getByRole('option', { name: 'Chevrolet' }).first().click();
      await mainPage.waitForTimeout(1000);

      // Both pop-outs should update via BroadcastChannel
      await screenshotWithUrl(popoutResults, 'multi-popout-results.png', true);
      await screenshotWithUrl(popoutStats, 'multi-popout-stats.png', true);
    });

    test('P4.4.2 - Close pop-out, main window continues normally', async ({ context }) => {
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

      // Close the pop-out
      await popoutPage.close();

      // Main window should continue to function
      await mainPage.goto(`${BASE_URL}/discover?manufacturer=Ford`);
      await mainPage.waitForLoadState('networkidle');

      await expect(mainPage).toHaveURL(/manufacturer=Ford/);
      await screenshotWithUrl(mainPage, 'main-after-popout-close.png', true);
    });
  });

  test.describe('4.5 Pop-Out with URL Parameters', () => {
    test('P4.5.1 - Pop-out with manufacturer filter', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover?manufacturer=Ford`);
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

      // Pop-out should show Ford vehicles
      await screenshotWithUrl(popoutPage, 'popout-filtered-ford.png', true);
    });

    test('P4.5.2 - Pop-out with highlight', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
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

      // Pop-out should show Tesla highlights
      await screenshotWithUrl(popoutPage, 'popout-highlight-tesla.png', true);
    });

    test('P4.5.3 - Pop-out with sort', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover?sortBy=year&sortOrder=desc`);
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

      // Pop-out should show sorted data
      await screenshotWithUrl(popoutPage, 'popout-sorted.png', true);
    });

    test('P4.5.4 - Pop-out with pagination', async ({ context }) => {
      const mainPage = await context.newPage();
      await mainPage.goto(`${BASE_URL}/discover?page=3&size=10`);
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

      // Pop-out should show page 3
      await screenshotWithUrl(popoutPage, 'popout-paginated.png', true);
    });
  });
});
