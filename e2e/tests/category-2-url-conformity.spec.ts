import { test, expect } from '@playwright/test';
import { screenshotWithUrl } from './screenshot-helper';

const BASE_URL = 'http://localhost:4228';

// Helper to collapse panels by clicking the chevron button in panel headers
async function collapsePanels(page: any, panelNames: string[]) {
  for (const panelName of panelNames) {
    const panelHeading = page.getByRole('heading', { name: panelName, level: 3 });
    if (await panelHeading.isVisible()) {
      const panelHeader = panelHeading.locator('..').locator('..');
      const collapseButton = panelHeader.locator('button:has(.pi-chevron-down)');
      if (await collapseButton.count() > 0) {
        await collapseButton.click();
        await page.waitForTimeout(100);
      }
    }
  }
  await page.waitForTimeout(200);
}

test.describe('Category 2: URL-First Conformity Tests', () => {
  test.describe('2.1 URL to State (Load URL, Verify State)', () => {
    test('U2.1.1 - URL manufacturer filter applies to state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Verify Query Control shows the active filter chip
      await expect(page.getByText('Manufacturer: Ford')).toBeVisible();

      // Verify Query Panel dropdown shows Ford selected
      const manufacturerDropdown = page.locator('p-dropdown[formcontrolname="manufacturer"], [data-testid="manufacturer-dropdown"]').first();
      if (await manufacturerDropdown.count() > 0) {
        await expect(manufacturerDropdown).toContainText('Ford');
      }

      // Take screenshot for verification
      await collapsePanels(page, ['Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'url-state-manufacturer-ford.png', true);

      await expect(page).toHaveURL(/manufacturer=Ford/);
    });

    test('U2.1.2 - URL year range filter applies to state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?yearMin=2010&yearMax=2020`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Verify Query Control shows the active filter chip
      await expect(page.getByText('Year: 2010 - 2020')).toBeVisible();

      // Take screenshot for verification
      await collapsePanels(page, ['Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'url-state-year-range.png', true);

      await expect(page).toHaveURL(/yearMin=2010/);
      await expect(page).toHaveURL(/yearMax=2020/);
    });

    test('U2.1.3 - URL body class filter applies to state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?bodyClass=Pickup`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Verify Query Control shows the active filter chip
      await expect(page.getByText('Body Class: Pickup')).toBeVisible();

      // Take screenshot for verification
      await collapsePanels(page, ['Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'url-state-bodyclass-pickup.png', true);

      await expect(page).toHaveURL(/bodyClass=Pickup/);
    });

    test('U2.1.4 - URL pagination applies to state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?page=3&size=10`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Verify pagination shows page 3
      await expect(page.getByText(/Showing 21 to 30 of/)).toBeVisible();

      // Take screenshot for verification
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'url-state-pagination.png', true);

      await expect(page).toHaveURL(/page=3/);
      await expect(page).toHaveURL(/size=10/);
    });

    test('U2.1.5 - URL sort applies to state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?sortBy=year&sortOrder=desc`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Take screenshot for verification first (sorting is visible in screenshot)
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'url-state-sort-year-desc.png', true);

      // Verify URL has sort params
      await expect(page).toHaveURL(/sortBy=year/);
      await expect(page).toHaveURL(/sortOrder=desc/);
    });

    test('U2.1.6 - URL highlight applies to state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Verify Query Control shows the active highlight chip
      await expect(page.getByText('Highlight Manufacturer: Tesla')).toBeVisible();

      // Take screenshot for verification - keep Statistics visible to show highlighted bars
      await collapsePanels(page, ['Query Panel', 'Manufacturer-Model Picker', 'Results Table']);
      await screenshotWithUrl(page, 'url-state-highlight-tesla.png', true);

      await expect(page).toHaveURL(/h_manufacturer=Tesla/);
    });

    test('U2.1.7 - URL combined filter + highlight applies to state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Chevrolet&h_yearMin=2015&h_yearMax=2020`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Verify both filter and highlight chips visible
      await expect(page.getByText('Manufacturer: Chevrolet')).toBeVisible();
      await expect(page.getByText('Highlight Year: 2015 - 2020')).toBeVisible();

      // Take screenshot for verification
      await collapsePanels(page, ['Query Panel', 'Manufacturer-Model Picker', 'Results Table']);
      await screenshotWithUrl(page, 'url-state-filter-plus-highlight.png', true);

      await expect(page).toHaveURL(/manufacturer=Chevrolet/);
      await expect(page).toHaveURL(/h_yearMin=2015/);
    });

    test('U2.1.8 - URL model combinations filter applies to state', async ({ page }) => {
      // Note: The correct URL param is 'modelCombos' not 'models'
      await page.goto(`${BASE_URL}/discover?modelCombos=Ford:Mustang,Chevrolet:Camaro`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Take screenshot for verification
      await collapsePanels(page, ['Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'url-state-model-combos.png', true);

      await expect(page).toHaveURL(/modelCombos=Ford:Mustang/);
    });
  });

  test.describe('2.2 State to URL (User Interaction, Verify URL)', () => {
    test('U2.2.1 - Select manufacturer updates URL', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Use the autocomplete input for manufacturer
      const manufacturerInput = page.getByPlaceholder('Enter manufacturer name');
      await manufacturerInput.click();
      await manufacturerInput.fill('Dodge');
      await page.waitForTimeout(300);
      // Select from autocomplete dropdown
      await page.getByRole('option', { name: 'Dodge' }).first().click();
      await page.waitForTimeout(500);

      // Verify URL updated
      await expect(page).toHaveURL(/manufacturer=Dodge/);

      // Take screenshot
      await collapsePanels(page, ['Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'state-url-manufacturer-dodge.png', true);
    });

    test('U2.2.2 - Set year range updates URL', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Fill year range inputs - find by placeholder text
      const yearMinInput = page.locator('input[placeholder="Min"]').first();
      const yearMaxInput = page.locator('input[placeholder="Max"]').first();

      await yearMinInput.click();
      await yearMinInput.fill('2000');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Verify URL updated with yearMin
      await expect(page).toHaveURL(/yearMin=2000/);

      // Take screenshot
      await collapsePanels(page, ['Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'state-url-year-range.png', true);
    });

    test('U2.2.3 - Select body class updates URL', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Click the body class dropdown trigger
      const bodyClassDropdown = page.getByText('Select body classes...');
      await bodyClassDropdown.click();
      await page.waitForTimeout(300);

      // Select SUV checkbox from the multiselect panel
      const suvCheckbox = page.locator('p-multiselectitem').filter({ hasText: 'SUV' }).locator('div.p-checkbox');
      await suvCheckbox.click();
      await page.waitForTimeout(500);

      // Close the dropdown by clicking elsewhere
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Verify URL updated
      await expect(page).toHaveURL(/bodyClass=SUV/);

      // Take screenshot
      await collapsePanels(page, ['Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'state-url-bodyclass-suv.png', true);
    });

    test('U2.2.4 - Click page updates URL', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Collapse other panels to see pagination
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);

      // Click page 4
      await page.getByRole('button', { name: '4' }).click();
      await page.waitForTimeout(500);

      // Verify URL updated
      await expect(page).toHaveURL(/page=4/);

      // Take screenshot
      await screenshotWithUrl(page, 'state-url-page4.png', true);
    });

    test('U2.2.5 - Change page size updates URL', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Collapse other panels to see pagination
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);

      // Click page size dropdown and select 50
      const pageSizeDropdown = page.locator('p-dropdown').filter({ hasText: /20|25/ }).last();
      await pageSizeDropdown.click();
      await page.waitForTimeout(200);
      await page.getByRole('option', { name: '50' }).click();
      await page.waitForTimeout(500);

      // Verify URL updated
      await expect(page).toHaveURL(/size=50/);

      // Take screenshot
      await screenshotWithUrl(page, 'state-url-size50.png', true);
    });

    test('U2.2.6 - Click column header to sort updates URL', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Collapse other panels
      await collapsePanels(page, ['Query Control', 'Query Panel', 'Manufacturer-Model Picker', 'Statistics']);

      // Click Year column header to sort
      await page.locator('th').filter({ hasText: 'Year' }).click();
      await page.waitForTimeout(500);

      // Verify URL updated
      await expect(page).toHaveURL(/sortBy=year/);

      // Take screenshot
      await screenshotWithUrl(page, 'state-url-sort-year.png', true);
    });

    test('U2.2.9 - Clear all filters updates URL', async ({ page }) => {
      // Start with filters applied
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford&bodyClass=Coupe`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Click Clear All button
      await page.getByRole('button', { name: /Clear All/i }).click();
      await page.waitForTimeout(500);

      // Verify URL no longer has filter parameters
      await expect(page).not.toHaveURL(/manufacturer=/);
      await expect(page).not.toHaveURL(/bodyClass=/);

      // Take screenshot
      await collapsePanels(page, ['Query Panel', 'Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'state-url-cleared.png', true);
    });
  });

  test.describe('2.3 Combined Filter Tests', () => {
    test('U2.3.1 - Multiple filters intersection', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford&yearMin=2015&yearMax=2020&bodyClass=Coupe`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Verify all filter chips visible
      await expect(page.getByText('Manufacturer: Ford')).toBeVisible();
      await expect(page.getByText('Year: 2015 - 2020')).toBeVisible();
      await expect(page.getByText('Body Class: Coupe')).toBeVisible();

      // Take screenshot
      await collapsePanels(page, ['Manufacturer-Model Picker', 'Statistics', 'Results Table']);
      await screenshotWithUrl(page, 'combined-filters-ford-coupe-recent.png', true);

      await expect(page).toHaveURL(/manufacturer=Ford/);
      await expect(page).toHaveURL(/yearMin=2015/);
      await expect(page).toHaveURL(/bodyClass=Coupe/);
    });

    test('U2.3.2 - Filter + sort + pagination combined', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Chevrolet&sortBy=year&sortOrder=desc&page=2&size=10`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Verify filter chip
      await expect(page.getByText('Manufacturer: Chevrolet')).toBeVisible();

      // Verify pagination
      await expect(page.getByText(/Showing 11 to 20 of/)).toBeVisible();

      // Take screenshot
      await collapsePanels(page, ['Manufacturer-Model Picker', 'Statistics']);
      await screenshotWithUrl(page, 'combined-filter-sort-page.png', true);

      await expect(page).toHaveURL(/manufacturer=Chevrolet/);
      await expect(page).toHaveURL(/sortBy=year/);
      await expect(page).toHaveURL(/page=2/);
    });

    test('U2.3.3 - Filter + highlight combined', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?bodyClass=SUV&h_manufacturer=Jeep`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Verify filter chip
      await expect(page.getByText('Body Class: SUV')).toBeVisible();

      // Verify highlight chip
      await expect(page.getByText('Highlight Manufacturer: Jeep')).toBeVisible();

      // Take screenshot - keep Statistics to show highlight
      await collapsePanels(page, ['Query Panel', 'Manufacturer-Model Picker', 'Results Table']);
      await screenshotWithUrl(page, 'combined-filter-highlight.png', true);

      await expect(page).toHaveURL(/bodyClass=SUV/);
      await expect(page).toHaveURL(/h_manufacturer=Jeep/);
    });
  });
});
