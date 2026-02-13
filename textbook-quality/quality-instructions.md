# QUALITY INSTRUCTIONS

## Purpose

This document provides comprehensive quality verification procedures for the vvroom application. The goal is to verify that all components function correctly and adhere to the URL-First State Management paradigm.

---

## Test Environment

| Environment | Port | Purpose |
|-------------|------|---------|
| Development | 4207 | Manual testing and debugging |
| Playwright  | 4228 | Automated E2E testing |

### Prerequisites

```bash
# Start development server (port 4207)
ng serve --port 4207

# Start test server (port 4228) - separate terminal
ng serve --configuration=production --port 4228
```

---

## Test Categories Overview

| Category | Tests | Scope |
|----------|-------|-------|
| 1. Main Window Control Changes | M1.1-M1.8 | URL updates from main window interactions |
| 2. Pop-Out Window Control Changes | P2.1-P2.6 | Cross-window communication |
| 3. URL Paste Tests (No Highlights) | U3.1-U3.7 | URL restoration without highlights |
| 4. URL Paste Tests (With Highlights) | H4.1-H4.6 | URL restoration with highlight filters |
| 5. Pop-Out Window Presentation | W5.1-W5.5 | Visual correctness of pop-outs |
| 6. Cross-Window Synchronization | S6.1-S6.6 | Bidirectional state sync |
| 7. Router Navigate Encapsulation | R7.1-R7.3 | Code-level compliance |
| 8. Visual Verification | V8.1-V8.20 | Screenshot-based visual testing |
| 9. Component Data Accuracy | D9.1-D9.15 | Data correctness validation |
| 10. Error Handling | E10.1-E10.8 | Error states and recovery |

---

## Category 1: Main Window (Popped-In) Control Changes

Test that changes in the main window controls are reflected in:
- The browser URL parameters
- All other controls in the main window
- Any open pop-out windows

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| M1.1 | Change a query control filter (e.g., manufacturer dropdown) | URL updates with filter param; results table updates; statistics update |
| M1.2 | Change a highlight filter (e.g., year range) | URL updates with `h_` prefixed param; highlighted rows change; pop-outs receive update |
| M1.3 | Change pagination (page number) | URL updates with `page` param; table shows correct page |
| M1.4 | Change page size | URL updates with `size` param; table row count matches |
| M1.5 | Change sort column | URL updates with `sort` param; table re-sorts |
| M1.6 | Change sort direction | URL updates with `sortDirection` param; table order reverses |
| M1.7 | Clear all filters | URL params removed; controls reset to defaults; full dataset shown |
| M1.8 | Apply multiple filters simultaneously | All filter params appear in URL; results reflect intersection |

### Playwright Tests

```typescript
// e2e/tests/category-1-main-window.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 1: Main Window Control Changes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
  });

  test('M1.1 - Query control filter updates URL and results', async ({ page }) => {
    // Select manufacturer from dropdown
    await page.locator('[data-testid="filter-manufacturer"]').click();
    await page.locator('[data-testid="option-Ford"]').click();

    // Verify URL contains filter
    await expect(page).toHaveURL(/manufacturer=Ford/);

    // Verify results table shows only Ford vehicles
    const rows = page.locator('[data-testid="results-row"]');
    for (const row of await rows.all()) {
      await expect(row.locator('[data-testid="col-manufacturer"]')).toHaveText('Ford');
    }

    // Verify statistics panel updated
    await expect(page.locator('[data-testid="stat-manufacturer"]')).toContainText('Ford');
  });

  test('M1.2 - Highlight filter updates URL with h_ prefix', async ({ page }) => {
    // Set highlight year range
    await page.locator('[data-testid="highlight-yearMin"]').fill('2020');
    await page.locator('[data-testid="highlight-yearMax"]').fill('2024');
    await page.locator('[data-testid="highlight-yearMin"]').blur();

    // Verify URL contains h_ prefixed params
    await expect(page).toHaveURL(/h_yearMin=2020/);
    await expect(page).toHaveURL(/h_yearMax=2024/);

    // Verify highlighted rows exist
    const highlightedRows = page.locator('[data-testid="results-row"].highlighted');
    await expect(highlightedRows).toHaveCount({ min: 1 });
  });

  test('M1.3 - Pagination page number updates URL', async ({ page }) => {
    // Click page 2
    await page.locator('[data-testid="pagination-page-2"]').click();

    // Verify URL
    await expect(page).toHaveURL(/page=2/);

    // Verify table data changed (different first row)
    const firstRow = page.locator('[data-testid="results-row"]').first();
    // Store and compare content after page change
  });

  test('M1.4 - Page size updates URL and row count', async ({ page }) => {
    // Change page size to 50
    await page.locator('[data-testid="page-size-select"]').selectOption('50');

    // Verify URL
    await expect(page).toHaveURL(/size=50/);

    // Verify row count
    const rows = page.locator('[data-testid="results-row"]');
    await expect(rows).toHaveCount(50);
  });

  test('M1.5 - Sort column updates URL', async ({ page }) => {
    // Click year column header to sort
    await page.locator('[data-testid="col-header-year"]').click();

    // Verify URL
    await expect(page).toHaveURL(/sort=year/);
  });

  test('M1.6 - Sort direction toggles and updates URL', async ({ page }) => {
    // Click year column header twice
    await page.locator('[data-testid="col-header-year"]').click();
    await expect(page).toHaveURL(/sortDirection=asc/);

    await page.locator('[data-testid="col-header-year"]').click();
    await expect(page).toHaveURL(/sortDirection=desc/);

    // Verify data is sorted descending
    const years = await page.locator('[data-testid="col-year"]').allTextContents();
    const sortedYears = [...years].sort((a, b) => parseInt(b) - parseInt(a));
    expect(years).toEqual(sortedYears);
  });

  test('M1.7 - Clear all filters resets URL and data', async ({ page }) => {
    // Apply some filters first
    await page.locator('[data-testid="filter-manufacturer"]').click();
    await page.locator('[data-testid="option-Ford"]').click();
    await page.waitForURL(/manufacturer=Ford/);

    // Clear all filters
    await page.locator('[data-testid="clear-all-filters"]').click();

    // Verify URL is clean (no filter params)
    await expect(page).not.toHaveURL(/manufacturer=/);

    // Verify filter control is reset
    await expect(page.locator('[data-testid="filter-manufacturer"]')).toHaveValue('');
  });

  test('M1.8 - Multiple filters apply intersection', async ({ page }) => {
    // Apply manufacturer filter
    await page.locator('[data-testid="filter-manufacturer"]').click();
    await page.locator('[data-testid="option-Ford"]').click();

    // Apply year filter
    await page.locator('[data-testid="filter-yearMin"]').fill('2020');
    await page.locator('[data-testid="filter-yearMin"]').blur();

    // Verify URL contains both
    await expect(page).toHaveURL(/manufacturer=Ford/);
    await expect(page).toHaveURL(/yearMin=2020/);

    // Verify results match BOTH filters
    const rows = page.locator('[data-testid="results-row"]');
    for (const row of await rows.all()) {
      await expect(row.locator('[data-testid="col-manufacturer"]')).toHaveText('Ford');
      const year = parseInt(await row.locator('[data-testid="col-year"]').textContent() || '0');
      expect(year).toBeGreaterThanOrEqual(2020);
    }
  });
});
```

---

## Category 2: Pop-Out Window Control Changes

Test that changes in pop-out windows are communicated to the main window.

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| P2.1 | Change highlight filter in pop-out | Main window URL updates with `h_` param; main window highlights update |
| P2.2 | Pop-out sends filter change message | BroadcastChannel message received by main window |
| P2.3 | Pop-out does NOT update its own URL | Pop-out URL remains static (initial state only) |
| P2.4 | Pop-out does NOT make its own API calls | Network tab shows no API requests from pop-out after initial load |
| P2.5 | Pop-out receives state via BroadcastChannel | `syncStateFromExternal()` called; no API fetch triggered |
| P2.6 | Multiple pop-outs stay synchronized | Change in one pop-out reflects in main window and all other pop-outs |

### Playwright Tests

```typescript
// e2e/tests/category-2-popout-changes.spec.ts

import { test, expect, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 2: Pop-Out Window Control Changes', () => {
  let context: BrowserContext;
  let mainPage: Page;
  let popoutPage: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    mainPage = await context.newPage();
    await mainPage.goto(`${BASE_URL}/discover`);
    await mainPage.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await context.close();
  });

  async function openPopout(panelId: string): Promise<Page> {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      mainPage.locator(`[data-testid="popout-${panelId}"]`).click()
    ]);
    await newPage.waitForLoadState('networkidle');
    return newPage;
  }

  test('P2.1 - Highlight filter in pop-out updates main window URL', async () => {
    popoutPage = await openPopout('query-control');

    // Change highlight in pop-out
    await popoutPage.locator('[data-testid="highlight-manufacturer"]').click();
    await popoutPage.locator('[data-testid="option-Tesla"]').click();

    // Verify main window URL updated
    await expect(mainPage).toHaveURL(/h_manufacturer=Tesla/);
  });

  test('P2.3 - Pop-out URL remains static after filter changes', async () => {
    popoutPage = await openPopout('query-control');
    const initialUrl = popoutPage.url();

    // Change filter in pop-out
    await popoutPage.locator('[data-testid="highlight-yearMin"]').fill('2020');
    await popoutPage.locator('[data-testid="highlight-yearMin"]').blur();

    // Wait for communication to complete
    await mainPage.waitForURL(/h_yearMin=2020/);

    // Pop-out URL should NOT have changed
    expect(popoutPage.url()).toBe(initialUrl);
  });

  test('P2.4 - Pop-out does NOT make API calls after initial load', async () => {
    popoutPage = await openPopout('query-control');

    // Monitor network requests in pop-out
    const apiCalls: string[] = [];
    popoutPage.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url());
      }
    });

    // Clear existing calls
    apiCalls.length = 0;

    // Change filter in main window
    await mainPage.locator('[data-testid="filter-manufacturer"]').click();
    await mainPage.locator('[data-testid="option-Ford"]').click();

    // Wait for UI to update
    await mainPage.waitForTimeout(1000);

    // Pop-out should NOT have made API calls
    expect(apiCalls).toHaveLength(0);
  });

  test('P2.5 - Pop-out receives state via BroadcastChannel', async () => {
    popoutPage = await openPopout('statistics');

    // Apply filter in main window
    await mainPage.locator('[data-testid="filter-manufacturer"]').click();
    await mainPage.locator('[data-testid="option-Ford"]').click();

    // Wait for main window results
    await mainPage.waitForLoadState('networkidle');

    // Verify pop-out statistics match main window
    const mainStats = await mainPage.locator('[data-testid="stat-count"]').textContent();
    const popoutStats = await popoutPage.locator('[data-testid="stat-count"]').textContent();

    expect(popoutStats).toBe(mainStats);
  });

  test('P2.6 - Multiple pop-outs stay synchronized', async () => {
    const popout1 = await openPopout('query-control');
    const popout2 = await openPopout('statistics');

    // Change filter in first pop-out
    await popout1.locator('[data-testid="highlight-manufacturer"]').click();
    await popout1.locator('[data-testid="option-Tesla"]').click();

    // Wait for sync
    await mainPage.waitForURL(/h_manufacturer=Tesla/);

    // Verify second pop-out reflects the change
    await expect(popout2.locator('[data-testid="highlighted-manufacturer"]')).toContainText('Tesla');
  });
});
```

---

## Category 3: URL Paste Tests (Without Highlight Filters)

Test that pasting a URL with standard filters correctly restores application state.

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| U3.1 | Paste URL with single filter param | Filter control shows correct value; results match filter |
| U3.2 | Paste URL with multiple filter params | All filter controls populated; results show intersection |
| U3.3 | Paste URL with pagination params | Correct page displayed; pagination control shows correct page |
| U3.4 | Paste URL with sort params | Table sorted correctly; sort indicators match URL |
| U3.5 | Paste URL with all param types combined | All controls reflect URL state; results correct |
| U3.6 | Paste URL with invalid filter value | Graceful handling; invalid param ignored or defaulted |
| U3.7 | Share URL to another browser/session | New session shows identical state to original |

### Playwright Tests

```typescript
// e2e/tests/category-3-url-paste.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 3: URL Paste Tests (No Highlights)', () => {

  test('U3.1 - Single filter param restores state', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
    await page.waitForLoadState('networkidle');

    // Verify filter control shows Ford
    await expect(page.locator('[data-testid="filter-manufacturer"]')).toHaveValue('Ford');

    // Verify results only show Ford
    const rows = page.locator('[data-testid="results-row"]');
    for (const row of await rows.all()) {
      await expect(row.locator('[data-testid="col-manufacturer"]')).toHaveText('Ford');
    }
  });

  test('U3.2 - Multiple filter params restore state', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford&yearMin=2020&bodyClass=SUV`);
    await page.waitForLoadState('networkidle');

    // Verify all filter controls populated
    await expect(page.locator('[data-testid="filter-manufacturer"]')).toHaveValue('Ford');
    await expect(page.locator('[data-testid="filter-yearMin"]')).toHaveValue('2020');
    await expect(page.locator('[data-testid="filter-bodyClass"]')).toHaveValue('SUV');

    // Verify results match intersection
    const rows = page.locator('[data-testid="results-row"]');
    for (const row of await rows.all()) {
      await expect(row.locator('[data-testid="col-manufacturer"]')).toHaveText('Ford');
      await expect(row.locator('[data-testid="col-bodyClass"]')).toHaveText('SUV');
      const year = parseInt(await row.locator('[data-testid="col-year"]').textContent() || '0');
      expect(year).toBeGreaterThanOrEqual(2020);
    }
  });

  test('U3.3 - Pagination params restore state', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?page=3&size=25`);
    await page.waitForLoadState('networkidle');

    // Verify pagination control shows page 3
    await expect(page.locator('[data-testid="pagination-current"]')).toHaveText('3');

    // Verify page size shows 25
    await expect(page.locator('[data-testid="page-size-select"]')).toHaveValue('25');

    // Verify 25 rows displayed
    const rows = page.locator('[data-testid="results-row"]');
    await expect(rows).toHaveCount(25);
  });

  test('U3.4 - Sort params restore state', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?sort=year&sortDirection=desc`);
    await page.waitForLoadState('networkidle');

    // Verify sort indicator on year column
    await expect(page.locator('[data-testid="col-header-year"] .sort-indicator')).toHaveClass(/desc/);

    // Verify data is sorted descending
    const years = await page.locator('[data-testid="col-year"]').allTextContents();
    const yearNums = years.map(y => parseInt(y));
    for (let i = 1; i < yearNums.length; i++) {
      expect(yearNums[i]).toBeLessThanOrEqual(yearNums[i-1]);
    }
  });

  test('U3.5 - All param types combined restore state', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=Tesla&yearMin=2020&page=2&size=10&sort=model&sortDirection=asc`);
    await page.waitForLoadState('networkidle');

    // Verify all controls
    await expect(page.locator('[data-testid="filter-manufacturer"]')).toHaveValue('Tesla');
    await expect(page.locator('[data-testid="filter-yearMin"]')).toHaveValue('2020');
    await expect(page.locator('[data-testid="pagination-current"]')).toHaveText('2');
    await expect(page.locator('[data-testid="page-size-select"]')).toHaveValue('10');
    await expect(page.locator('[data-testid="col-header-model"] .sort-indicator')).toHaveClass(/asc/);
  });

  test('U3.6 - Invalid filter value handled gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=InvalidManufacturer&yearMin=abc`);
    await page.waitForLoadState('networkidle');

    // Application should not crash
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible();

    // Invalid values should be ignored or defaulted
    // (exact behavior depends on implementation)
  });

  test('U3.7 - URL shareable across sessions', async ({ browser }) => {
    // Session 1: Create state
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto(`${BASE_URL}/discover`);
    await page1.waitForLoadState('networkidle');

    await page1.locator('[data-testid="filter-manufacturer"]').click();
    await page1.locator('[data-testid="option-Ford"]').click();
    await page1.waitForURL(/manufacturer=Ford/);

    const url = page1.url();
    const resultsText1 = await page1.locator('[data-testid="stat-count"]').textContent();

    // Session 2: Navigate to same URL
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(url);
    await page2.waitForLoadState('networkidle');

    // Verify identical state
    const resultsText2 = await page2.locator('[data-testid="stat-count"]').textContent();
    expect(resultsText2).toBe(resultsText1);

    await context1.close();
    await context2.close();
  });
});
```

---

## Category 4: URL Paste Tests (With Highlight Filters)

Test that pasting a URL with highlight filters (`h_` prefix) correctly applies highlighting.

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| H4.1 | Paste URL with `h_yearMin` param | Year highlight filter populated; matching rows highlighted |
| H4.2 | Paste URL with `h_manufacturer` param | Manufacturer highlight populated; matching rows highlighted |
| H4.3 | Paste URL with multiple highlight params | All highlight filters populated; rows matching ALL highlighted |
| H4.4 | Paste URL mixing query and highlight params | Query filters filter data; highlight filters highlight within results |
| H4.5 | Paste URL with highlight param into pop-out | Pop-out shows initial highlights; syncs with main window |
| H4.6 | Clear highlight via URL (remove `h_` param) | Highlights removed; highlight controls cleared |

### Playwright Tests

```typescript
// e2e/tests/category-4-url-highlights.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 4: URL Paste Tests (With Highlights)', () => {

  test('H4.1 - Year highlight param applies highlighting', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?h_yearMin=2022&h_yearMax=2024`);
    await page.waitForLoadState('networkidle');

    // Verify highlight controls populated
    await expect(page.locator('[data-testid="highlight-yearMin"]')).toHaveValue('2022');
    await expect(page.locator('[data-testid="highlight-yearMax"]')).toHaveValue('2024');

    // Verify highlighted rows have correct years
    const highlightedRows = page.locator('[data-testid="results-row"].highlighted');
    for (const row of await highlightedRows.all()) {
      const year = parseInt(await row.locator('[data-testid="col-year"]').textContent() || '0');
      expect(year).toBeGreaterThanOrEqual(2022);
      expect(year).toBeLessThanOrEqual(2024);
    }

    // Verify non-highlighted rows have years outside range
    const nonHighlightedRows = page.locator('[data-testid="results-row"]:not(.highlighted)');
    for (const row of await nonHighlightedRows.all()) {
      const year = parseInt(await row.locator('[data-testid="col-year"]').textContent() || '0');
      expect(year < 2022 || year > 2024).toBe(true);
    }
  });

  test('H4.2 - Manufacturer highlight param applies highlighting', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
    await page.waitForLoadState('networkidle');

    // Verify highlight control populated
    await expect(page.locator('[data-testid="highlight-manufacturer"]')).toHaveValue('Tesla');

    // Verify only Tesla rows are highlighted
    const highlightedRows = page.locator('[data-testid="results-row"].highlighted');
    for (const row of await highlightedRows.all()) {
      await expect(row.locator('[data-testid="col-manufacturer"]')).toHaveText('Tesla');
    }
  });

  test('H4.3 - Multiple highlight params apply AND logic', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla&h_yearMin=2022`);
    await page.waitForLoadState('networkidle');

    // Verify highlighted rows match BOTH criteria
    const highlightedRows = page.locator('[data-testid="results-row"].highlighted');
    for (const row of await highlightedRows.all()) {
      await expect(row.locator('[data-testid="col-manufacturer"]')).toHaveText('Tesla');
      const year = parseInt(await row.locator('[data-testid="col-year"]').textContent() || '0');
      expect(year).toBeGreaterThanOrEqual(2022);
    }
  });

  test('H4.4 - Query and highlight params work together', async ({ page }) => {
    // Filter to Ford, highlight 2022+
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford&h_yearMin=2022`);
    await page.waitForLoadState('networkidle');

    // All rows should be Ford (query filter)
    const allRows = page.locator('[data-testid="results-row"]');
    for (const row of await allRows.all()) {
      await expect(row.locator('[data-testid="col-manufacturer"]')).toHaveText('Ford');
    }

    // Only 2022+ Ford rows should be highlighted
    const highlightedRows = page.locator('[data-testid="results-row"].highlighted');
    for (const row of await highlightedRows.all()) {
      const year = parseInt(await row.locator('[data-testid="col-year"]').textContent() || '0');
      expect(year).toBeGreaterThanOrEqual(2022);
    }
  });

  test('H4.6 - Removing highlight param clears highlights', async ({ page }) => {
    // Start with highlight
    await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
    await page.waitForLoadState('networkidle');

    // Verify highlights exist
    await expect(page.locator('[data-testid="results-row"].highlighted')).toHaveCount({ min: 1 });

    // Navigate without highlight param
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');

    // Verify no highlights
    await expect(page.locator('[data-testid="results-row"].highlighted')).toHaveCount(0);

    // Verify highlight control cleared
    await expect(page.locator('[data-testid="highlight-manufacturer"]')).toHaveValue('');
  });
});
```

---

## Category 5: Pop-Out Window Presentation

Test that pop-out windows display correctly without main window chrome.

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| W5.1 | Pop-out hides site banner/header | No navigation header visible in pop-out |
| W5.2 | Pop-out shows query control panel | Filter controls visible and functional |
| W5.3 | Pop-out URL contains `popout=true` param | URL includes pop-out indicator |
| W5.4 | Pop-out title reflects content | Window title indicates popped-out component |
| W5.5 | Pop-out respects `autoFetch = false` | No initial API call; waits for main window data |

### Playwright Tests

```typescript
// e2e/tests/category-5-popout-presentation.spec.ts

import { test, expect, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 5: Pop-Out Window Presentation', () => {
  let context: BrowserContext;
  let mainPage: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    mainPage = await context.newPage();
    await mainPage.goto(`${BASE_URL}/discover`);
    await mainPage.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await context.close();
  });

  async function openPopout(panelId: string): Promise<Page> {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      mainPage.locator(`[data-testid="popout-${panelId}"]`).click()
    ]);
    await newPage.waitForLoadState('networkidle');
    return newPage;
  }

  test('W5.1 - Pop-out hides site banner/header', async () => {
    const popout = await openPopout('query-control');

    // Main window should have header
    await expect(mainPage.locator('[data-testid="site-header"]')).toBeVisible();

    // Pop-out should NOT have header
    await expect(popout.locator('[data-testid="site-header"]')).not.toBeVisible();
  });

  test('W5.2 - Pop-out shows query control panel', async () => {
    const popout = await openPopout('query-control');

    // Query control should be visible in pop-out
    await expect(popout.locator('[data-testid="query-control"]')).toBeVisible();

    // Filter inputs should be functional
    await expect(popout.locator('[data-testid="filter-manufacturer"]')).toBeEnabled();
  });

  test('W5.3 - Pop-out URL contains popout=true param', async () => {
    const popout = await openPopout('query-control');

    await expect(popout).toHaveURL(/popout=true/);
  });

  test('W5.4 - Pop-out title reflects content', async () => {
    const popout = await openPopout('query-control');

    // Title should indicate the panel type
    const title = await popout.title();
    expect(title.toLowerCase()).toContain('query');
  });

  test('W5.5 - Pop-out does not make initial API call', async () => {
    const apiCalls: string[] = [];

    // Set up request interception before opening pop-out
    const newPagePromise = context.waitForEvent('page');
    await mainPage.locator('[data-testid="popout-statistics"]').click();
    const popout = await newPagePromise;

    popout.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url());
      }
    });

    await popout.waitForLoadState('networkidle');

    // Should have 0 API calls (receives data via BroadcastChannel)
    expect(apiCalls).toHaveLength(0);
  });
});
```

---

## Category 6: Cross-Window Synchronization

Test bidirectional communication between main window and pop-outs.

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| S6.1 | Main window filter change updates all pop-outs | All pop-outs receive BroadcastChannel message and update |
| S6.2 | Pop-out filter change updates main window URL | Main window URL reflects pop-out's requested change |
| S6.3 | Main window data refresh updates pop-outs | New API data propagated to all pop-outs |
| S6.4 | Close pop-out does not affect main window state | Main window continues functioning normally |
| S6.5 | Open multiple pop-outs of same type | Each pop-out shows consistent state |
| S6.6 | Open pop-outs of different types | Each receives relevant state updates |

### Playwright Tests

```typescript
// e2e/tests/category-6-cross-window-sync.spec.ts

import { test, expect, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 6: Cross-Window Synchronization', () => {
  let context: BrowserContext;
  let mainPage: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    mainPage = await context.newPage();
    await mainPage.goto(`${BASE_URL}/discover`);
    await mainPage.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await context.close();
  });

  async function openPopout(panelId: string): Promise<Page> {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      mainPage.locator(`[data-testid="popout-${panelId}"]`).click()
    ]);
    await newPage.waitForLoadState('networkidle');
    return newPage;
  }

  test('S6.1 - Main window filter updates all pop-outs', async () => {
    const popout1 = await openPopout('statistics');
    const popout2 = await openPopout('query-control');

    // Get initial stats
    const initialStats = await popout1.locator('[data-testid="stat-count"]').textContent();

    // Apply filter in main window
    await mainPage.locator('[data-testid="filter-manufacturer"]').click();
    await mainPage.locator('[data-testid="option-Ford"]').click();
    await mainPage.waitForLoadState('networkidle');

    // Wait for sync
    await mainPage.waitForTimeout(500);

    // Verify both pop-outs updated
    const newStats = await popout1.locator('[data-testid="stat-count"]').textContent();
    expect(newStats).not.toBe(initialStats);

    await expect(popout2.locator('[data-testid="filter-manufacturer"]')).toHaveValue('Ford');
  });

  test('S6.2 - Pop-out filter change updates main window URL', async () => {
    const popout = await openPopout('query-control');

    // Change filter in pop-out
    await popout.locator('[data-testid="highlight-yearMin"]').fill('2020');
    await popout.locator('[data-testid="highlight-yearMin"]').blur();

    // Main window URL should update
    await expect(mainPage).toHaveURL(/h_yearMin=2020/);
  });

  test('S6.3 - Main window data refresh updates pop-outs', async () => {
    const popout = await openPopout('statistics');

    // Get initial count
    const initialCount = await popout.locator('[data-testid="stat-count"]').textContent();

    // Change page in main window (triggers new data fetch)
    await mainPage.locator('[data-testid="filter-manufacturer"]').click();
    await mainPage.locator('[data-testid="option-Tesla"]').click();
    await mainPage.waitForLoadState('networkidle');

    // Pop-out should show new count
    const newCount = await popout.locator('[data-testid="stat-count"]').textContent();
    expect(newCount).not.toBe(initialCount);
  });

  test('S6.4 - Close pop-out does not affect main window', async () => {
    const popout = await openPopout('query-control');

    // Apply filter via pop-out
    await popout.locator('[data-testid="highlight-manufacturer"]').click();
    await popout.locator('[data-testid="option-Tesla"]').click();
    await mainPage.waitForURL(/h_manufacturer=Tesla/);

    // Close pop-out
    await popout.close();

    // Main window should still work
    await mainPage.locator('[data-testid="filter-yearMin"]').fill('2020');
    await mainPage.locator('[data-testid="filter-yearMin"]').blur();

    // URL should still update
    await expect(mainPage).toHaveURL(/yearMin=2020/);
    await expect(mainPage).toHaveURL(/h_manufacturer=Tesla/);
  });

  test('S6.5 - Multiple pop-outs of same type show consistent state', async () => {
    // Note: This tests the scenario where user opens same panel twice
    const popout1 = await openPopout('statistics');
    const popout2 = await openPopout('statistics');

    // Both should show same count
    const count1 = await popout1.locator('[data-testid="stat-count"]').textContent();
    const count2 = await popout2.locator('[data-testid="stat-count"]').textContent();

    expect(count1).toBe(count2);

    // Apply filter in main window
    await mainPage.locator('[data-testid="filter-manufacturer"]').click();
    await mainPage.locator('[data-testid="option-Ford"]').click();
    await mainPage.waitForLoadState('networkidle');
    await mainPage.waitForTimeout(500);

    // Both should update to same new count
    const newCount1 = await popout1.locator('[data-testid="stat-count"]').textContent();
    const newCount2 = await popout2.locator('[data-testid="stat-count"]').textContent();

    expect(newCount1).toBe(newCount2);
  });

  test('S6.6 - Different pop-out types receive relevant updates', async () => {
    const statsPopout = await openPopout('statistics');
    const queryPopout = await openPopout('query-control');

    // Apply filter in main window
    await mainPage.locator('[data-testid="filter-manufacturer"]').click();
    await mainPage.locator('[data-testid="option-Ford"]').click();
    await mainPage.waitForLoadState('networkidle');

    // Statistics pop-out should show filtered count
    await expect(statsPopout.locator('[data-testid="stat-manufacturer"]')).toContainText('Ford');

    // Query pop-out should show filter value
    await expect(queryPopout.locator('[data-testid="filter-manufacturer"]')).toHaveValue('Ford');
  });
});
```

---

## Category 7: Router Navigate Encapsulation

Verify that `router.navigate()` is only called from `UrlStateService`.

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| R7.1 | Grep codebase for `router.navigate` | Only appears in `url-state.service.ts` |
| R7.2 | Components call `updateFilters()` method | Components never call `router.navigate()` directly |
| R7.3 | Pop-out components call parent messaging | No `router.navigate()` in pop-out components |

### Static Analysis Tests

```bash
#!/bin/bash
# e2e/scripts/verify-router-encapsulation.sh

echo "=== Category 7: Router Navigate Encapsulation ==="

# R7.1 - Check router.navigate usage
echo ""
echo "R7.1 - Checking router.navigate() usage..."
echo "Files containing router.navigate():"
grep -r "router\.navigate" --include="*.ts" src/ | grep -v "node_modules" | grep -v ".spec.ts"

# Count occurrences outside url-state.service.ts
VIOLATIONS=$(grep -r "router\.navigate" --include="*.ts" src/ | grep -v "node_modules" | grep -v ".spec.ts" | grep -v "url-state.service.ts" | wc -l)

if [ "$VIOLATIONS" -eq 0 ]; then
  echo "✅ PASS: router.navigate() only in url-state.service.ts"
else
  echo "❌ FAIL: Found $VIOLATIONS violations"
  grep -r "router\.navigate" --include="*.ts" src/ | grep -v "node_modules" | grep -v ".spec.ts" | grep -v "url-state.service.ts"
fi

# R7.2 - Check component patterns
echo ""
echo "R7.2 - Checking component filter update patterns..."
COMPONENT_VIOLATIONS=$(grep -r "router\.navigate" --include="*.component.ts" src/ | grep -v "node_modules" | wc -l)

if [ "$COMPONENT_VIOLATIONS" -eq 0 ]; then
  echo "✅ PASS: No components call router.navigate() directly"
else
  echo "❌ FAIL: Found $COMPONENT_VIOLATIONS component violations"
  grep -r "router\.navigate" --include="*.component.ts" src/ | grep -v "node_modules"
fi

# R7.3 - Check pop-out components
echo ""
echo "R7.3 - Checking pop-out component patterns..."
POPOUT_VIOLATIONS=$(grep -r "router\.navigate" src/app/features/popout/ src/app/features/panel-popout/ 2>/dev/null | wc -l)

if [ "$POPOUT_VIOLATIONS" -eq 0 ]; then
  echo "✅ PASS: No router.navigate() in pop-out components"
else
  echo "❌ FAIL: Found $POPOUT_VIOLATIONS pop-out violations"
  grep -r "router\.navigate" src/app/features/popout/ src/app/features/panel-popout/ 2>/dev/null
fi

echo ""
echo "=== Summary ==="
TOTAL_VIOLATIONS=$((VIOLATIONS + COMPONENT_VIOLATIONS + POPOUT_VIOLATIONS))
if [ "$TOTAL_VIOLATIONS" -eq 0 ]; then
  echo "✅ All R7 tests passed"
else
  echo "❌ $TOTAL_VIOLATIONS total violations found"
fi
```

---

## Category 8: Visual Verification

Screenshot-based testing to verify visual presentation.

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| V8.1 | Home page renders correctly | Matches baseline screenshot |
| V8.2 | Discover page renders correctly | All panels visible, correct layout |
| V8.3 | Results table renders with data | Rows display, columns aligned |
| V8.4 | Statistics panel renders | All stats visible, formatted correctly |
| V8.5 | Query control panel renders | All filter inputs visible |
| V8.6 | Picker component renders | Items selectable, selection highlighted |
| V8.7 | Highlighted rows visually distinct | Highlight color applied correctly |
| V8.8 | Pagination controls render | Page numbers, navigation arrows visible |
| V8.9 | Sort indicators render | Ascending/descending arrows visible |
| V8.10 | Pop-out window renders | No header, correct panel content |
| V8.11 | Charts render (if applicable) | Data visualized correctly |
| V8.12 | Error state renders | Error message displayed |
| V8.13 | Loading state renders | Loading spinner/skeleton visible |
| V8.14 | Empty state renders | "No results" message displayed |
| V8.15 | Mobile viewport renders | Responsive layout correct |
| V8.16 | Manufacturer filter applied screenshot | Visual confirmation of filtered state |
| V8.17 | Year range filter applied screenshot | Visual confirmation of range filter |
| V8.18 | Combined filters screenshot | Multiple filters visual state |
| V8.19 | Highlight with filter screenshot | Highlights visible within filtered data |
| V8.20 | Pop-out synchronized screenshot | Pop-out matches main window state |

### Playwright Visual Tests

```typescript
// e2e/tests/category-8-visual.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 8: Visual Verification', () => {

  test('V8.1 - Home page visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/home`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home-page.png', { fullPage: true });
  });

  test('V8.2 - Discover page visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('discover-page.png', { fullPage: true });
  });

  test('V8.3 - Results table visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="results-table"]')).toHaveScreenshot('results-table.png');
  });

  test('V8.4 - Statistics panel visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="statistics-panel"]')).toHaveScreenshot('statistics-panel.png');
  });

  test('V8.5 - Query control panel visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="query-control"]')).toHaveScreenshot('query-control.png');
  });

  test('V8.6 - Picker component visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="picker"]')).toHaveScreenshot('picker.png');
  });

  test('V8.7 - Highlighted rows visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="results-table"]')).toHaveScreenshot('highlighted-rows.png');
  });

  test('V8.8 - Pagination controls visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="pagination"]')).toHaveScreenshot('pagination.png');
  });

  test('V8.9 - Sort indicators visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?sort=year&sortDirection=desc`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="col-header-year"]')).toHaveScreenshot('sort-indicator.png');
  });

  test('V8.12 - Error state visual', async ({ page }) => {
    // Intercept API to force error
    await page.route('**/api/**', route => route.abort());
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="error-message"]')).toHaveScreenshot('error-state.png');
  });

  test('V8.13 - Loading state visual', async ({ page }) => {
    // Delay API response to capture loading state
    await page.route('**/api/**', async route => {
      await new Promise(r => setTimeout(r, 5000));
      route.continue();
    });
    await page.goto(`${BASE_URL}/discover`);
    await expect(page.locator('[data-testid="loading-indicator"]')).toHaveScreenshot('loading-state.png');
  });

  test('V8.14 - Empty state visual', async ({ page }) => {
    // Use filter that returns no results
    await page.goto(`${BASE_URL}/discover?manufacturer=NonExistent`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="empty-state"]')).toHaveScreenshot('empty-state.png');
  });

  test('V8.15 - Mobile viewport visual', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('mobile-view.png', { fullPage: true });
  });

  test('V8.16 - Manufacturer filter applied visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('filter-manufacturer.png', { fullPage: true });
  });

  test('V8.17 - Year range filter visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?yearMin=2020&yearMax=2024`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('filter-year-range.png', { fullPage: true });
  });

  test('V8.18 - Combined filters visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford&yearMin=2020&bodyClass=SUV`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('filter-combined.png', { fullPage: true });
  });

  test('V8.19 - Highlight with filter visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford&h_yearMin=2022`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('highlight-with-filter.png', { fullPage: true });
  });
});
```

---

## Category 9: Component Data Accuracy

Verify that all components display correct data matching URL filters.

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| D9.1 | Results table row count matches API response | Total rows = API totalResults (paginated) |
| D9.2 | Statistics count matches results | stat-count equals table row total |
| D9.3 | Manufacturer filter reflects in statistics | Statistics show only filtered manufacturer |
| D9.4 | Year range filter reflects in statistics | Year distribution matches filter range |
| D9.5 | Picker selected items match URL | Selected picker items reflect URL params |
| D9.6 | Chart data matches filtered results | Chart values match statistics |
| D9.7 | Pagination shows correct total pages | Total pages = ceil(totalResults / pageSize) |
| D9.8 | Current page data matches offset | Row IDs match expected offset |
| D9.9 | Sort order matches data | Rows sorted by correct column/direction |
| D9.10 | Highlight count matches data | Highlighted row count matches filter criteria |
| D9.11 | Cross-verify statistics with raw data | Manual calculation matches displayed stats |
| D9.12 | Empty filter shows all data | No filter = full dataset count |
| D9.13 | Clear filter restores all data | After clear, count returns to full |
| D9.14 | Multiple filters reduce results | Each additional filter reduces count |
| D9.15 | API response matches displayed data | Network response equals UI content |

### Playwright Data Tests

```typescript
// e2e/tests/category-9-data-accuracy.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 9: Component Data Accuracy', () => {

  test('D9.1 - Results table row count matches API', async ({ page }) => {
    let apiResponse: any;

    await page.route('**/api/automobiles**', async route => {
      const response = await route.fetch();
      apiResponse = await response.json();
      route.fulfill({ response });
    });

    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');

    const rows = page.locator('[data-testid="results-row"]');
    const rowCount = await rows.count();

    // Row count should match page size (or totalResults if less)
    const expectedRows = Math.min(apiResponse.totalResults, apiResponse.pageSize || 20);
    expect(rowCount).toBe(expectedRows);
  });

  test('D9.2 - Statistics count matches results', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');

    const statCount = await page.locator('[data-testid="stat-count"]').textContent();
    const paginationTotal = await page.locator('[data-testid="pagination-total"]').textContent();

    expect(statCount).toBe(paginationTotal);
  });

  test('D9.3 - Manufacturer filter reflects in statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
    await page.waitForLoadState('networkidle');

    // Statistics should show Ford-specific data
    await expect(page.locator('[data-testid="stat-manufacturer"]')).toContainText('Ford');

    // All rows should be Ford
    const manufacturers = await page.locator('[data-testid="col-manufacturer"]').allTextContents();
    manufacturers.forEach(m => expect(m).toBe('Ford'));
  });

  test('D9.7 - Pagination shows correct total pages', async ({ page }) => {
    let totalResults: number;
    const pageSize = 20;

    await page.route('**/api/automobiles**', async route => {
      const response = await route.fetch();
      const data = await response.json();
      totalResults = data.totalResults;
      route.fulfill({ response });
    });

    await page.goto(`${BASE_URL}/discover?size=${pageSize}`);
    await page.waitForLoadState('networkidle');

    const totalPages = await page.locator('[data-testid="pagination-total-pages"]').textContent();
    const expectedPages = Math.ceil(totalResults! / pageSize);

    expect(parseInt(totalPages || '0')).toBe(expectedPages);
  });

  test('D9.9 - Sort order matches data', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?sort=year&sortDirection=desc`);
    await page.waitForLoadState('networkidle');

    const years = await page.locator('[data-testid="col-year"]').allTextContents();
    const yearNums = years.map(y => parseInt(y));

    // Verify descending order
    for (let i = 1; i < yearNums.length; i++) {
      expect(yearNums[i]).toBeLessThanOrEqual(yearNums[i-1]);
    }
  });

  test('D9.10 - Highlight count matches data', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?h_yearMin=2022`);
    await page.waitForLoadState('networkidle');

    const highlightedRows = page.locator('[data-testid="results-row"].highlighted');
    const highlightCount = await highlightedRows.count();

    // Verify highlighted rows have year >= 2022
    for (const row of await highlightedRows.all()) {
      const year = parseInt(await row.locator('[data-testid="col-year"]').textContent() || '0');
      expect(year).toBeGreaterThanOrEqual(2022);
    }

    // Verify non-highlighted rows have year < 2022
    const nonHighlightedRows = page.locator('[data-testid="results-row"]:not(.highlighted)');
    for (const row of await nonHighlightedRows.all()) {
      const year = parseInt(await row.locator('[data-testid="col-year"]').textContent() || '0');
      expect(year).toBeLessThan(2022);
    }
  });

  test('D9.12 - Empty filter shows all data', async ({ page }) => {
    // Get full count
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    const fullCount = await page.locator('[data-testid="stat-count"]').textContent();

    // Apply and clear filter
    await page.locator('[data-testid="filter-manufacturer"]').click();
    await page.locator('[data-testid="option-Ford"]').click();
    await page.waitForLoadState('networkidle');

    const filteredCount = await page.locator('[data-testid="stat-count"]').textContent();
    expect(parseInt(filteredCount || '0')).toBeLessThan(parseInt(fullCount || '0'));

    // Clear filter
    await page.locator('[data-testid="clear-all-filters"]').click();
    await page.waitForLoadState('networkidle');

    const restoredCount = await page.locator('[data-testid="stat-count"]').textContent();
    expect(restoredCount).toBe(fullCount);
  });

  test('D9.14 - Multiple filters reduce results', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    const fullCount = parseInt(await page.locator('[data-testid="stat-count"]').textContent() || '0');

    // Apply first filter
    await page.locator('[data-testid="filter-manufacturer"]').click();
    await page.locator('[data-testid="option-Ford"]').click();
    await page.waitForLoadState('networkidle');
    const count1 = parseInt(await page.locator('[data-testid="stat-count"]').textContent() || '0');

    expect(count1).toBeLessThanOrEqual(fullCount);

    // Apply second filter
    await page.locator('[data-testid="filter-yearMin"]').fill('2020');
    await page.locator('[data-testid="filter-yearMin"]').blur();
    await page.waitForLoadState('networkidle');
    const count2 = parseInt(await page.locator('[data-testid="stat-count"]').textContent() || '0');

    expect(count2).toBeLessThanOrEqual(count1);
  });

  test('D9.15 - API response matches displayed data', async ({ page }) => {
    let apiData: any[];

    await page.route('**/api/automobiles**', async route => {
      const response = await route.fetch();
      const data = await response.json();
      apiData = data.results;
      route.fulfill({ response });
    });

    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');

    // Compare first row
    const firstRowManufacturer = await page.locator('[data-testid="results-row"]').first()
      .locator('[data-testid="col-manufacturer"]').textContent();

    expect(firstRowManufacturer).toBe(apiData![0].manufacturer);
  });
});
```

---

## Category 10: Error Handling

Test error states and recovery.

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| E10.1 | API timeout handled gracefully | Loading state clears; error message shown |
| E10.2 | API 500 error handled | Error message displayed; retry option |
| E10.3 | API 404 error handled | Appropriate message; graceful fallback |
| E10.4 | Network offline handled | Offline indicator; cached data if available |
| E10.5 | Invalid URL params handled | Graceful ignore/default; no crash |
| E10.6 | BroadcastChannel failure handled | Pop-out continues; main window unaffected |
| E10.7 | Pop-out window closed unexpectedly | Main window continues normally |
| E10.8 | Recovery after error | Retry succeeds; state restored |

### Playwright Error Tests

```typescript
// e2e/tests/category-10-error-handling.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 10: Error Handling', () => {

  test('E10.1 - API timeout handled gracefully', async ({ page }) => {
    // Simulate timeout
    await page.route('**/api/automobiles**', async route => {
      await new Promise(r => setTimeout(r, 30000));
      route.abort('timedout');
    });

    await page.goto(`${BASE_URL}/discover`);

    // Should show error state after timeout
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 35000 });
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });

  test('E10.2 - API 500 error handled', async ({ page }) => {
    await page.route('**/api/automobiles**', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('E10.3 - API 404 error handled', async ({ page }) => {
    await page.route('**/api/automobiles**', route =>
      route.fulfill({ status: 404, body: 'Not Found' })
    );

    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('E10.5 - Invalid URL params handled', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?page=-1&size=abc&sort=nonexistent`);
    await page.waitForLoadState('networkidle');

    // Application should not crash
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible();

    // Invalid params should be ignored/defaulted
    await expect(page).toHaveURL(/page=1|!page=/); // Either page=1 or no page param
  });

  test('E10.7 - Pop-out window closed unexpectedly', async ({ browser }) => {
    const context = await browser.newContext();
    const mainPage = await context.newPage();

    await mainPage.goto(`${BASE_URL}/discover`);
    await mainPage.waitForLoadState('networkidle');

    // Open pop-out
    const [popout] = await Promise.all([
      context.waitForEvent('page'),
      mainPage.locator('[data-testid="popout-query-control"]').click()
    ]);
    await popout.waitForLoadState('networkidle');

    // Force close pop-out
    await popout.close();

    // Main window should continue working
    await mainPage.locator('[data-testid="filter-manufacturer"]').click();
    await mainPage.locator('[data-testid="option-Ford"]').click();

    await expect(mainPage).toHaveURL(/manufacturer=Ford/);

    await context.close();
  });

  test('E10.8 - Recovery after error', async ({ page }) => {
    let failNext = true;

    await page.route('**/api/automobiles**', async route => {
      if (failNext) {
        failNext = false;
        route.fulfill({ status: 500 });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');

    // Should show error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

    // Click retry
    await page.locator('[data-testid="retry-button"]').click();
    await page.waitForLoadState('networkidle');

    // Should recover
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
  });
});
```

---

## Anti-Pattern Checklist

These patterns indicate URL-First violations and should fail testing:

| Anti-Pattern | How to Detect | Severity |
|--------------|---------------|----------|
| Direct state mutation bypassing URL | State changes without URL param update | Critical |
| `router.navigate()` in components | Grep for `router.navigate` outside UrlStateService | Critical |
| Pop-out making API calls | Network tab shows fetch from pop-out window | Critical |
| Pop-out updating its own URL | Pop-out URL changes after initial load | Critical |
| State not in URL that should be shareable | Filter applied but not in URL; refresh loses state | High |
| Highlight state without `h_` prefix | Highlight params using wrong naming convention | Medium |

---

## Test Execution Commands

```bash
# Run all tests
npx playwright test

# Run specific category
npx playwright test --grep "Category 1"
npx playwright test --grep "Category 2"
# ... etc

# Run with UI
npx playwright test --ui

# Update visual snapshots
npx playwright test --update-snapshots

# Run static analysis
chmod +x e2e/scripts/verify-router-encapsulation.sh
./e2e/scripts/verify-router-encapsulation.sh

# Generate test report
npx playwright show-report
```

---

## Required Data Attributes

For tests to work, components must have these `data-testid` attributes:

### Results Table
- `results-table` - Table container
- `results-row` - Each data row
- `col-manufacturer` - Manufacturer cell
- `col-year` - Year cell
- `col-model` - Model cell
- `col-bodyClass` - Body class cell
- `col-header-*` - Column headers (e.g., `col-header-year`)

### Filters
- `filter-manufacturer` - Manufacturer dropdown
- `filter-yearMin` - Year min input
- `filter-yearMax` - Year max input
- `filter-bodyClass` - Body class dropdown
- `highlight-manufacturer` - Highlight manufacturer
- `highlight-yearMin` - Highlight year min
- `highlight-yearMax` - Highlight year max
- `clear-all-filters` - Clear filters button

### Pagination
- `pagination` - Pagination container
- `pagination-page-*` - Page number buttons (e.g., `pagination-page-2`)
- `pagination-current` - Current page indicator
- `pagination-total` - Total results count
- `pagination-total-pages` - Total pages count
- `page-size-select` - Page size dropdown

### Statistics
- `statistics-panel` - Statistics container
- `stat-count` - Total count display
- `stat-manufacturer` - Manufacturer stat
- `highlighted-manufacturer` - Highlighted manufacturer indicator

### Other
- `site-header` - Site header/navigation
- `query-control` - Query control panel
- `query-panel` - Query panel container
- `picker` - Picker component
- `loading-indicator` - Loading state
- `error-message` - Error display
- `empty-state` - No results message
- `retry-button` - Error retry button
- `popout-*` - Pop-out buttons (e.g., `popout-query-control`)

---

## Reference Documents

| Document | Location | Purpose |
|----------|----------|---------|
| URL-First Overview | `docs/README.md` | Core principles and benefits |
| State Management Spec | `docs/STATE-MANAGEMENT-SPECIFICATION.md` | Complete 1800-line specification |
| Architecture Overview | `docs/ARCHITECTURE-OVERVIEW.md` | Service hierarchy and data flow |
| Pop-Out Architecture | `docs/POPOUT-ARCHITECTURE.md` | Cross-window communication |
| Implementation Audit | `docs/URL-FIRST-AS-IMPLEMENTED.md` | Compliance verification example |
| Testing Rubric | `textbook/A02-url-first-testing-rubric.md` | Manual testing checklist |
