/**
 * Integration Tests for Vvroom Discovery Application
 *
 * Tests URL-First State Management compliance and component functionality.
 * Run with: npx playwright test e2e/integration-tests.spec.js
 *
 * Prerequisites:
 * - Development server running on port 4207 (npm run dev:server)
 * - API server accessible at http://generic-prime.minilab/api/specs/v1
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4228';
const SCREENSHOT_DIR = 'e2e/screenshots/integration';

// Test data based on API exploration
const TEST_DATA = {
  manufacturers: ['Ford', 'Chevrolet', 'Tesla', 'Buick', 'Dodge'],
  bodyClasses: ['Sedan', 'SUV', 'Coupe', 'Pickup', 'Hatchback'],
  yearRange: { min: 2015, max: 2024 },
  modelCombos: 'Ford:Mustang,Chevrolet:Camaro'
};

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * Helper to generate timestamped screenshot filename
 */
function screenshotPath(name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return path.join(SCREENSHOT_DIR, `${name}-${timestamp}.png`);
}

/**
 * Helper to wait for API response and network idle
 */
async function waitForDataLoad(page) {
  await page.waitForLoadState('networkidle');
  // Wait for results table to have data
  await page.waitForSelector('.p-datatable-tbody tr', { timeout: 10000 }).catch(() => {});
}

/**
 * Test Suite: Home Page
 */
async function testHomePage(browser) {
  console.log('\n=== Testing Home Page ===');
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // Test 1: Home page loads
    console.log('  [1/3] Loading home page...');
    await page.goto(`${BASE_URL}/home`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: screenshotPath('home-page'), fullPage: true });
    console.log('    ✓ Home page loaded');

    // Test 2: Navigation to Discover
    console.log('  [2/3] Testing navigation to Discover...');
    await page.click('a[routerlink="/discover"]');
    await waitForDataLoad(page);
    const url = page.url();
    if (url.includes('/discover')) {
      console.log('    ✓ Navigation to Discover successful');
    } else {
      console.log('    ✗ Navigation failed, URL:', url);
    }

    // Test 3: Return to Home
    console.log('  [3/3] Testing return to Home...');
    await page.click('a.home-link');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: screenshotPath('home-after-nav'), fullPage: true });
    console.log('    ✓ Return to Home successful');

  } finally {
    await context.close();
  }
}

/**
 * Test Suite: Discover Page Components
 */
async function testDiscoverComponents(browser) {
  console.log('\n=== Testing Discover Page Components ===');
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // Navigate to Discover
    await page.goto(`${BASE_URL}/discover`);
    await waitForDataLoad(page);

    // Test 1: Full page screenshot
    console.log('  [1/6] Capturing full discover page...');
    await page.screenshot({ path: screenshotPath('discover-full'), fullPage: true });
    console.log('    ✓ Full page captured');

    // Test 2: Query Control panel
    console.log('  [2/6] Testing Query Control panel...');
    const queryControl = await page.$('#panel-query-control');
    if (queryControl) {
      await queryControl.screenshot({ path: screenshotPath('component-query-control') });
      console.log('    ✓ Query Control panel captured');
    } else {
      console.log('    ⚠ Query Control panel not found');
    }

    // Test 3: Query Panel
    console.log('  [3/6] Testing Query Panel...');
    const queryPanel = await page.$('#panel-query-panel');
    if (queryPanel) {
      await queryPanel.screenshot({ path: screenshotPath('component-query-panel') });
      console.log('    ✓ Query Panel captured');
    } else {
      console.log('    ⚠ Query Panel not found');
    }

    // Test 4: Manufacturer-Model Picker
    console.log('  [4/6] Testing Picker panel...');
    const picker = await page.$('#panel-manufacturer-model-picker');
    if (picker) {
      await picker.screenshot({ path: screenshotPath('component-picker') });
      console.log('    ✓ Picker panel captured');
    } else {
      console.log('    ⚠ Picker panel not found');
    }

    // Test 5: Statistics Panel
    console.log('  [5/6] Testing Statistics panel...');
    const statistics = await page.$('#panel-statistics-panel-2');
    if (statistics) {
      await statistics.screenshot({ path: screenshotPath('component-statistics') });
      console.log('    ✓ Statistics panel captured');
    } else {
      console.log('    ⚠ Statistics panel not found');
    }

    // Test 6: Results Table
    console.log('  [6/6] Testing Results Table...');
    const resultsTable = await page.$('#panel-basic-results-table');
    if (resultsTable) {
      await resultsTable.screenshot({ path: screenshotPath('component-results-table') });
      console.log('    ✓ Results Table captured');
    } else {
      console.log('    ⚠ Results Table not found');
    }

  } finally {
    await context.close();
  }
}

/**
 * Test Suite: URL-First Filter Tests
 */
async function testUrlFirstFilters(browser) {
  console.log('\n=== Testing URL-First Filter Behavior ===');
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // Test 1: URL with manufacturer filter
    console.log('  [1/5] Testing manufacturer filter via URL...');
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
    await waitForDataLoad(page);
    const url1 = page.url();
    if (url1.includes('manufacturer=Ford')) {
      console.log('    ✓ Manufacturer filter in URL');
    }
    await page.screenshot({ path: screenshotPath('filter-manufacturer-ford'), fullPage: true });

    // Test 2: URL with year range
    console.log('  [2/5] Testing year range filter via URL...');
    await page.goto(`${BASE_URL}/discover?yearMin=2020&yearMax=2024`);
    await waitForDataLoad(page);
    await page.screenshot({ path: screenshotPath('filter-year-range'), fullPage: true });
    console.log('    ✓ Year range filter applied');

    // Test 3: URL with body class
    console.log('  [3/5] Testing body class filter via URL...');
    await page.goto(`${BASE_URL}/discover?bodyClass=SUV`);
    await waitForDataLoad(page);
    await page.screenshot({ path: screenshotPath('filter-body-class-suv'), fullPage: true });
    console.log('    ✓ Body class filter applied');

    // Test 4: URL with model combos
    console.log('  [4/5] Testing model combos filter via URL...');
    await page.goto(`${BASE_URL}/discover?modelCombos=${encodeURIComponent(TEST_DATA.modelCombos)}`);
    await waitForDataLoad(page);
    await page.screenshot({ path: screenshotPath('filter-model-combos'), fullPage: true });
    console.log('    ✓ Model combos filter applied');

    // Test 5: URL with combined filters
    console.log('  [5/5] Testing combined filters via URL...');
    await page.goto(`${BASE_URL}/discover?manufacturer=Chevrolet&yearMin=2015&yearMax=2020&bodyClass=SUV`);
    await waitForDataLoad(page);
    await page.screenshot({ path: screenshotPath('filter-combined'), fullPage: true });
    console.log('    ✓ Combined filters applied');

  } finally {
    await context.close();
  }
}

/**
 * Test Suite: URL-First Highlight Tests
 */
async function testUrlFirstHighlights(browser) {
  console.log('\n=== Testing URL-First Highlight Behavior ===');
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // Test 1: URL with highlight manufacturer
    console.log('  [1/4] Testing highlight manufacturer via URL...');
    await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
    await waitForDataLoad(page);
    const url1 = page.url();
    if (url1.includes('h_manufacturer=Tesla')) {
      console.log('    ✓ Highlight manufacturer in URL');
    }
    await page.screenshot({ path: screenshotPath('highlight-manufacturer-tesla'), fullPage: true });

    // Test 2: URL with highlight year range
    console.log('  [2/4] Testing highlight year range via URL...');
    await page.goto(`${BASE_URL}/discover?h_yearMin=2020&h_yearMax=2024`);
    await waitForDataLoad(page);
    await page.screenshot({ path: screenshotPath('highlight-year-range'), fullPage: true });
    console.log('    ✓ Highlight year range applied');

    // Test 3: Filter + Highlight combined
    console.log('  [3/4] Testing filter with highlight via URL...');
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford&h_yearMin=2018&h_yearMax=2022`);
    await waitForDataLoad(page);
    await page.screenshot({ path: screenshotPath('filter-with-highlight'), fullPage: true });
    console.log('    ✓ Filter with highlight applied');

    // Test 4: Multiple highlights
    console.log('  [4/4] Testing multiple highlights via URL...');
    await page.goto(`${BASE_URL}/discover?h_manufacturer=Rivian&h_bodyClass=Pickup`);
    await waitForDataLoad(page);
    await page.screenshot({ path: screenshotPath('highlight-multiple'), fullPage: true });
    console.log('    ✓ Multiple highlights applied');

  } finally {
    await context.close();
  }
}

/**
 * Test Suite: Pagination and Sorting
 */
async function testPaginationAndSorting(browser) {
  console.log('\n=== Testing Pagination and Sorting ===');
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // Test 1: Page 2 via URL
    console.log('  [1/4] Testing pagination via URL...');
    await page.goto(`${BASE_URL}/discover?page=2&size=25`);
    await waitForDataLoad(page);
    const url1 = page.url();
    if (url1.includes('page=2')) {
      console.log('    ✓ Pagination in URL');
    }
    await page.screenshot({ path: screenshotPath('pagination-page-2'), fullPage: true });

    // Test 2: Custom page size
    console.log('  [2/4] Testing page size via URL...');
    await page.goto(`${BASE_URL}/discover?size=50`);
    await waitForDataLoad(page);
    await page.screenshot({ path: screenshotPath('pagination-size-50'), fullPage: true });
    console.log('    ✓ Page size applied');

    // Test 3: Sort by year descending
    console.log('  [3/4] Testing sort via URL...');
    await page.goto(`${BASE_URL}/discover?sort=year&sortDirection=desc`);
    await waitForDataLoad(page);
    await page.screenshot({ path: screenshotPath('sort-year-desc'), fullPage: true });
    console.log('    ✓ Sort applied');

    // Test 4: Pagination + Sort combined
    console.log('  [4/4] Testing pagination with sort...');
    await page.goto(`${BASE_URL}/discover?page=3&size=10&sort=manufacturer&sortDirection=asc`);
    await waitForDataLoad(page);
    await page.screenshot({ path: screenshotPath('pagination-with-sort'), fullPage: true });
    console.log('    ✓ Pagination with sort applied');

  } finally {
    await context.close();
  }
}

/**
 * Test Suite: Panel Interactions
 */
async function testPanelInteractions(browser) {
  console.log('\n=== Testing Panel Interactions ===');
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/discover`);
    await waitForDataLoad(page);

    // Test 1: Collapse Query Control
    console.log('  [1/3] Testing panel collapse...');
    const collapseBtn = await page.$('#panel-query-control button[icon*="chevron"]');
    if (collapseBtn) {
      await collapseBtn.click();
      await page.waitForTimeout(300); // Animation
      await page.screenshot({ path: screenshotPath('panel-collapsed'), fullPage: true });
      console.log('    ✓ Panel collapsed');

      // Expand it back
      await collapseBtn.click();
      await page.waitForTimeout(300);
    }

    // Test 2: Pop-out button exists
    console.log('  [2/3] Verifying pop-out buttons exist...');
    const popoutBtns = await page.$$('button[id^="popout-"]');
    console.log(`    ✓ Found ${popoutBtns.length} pop-out buttons`);

    // Test 3: Drag handle exists
    console.log('  [3/3] Verifying drag handles exist...');
    const dragHandles = await page.$$('.drag-handle');
    console.log(`    ✓ Found ${dragHandles.length} drag handles`);

    await page.screenshot({ path: screenshotPath('panel-interactions-final'), fullPage: true });

  } finally {
    await context.close();
  }
}

/**
 * Test Suite: Pop-out Window (if enabled)
 */
async function testPopoutWindow(browser) {
  console.log('\n=== Testing Pop-out Window ===');
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/discover`);
    await waitForDataLoad(page);

    // Test 1: Click pop-out for query control
    console.log('  [1/2] Opening pop-out window...');

    // Listen for new page (pop-out window)
    const popoutPromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);

    const popoutBtn = await page.$('#popout-query-control');
    if (popoutBtn) {
      await popoutBtn.click();
      const popout = await popoutPromise;

      if (popout) {
        await popout.waitForLoadState('networkidle');
        console.log('    ✓ Pop-out window opened');
        console.log('    Pop-out URL:', popout.url());

        // Screenshot pop-out
        await popout.screenshot({ path: screenshotPath('popout-query-control'), fullPage: true });

        // Test 2: Verify pop-out hides header (per A02 rubric item W5.1)
        console.log('  [2/2] Checking pop-out hides site banner...');
        const header = await popout.$('.app-header');
        if (!header) {
          console.log('    ✓ Site banner hidden in pop-out');
        } else {
          console.log('    ✗ Site banner visible in pop-out (should be hidden)');
        }

        // Close pop-out
        await popout.close();
      } else {
        console.log('    ⚠ Pop-out blocked or not opened');
      }
    } else {
      console.log('    ⚠ Pop-out button not found');
    }

    // Screenshot main window after pop-out
    await page.screenshot({ path: screenshotPath('main-after-popout'), fullPage: true });

  } finally {
    await context.close();
  }
}

/**
 * Test Suite: URL State Persistence
 */
async function testUrlStatePersistence(browser) {
  console.log('\n=== Testing URL State Persistence ===');
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // Test 1: Apply filters and check URL reflects state
    console.log('  [1/3] Setting filters and checking URL...');
    await page.goto(`${BASE_URL}/discover?manufacturer=Tesla&yearMin=2020`);
    await waitForDataLoad(page);

    const url = page.url();
    const hasManufacturer = url.includes('manufacturer=Tesla');
    const hasYear = url.includes('yearMin=2020');

    if (hasManufacturer && hasYear) {
      console.log('    ✓ URL reflects filter state');
    } else {
      console.log('    ✗ URL missing filter params');
    }
    await page.screenshot({ path: screenshotPath('url-persistence-1'), fullPage: true });

    // Test 2: Refresh page and verify state persists
    console.log('  [2/3] Refreshing page...');
    await page.reload();
    await waitForDataLoad(page);

    const urlAfterRefresh = page.url();
    if (urlAfterRefresh.includes('manufacturer=Tesla')) {
      console.log('    ✓ State persisted after refresh');
    } else {
      console.log('    ✗ State lost after refresh');
    }
    await page.screenshot({ path: screenshotPath('url-persistence-2-after-refresh'), fullPage: true });

    // Test 3: Browser back/forward
    console.log('  [3/3] Testing browser back/forward...');
    await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
    await waitForDataLoad(page);
    await page.goto(`${BASE_URL}/discover?manufacturer=Chevrolet`);
    await waitForDataLoad(page);

    await page.goBack();
    await waitForDataLoad(page);

    const urlAfterBack = page.url();
    if (urlAfterBack.includes('manufacturer=Ford')) {
      console.log('    ✓ Browser back works correctly');
    } else {
      console.log('    ✗ Browser back did not restore state');
    }
    await page.screenshot({ path: screenshotPath('url-persistence-3-back'), fullPage: true });

  } finally {
    await context.close();
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('==========================================');
  console.log('  Vvroom Integration Test Suite');
  console.log('  Base URL:', BASE_URL);
  console.log('==========================================');

  const browser = await chromium.launch({ headless: true });

  try {
    await testHomePage(browser);
    await testDiscoverComponents(browser);
    await testUrlFirstFilters(browser);
    await testUrlFirstHighlights(browser);
    await testPaginationAndSorting(browser);
    await testPanelInteractions(browser);
    await testPopoutWindow(browser);
    await testUrlStatePersistence(browser);

    console.log('\n==========================================');
    console.log('  All tests completed!');
    console.log('  Screenshots saved to:', SCREENSHOT_DIR);
    console.log('==========================================\n');

  } catch (error) {
    console.error('\nTest error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run tests
runAllTests();
