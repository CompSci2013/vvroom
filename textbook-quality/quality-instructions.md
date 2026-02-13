# QUALITY INSTRUCTIONS

## Purpose

This document provides comprehensive quality verification procedures for the vvroom application. The goal is to verify that all components function correctly and adhere to the URL-First State Management paradigm.

**Related Document:** See [test-rubric.md](test-rubric.md) for the comprehensive Playwright test rubric with real data values and screenshot specifications.

---

## Test Environment

| Environment | Port | Purpose |
|-------------|------|---------|
| Development | 4207 | Manual testing and debugging |
| Playwright  | 4228 | Automated E2E testing |

**API Base URL:** `http://generic-prime.minilab/api/specs/v1`

### Prerequisites

```bash
# Start development server (port 4207)
ng serve --port 4207

# Start test server (port 4228) - separate terminal
ng serve --configuration=production --port 4228
```

---

## Test Data Reference

See [test-rubric.md](test-rubric.md) for complete data reference including:
- Available manufacturers (Chevrolet, Ford, Tesla, etc.)
- Body classes (Sedan, SUV, Pickup, etc.)
- Year range (1908-2024)
- All URL parameters

---

## Test Categories Overview

| Category | Tests | Scope |
|----------|-------|-------|
| 1. Visual Appearance | V1.x | Component rendering in default and various states |
| 2. URL-First Conformity | U2.x | URL to state and state to URL verification |
| 3. URL Change Consistency | U3.x | Browser navigation and manual URL edits |
| 4. Pop-Out Behavior | P4.x | Pop-out rendering and synchronization |
| 5. Cross-Window Synchronization | S5.x | Bidirectional communication |
| 6. Router Navigate Encapsulation | R6.x | Code-level compliance |
| 7. Error Handling | E7.x | Error states and recovery |
| 8. Visual Verification | VS8.x | Screenshot-based visual testing |

---

## Category 1: Visual Appearance Tests

Test that components render correctly in default and various states.

See [test-rubric.md#category-1-visual-appearance-tests](test-rubric.md#category-1-visual-appearance-tests) for complete test specifications including:
- Default state rendering (V1.1.x)
- Filtered state rendering (V1.2.x)
- Highlighted state rendering (V1.3.x)
- Sorted state rendering (V1.4.x)
- Paginated state rendering (V1.5.x)

### Screenshot Requirements

All screenshots must include the full browser URL bar at the top to verify URL-First state management.

---

## Category 2: URL-First Conformity Tests

Test that component state reflects URL parameters and user interactions update the URL.

### 2.1 URL to State (Load URL, Verify State)

| Test ID | URL Parameters | Expected State |
|---------|---------------|----------------|
| U2.1.1 | `?manufacturer=Ford` | Manufacturer dropdown shows "Ford"; table shows only Ford vehicles |
| U2.1.2 | `?yearMin=2010&yearMax=2020` | Year range inputs show 2010-2020; table filtered |
| U2.1.3 | `?bodyClass=Pickup` | Body class dropdown shows "Pickup"; table filtered |
| U2.1.4 | `?page=3&size=10` | Page 3 displayed; 10 rows visible |
| U2.1.5 | `?sortBy=year&sortOrder=desc` | Year column sorted descending; sort indicator visible |
| U2.1.6 | `?h_manufacturer=Tesla` | Manufacturer highlight shows "Tesla"; Tesla rows highlighted |
| U2.1.7 | `?manufacturer=Chevrolet&h_yearMin=2015&h_yearMax=2020` | Chevrolet filtered + years 2015-2020 highlighted |

### 2.2 State to URL (User Interaction, Verify URL)

| Test ID | User Action | Expected URL Change |
|---------|-------------|---------------------|
| U2.2.1 | Select "Dodge" from manufacturer dropdown | URL contains `manufacturer=Dodge` |
| U2.2.2 | Set year range 2000-2010 | URL contains `yearMin=2000&yearMax=2010` |
| U2.2.3 | Select "SUV" body class | URL contains `bodyClass=SUV` |
| U2.2.4 | Click page 4 | URL contains `page=4` |
| U2.2.5 | Change page size to 50 | URL contains `size=50` |
| U2.2.6 | Click year column header to sort | URL contains `sortBy=year` |
| U2.2.7 | Click sort toggle for descending | URL contains `sortOrder=desc` |
| U2.2.8 | Type "camaro" in search | URL contains `search=camaro` |
| U2.2.9 | Clear all filters button | URL has no filter parameters |
| U2.2.10 | Apply highlight for manufacturer | URL contains `h_manufacturer=...` |

### Playwright Tests

```typescript
// e2e/tests/category-2-url-first.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 2: URL-First Conformity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
  });

  test('U2.2.1 - Query control filter updates URL and results', async ({ page }) => {
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

  test('U2.2.10 - Highlight filter updates URL with h_ prefix', async ({ page }) => {
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

  test('U2.2.4 - Pagination page number updates URL', async ({ page }) => {
    // Click page 2
    await page.locator('[data-testid="pagination-page-2"]').click();

    // Verify URL
    await expect(page).toHaveURL(/page=2/);

    // Verify table data changed (different first row)
    const firstRow = page.locator('[data-testid="results-row"]').first();
    // Store and compare content after page change
  });

  test('U2.2.5 - Page size updates URL and row count', async ({ page }) => {
    // Change page size to 50
    await page.locator('[data-testid="page-size-select"]').selectOption('50');

    // Verify URL
    await expect(page).toHaveURL(/size=50/);

    // Verify row count
    const rows = page.locator('[data-testid="results-row"]');
    await expect(rows).toHaveCount(50);
  });

  test('U2.2.6 - Sort column updates URL', async ({ page }) => {
    // Click year column header to sort
    await page.locator('[data-testid="col-header-year"]').click();

    // Verify URL
    await expect(page).toHaveURL(/sortBy=year/);
  });

  test('U2.2.7 - Sort direction toggles and updates URL', async ({ page }) => {
    // Click year column header twice
    await page.locator('[data-testid="col-header-year"]').click();
    await expect(page).toHaveURL(/sortOrder=asc/);

    await page.locator('[data-testid="col-header-year"]').click();
    await expect(page).toHaveURL(/sortOrder=desc/);

    // Verify data is sorted descending
    const years = await page.locator('[data-testid="col-year"]').allTextContents();
    const sortedYears = [...years].sort((a, b) => parseInt(b) - parseInt(a));
    expect(years).toEqual(sortedYears);
  });

  test('U2.2.9 - Clear all filters resets URL and data', async ({ page }) => {
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

  test('U2.3.1 - Multiple filters apply intersection', async ({ page }) => {
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

## Category 3: URL Change Consistency Tests

Test browser back/forward navigation and manual URL edits restore correct state.

### 3.1 Browser Navigation

| Test ID | Test Sequence | Expected Behavior |
|---------|--------------|-------------------|
| U3.1.1 | Select Ford → Select Chevrolet → Click Back | Ford filter restored; table shows Ford vehicles |
| U3.1.2 | Navigate to page 3 → Navigate to page 5 → Click Back → Click Back | Page 3 restored, then page 1 |
| U3.1.3 | Apply sort → Apply filter → Click Back | Sort remains; filter removed |
| U3.1.4 | Apply highlight → Click Back | Highlight removed |

### 3.2 Manual URL Edits

| Test ID | URL Edit Action | Expected Behavior |
|---------|-----------------|-------------------|
| U3.2.1 | Change `manufacturer=Ford` to `manufacturer=Dodge` in URL bar | Dodge filter applied; table updates |
| U3.2.2 | Add `&yearMin=2010` to existing URL | Year filter added to existing filters |
| U3.2.3 | Remove `page=3` from URL | Return to page 1 |
| U3.2.4 | Change `sortOrder=asc` to `sortOrder=desc` | Sort direction reverses |

See [test-rubric.md#category-3-url-change-consistency-tests](test-rubric.md#category-3-url-change-consistency-tests) for complete test specifications.

---

## Category 4: Pop-Out Behavior Tests

Test that components function correctly when popped out to separate windows.

### 4.1 Pop-Out Window Rendering

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| P4.1.1 | Pop out results table | Table displays in new window without site header |
| P4.1.2 | Pop-out URL contains `popout=true` | URL includes pop-out indicator |
| P4.1.3 | Pop-out hides site banner/header | No navigation header visible |
| P4.1.4 | Main window shows placeholder icon | Icon indicates component is popped out |

### 4.2 Pop-Out Synchronization

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| P4.2.1 | Change filter in main window | Pop-out updates to reflect filter |
| P4.2.2 | Change filter in pop-out | Main window URL updates; main window state changes |
| P4.2.3 | Apply highlight in pop-out | Main window highlights update |

### 4.3 Pop-Out API Behavior

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| P4.3.1 | Pop-out does NOT update its own URL | Pop-out URL remains static after initial load |
| P4.3.2 | Pop-out does NOT make its own API calls | Network tab shows no API requests from pop-out |
| P4.3.3 | Pop-out receives data via BroadcastChannel | Data propagated from main window |

### Playwright Tests

```typescript
// e2e/tests/category-4-popout.spec.ts

import { test, expect, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 4: Pop-Out Behavior', () => {
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

  test('P4.2.2 - Highlight filter in pop-out updates main window URL', async () => {
    popoutPage = await openPopout('query-control');

    // Change highlight in pop-out
    await popoutPage.locator('[data-testid="highlight-manufacturer"]').click();
    await popoutPage.locator('[data-testid="option-Tesla"]').click();

    // Verify main window URL updated
    await expect(mainPage).toHaveURL(/h_manufacturer=Tesla/);
  });

  test('P4.3.1 - Pop-out URL remains static after filter changes', async () => {
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

  test('P4.3.2 - Pop-out does NOT make API calls after initial load', async () => {
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

  test('P4.3.3 - Pop-out receives state via BroadcastChannel', async () => {
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

  test('P4.4.3 - Multiple pop-outs stay synchronized', async () => {
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

## Category 5: Cross-Window Synchronization Tests

Test bidirectional communication between main window and pop-outs.

### 5.1 Main Window to Pop-Out

| Test ID | Main Window Action | Expected Pop-Out Response |
|---------|-------------------|--------------------------|
| S5.1.1 | Change manufacturer filter | Pop-out filters to same manufacturer |
| S5.1.2 | Apply year range filter | Pop-out shows same year range |
| S5.1.3 | Change sort column | Pop-out table re-sorts |
| S5.1.4 | Change page | Pop-out shows same page |
| S5.1.5 | Apply highlight | Pop-out highlights matching rows |

### 5.2 Pop-Out to Main Window

| Test ID | Pop-Out Action | Expected Main Window Response |
|---------|---------------|------------------------------|
| S5.2.1 | Change highlight filter | Main window URL updates with `h_` param |
| S5.2.2 | Apply filter in pop-out | Main window URL updates; table filters |
| S5.2.3 | Clear filters in pop-out | Main window URL clears filter params |

See [test-rubric.md#category-5-cross-window-synchronization-tests](test-rubric.md#category-5-cross-window-synchronization-tests) for complete specifications.

### Playwright Tests

```typescript
// e2e/tests/category-5-cross-window-sync.spec.ts

import { test, expect, BrowserContext, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 5: Cross-Window Synchronization', () => {
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

  test('S5.1.1 - Main window filter updates all pop-outs', async () => {
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

  test('S5.2.1 - Pop-out filter change updates main window URL', async () => {
    const popout = await openPopout('query-control');

    // Change filter in pop-out
    await popout.locator('[data-testid="highlight-yearMin"]').fill('2020');
    await popout.locator('[data-testid="highlight-yearMin"]').blur();

    // Main window URL should update
    await expect(mainPage).toHaveURL(/h_yearMin=2020/);
  });

  test('S5.1.4 - Main window data refresh updates pop-outs', async () => {
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

  test('S5.3 - Close pop-out does not affect main window', async () => {
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
});
```

---

## Category 6: Router Navigate Encapsulation Tests

Verify that `router.navigate()` is only called from `UrlStateService`.

| Test ID | Test Description | Expected Behavior |
|---------|-----------------|-------------------|
| R6.1 | Grep codebase for `router.navigate` | Only appears in `url-state.service.ts` |
| R6.2 | Components call `updateFilters()` | No direct `router.navigate()` in components |
| R6.3 | Pop-out components use parent messaging | No `router.navigate()` in pop-out components |
| R6.4 | Search input updates via service | Search triggers service method, not direct navigate |

### Static Analysis Tests

```bash
#!/bin/bash
# e2e/scripts/verify-router-encapsulation.sh

echo "=== Category 6: Router Navigate Encapsulation ==="

# R6.1 - Check router.navigate usage
echo ""
echo "R6.1 - Checking router.navigate() usage..."
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

# R6.2 - Check component patterns
echo ""
echo "R6.2 - Checking component filter update patterns..."
COMPONENT_VIOLATIONS=$(grep -r "router\.navigate" --include="*.component.ts" src/ | grep -v "node_modules" | wc -l)

if [ "$COMPONENT_VIOLATIONS" -eq 0 ]; then
  echo "✅ PASS: No components call router.navigate() directly"
else
  echo "❌ FAIL: Found $COMPONENT_VIOLATIONS component violations"
  grep -r "router\.navigate" --include="*.component.ts" src/ | grep -v "node_modules"
fi

# R6.3 - Check pop-out components
echo ""
echo "R6.3 - Checking pop-out component patterns..."
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
  echo "✅ All R6 tests passed"
else
  echo "❌ $TOTAL_VIOLATIONS total violations found"
fi
```

---

## Category 7: Error Handling Tests

Test graceful handling of invalid or edge-case inputs.

| Test ID | Invalid Input | Expected Behavior |
|---------|--------------|-------------------|
| E7.1 | `?manufacturer=InvalidBrand` | Graceful handling; invalid param ignored or defaulted |
| E7.2 | `?yearMin=3000` | Invalid year handled gracefully |
| E7.3 | `?page=-1` | Returns to valid page (1) |
| E7.4 | `?size=10000` | Capped to maximum allowed size |
| E7.5 | `?sortBy=invalidField` | Sort ignored; default order used |
| E7.6 | Empty search `?search=` | Treated as no search |
| E7.7 | Special characters in search | Properly escaped/handled |

See [test-rubric.md#category-7-error-handling-tests](test-rubric.md#category-7-error-handling-tests) for complete error handling specifications.

---

## Category 8: Visual Verification Tests

Screenshot-based testing to verify visual presentation.

**Important:** All screenshots must include the full browser URL bar at the top of the image to verify URL-First state management.

### 8.1 Component Screenshots - Default State

| Test ID | Component | URL | Screenshot File |
|---------|-----------|-----|-----------------|
| VS8.1.1 | Full Page | `/` | `full-page-default.png` |
| VS8.1.2 | Results Table | `/` | `results-table-default.png` |
| VS8.1.3 | Filter Panel | `/` | `filter-panel-default.png` |
| VS8.1.4 | Statistics | `/` | `statistics-default.png` |
| VS8.1.5 | Pagination | `/` | `pagination-default.png` |

### 8.2 Component Screenshots - Filtered State

| Test ID | Filter Applied | Screenshot File |
|---------|----------------|-----------------|
| VS8.2.1 | `?manufacturer=Ford` | `full-page-filtered-ford.png` |
| VS8.2.2 | `?bodyClass=SUV` | `full-page-filtered-suv.png` |
| VS8.2.3 | `?yearMin=2020&yearMax=2024` | `full-page-filtered-recent.png` |

### 8.3 Component Screenshots - Highlighted State

| Test ID | Highlight Applied | Screenshot File |
|---------|-------------------|-----------------|
| VS8.3.1 | `?h_manufacturer=Tesla` | `full-page-highlight-tesla.png` |
| VS8.3.2 | `?h_yearMin=2015&h_yearMax=2020` | `full-page-highlight-years.png` |
| VS8.3.3 | `?manufacturer=Ford&h_yearMin=2018&h_yearMax=2022` | `full-page-filter-with-highlight.png` |

### 8.4 Pop-Out Screenshots

| Test ID | Component | Screenshot Files |
|---------|-----------|------------------|
| VS8.4.1 | Results Table Pop-out | `results-table-popout-standalone.png`, `results-table-popout-with-main.png` |
| VS8.4.2 | Statistics Pop-out | `statistics-popout-standalone.png`, `statistics-popout-with-main.png` |

See [test-rubric.md#category-8-visual-verification-tests](test-rubric.md#category-8-visual-verification-tests) for complete visual test specifications.

### Playwright Visual Tests

```typescript
// e2e/tests/category-8-visual.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 8: Visual Verification', () => {

  test('VS8.1.1 - Full page default visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('full-page-default.png', { fullPage: true });
  });

  test('VS8.1.2 - Results table visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="results-table"]')).toHaveScreenshot('results-table-default.png');
  });

  test('VS8.2.1 - Manufacturer filter applied visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('full-page-filtered-ford.png', { fullPage: true });
  });

  test('VS8.3.1 - Highlighted rows visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('full-page-highlight-tesla.png', { fullPage: true });
  });

  test('VS8.3.3 - Filter with highlight visual', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford&h_yearMin=2018&h_yearMax=2022`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('full-page-filter-with-highlight.png', { fullPage: true });
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
| Component local state shadows URL state | Component state differs from URL | High |

---

## Test Execution Commands

```bash
# Run all tests
npx playwright test

# Run specific category
npx playwright test --grep "Category 2"
npx playwright test --grep "Category 4"
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
| Test Rubric | [test-rubric.md](test-rubric.md) | Comprehensive Playwright test specifications |
| Test Data | [../test-data/README.md](../test-data/README.md) | API data structure and sample values |
| URL-First Overview | `docs/README.md` | Core principles and benefits |
| State Management Spec | `docs/STATE-MANAGEMENT-SPECIFICATION.md` | Complete 1800-line specification |
| Architecture Overview | `docs/ARCHITECTURE-OVERVIEW.md` | Service hierarchy and data flow |
| Pop-Out Architecture | `docs/POPOUT-ARCHITECTURE.md` | Cross-window communication |
| Manual Testing Rubric | `textbook/A02-url-first-testing-rubric.md` | Manual testing checklist |
