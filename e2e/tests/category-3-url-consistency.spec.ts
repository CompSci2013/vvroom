import { test, expect } from '@playwright/test';
import { screenshotWithUrl } from './screenshot-helper';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 3: URL Change Consistency Tests', () => {
  test.describe('3.1 Browser Navigation', () => {
    test('U3.1.1 - Browser back restores previous filter', async ({ page }) => {
      // Start with no filter
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await page.locator('table').first().waitFor({ state: 'visible', timeout: 10000 });

      // Navigate to Ford filter
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/manufacturer=Ford/);

      // Navigate to Chevrolet filter
      await page.goto(`${BASE_URL}/discover?manufacturer=Chevrolet`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/manufacturer=Chevrolet/);

      // Click browser back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Should restore Ford filter
      await expect(page).toHaveURL(/manufacturer=Ford/);
      await expect(page.getByText('Manufacturer: Ford')).toBeVisible();

      await screenshotWithUrl(page, 'browser-back-ford-restored.png', true);
    });

    test('U3.1.2 - Browser back/forward through pagination', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');

      // Navigate to page 3
      await page.goto(`${BASE_URL}/discover?page=3`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/page=3/);

      // Navigate to page 5
      await page.goto(`${BASE_URL}/discover?page=5`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/page=5/);

      // Click back - should go to page 3
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/page=3/);

      // Click back again - should go to page 1 (no page param)
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/page=/);

      await screenshotWithUrl(page, 'browser-back-pagination.png', true);
    });

    test('U3.1.3 - Browser back removes filter but keeps sort', async ({ page }) => {
      // Start with sort
      await page.goto(`${BASE_URL}/discover?sortBy=year&sortOrder=desc`);
      await page.waitForLoadState('networkidle');

      // Add filter
      await page.goto(`${BASE_URL}/discover?sortBy=year&sortOrder=desc&manufacturer=Ford`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/manufacturer=Ford/);

      // Click back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Sort should remain, filter should be gone
      await expect(page).toHaveURL(/sortBy=year/);
      await expect(page).not.toHaveURL(/manufacturer=/);

      await screenshotWithUrl(page, 'browser-back-sort-remains.png', true);
    });

    test('U3.1.4 - Browser back removes highlight', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');

      // Add highlight
      await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/h_manufacturer=Tesla/);

      // Click back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Highlight should be removed
      await expect(page).not.toHaveURL(/h_manufacturer/);

      await screenshotWithUrl(page, 'browser-back-highlight-removed.png', true);
    });

    test('U3.1.5 - Browser back restores filters after clear', async ({ page }) => {
      // Start with filters
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford&bodyClass=Coupe`);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/manufacturer=Ford/);

      // Navigate to cleared state
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/manufacturer=/);

      // Click back - filters should be restored
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/manufacturer=Ford/);
      await expect(page).toHaveURL(/bodyClass=Coupe/);

      await screenshotWithUrl(page, 'browser-back-filters-restored.png', true);
    });

    test('U3.1.6 - Browser forward restores state', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');

      await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
      await page.waitForLoadState('networkidle');

      await page.goto(`${BASE_URL}/discover?manufacturer=Chevrolet`);
      await page.waitForLoadState('networkidle');

      // Go back twice
      await page.goBack();
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/manufacturer=/);

      // Go forward
      await page.goForward();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/manufacturer=Ford/);

      // Go forward again
      await page.goForward();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/manufacturer=Chevrolet/);

      await screenshotWithUrl(page, 'browser-forward-works.png', true);
    });
  });

  test.describe('3.2 Manual URL Edits', () => {
    test('U3.2.1 - Change manufacturer in URL bar', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Manufacturer: Ford')).toBeVisible();

      // Navigate to different manufacturer
      await page.goto(`${BASE_URL}/discover?manufacturer=Dodge`);
      await page.waitForLoadState('networkidle');

      // Verify state updated
      await expect(page.getByText('Manufacturer: Dodge')).toBeVisible();
      await expect(page).toHaveURL(/manufacturer=Dodge/);

      await screenshotWithUrl(page, 'url-edit-manufacturer.png', true);
    });

    test('U3.2.2 - Add year filter to existing URL', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
      await page.waitForLoadState('networkidle');

      // Add year filter
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford&yearMin=2010`);
      await page.waitForLoadState('networkidle');

      // Both filters should be active
      await expect(page.getByText('Manufacturer: Ford')).toBeVisible();
      await expect(page).toHaveURL(/yearMin=2010/);

      await screenshotWithUrl(page, 'url-edit-add-year.png', true);
    });

    test('U3.2.3 - Remove page param returns to page 1', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?page=3`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/Showing 41 to 60 of/).first()).toBeVisible();

      // Remove page param
      await page.goto(`${BASE_URL}/discover`);
      await page.waitForLoadState('networkidle');

      // Should be on page 1
      await expect(page.getByText(/Showing 1 to 20 of/).first()).toBeVisible();

      await screenshotWithUrl(page, 'url-edit-remove-page.png', true);
    });

    test('U3.2.4 - Change sort direction in URL', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?sortBy=year&sortOrder=asc`);
      await page.waitForLoadState('networkidle');

      // Change to desc
      await page.goto(`${BASE_URL}/discover?sortBy=year&sortOrder=desc`);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/sortOrder=desc/);

      await screenshotWithUrl(page, 'url-edit-sort-direction.png', true);
    });

    test('U3.2.5 - Paste completely new URL with filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/discover?manufacturer=Ford`);
      await page.waitForLoadState('networkidle');

      // Paste completely different URL
      await page.goto(`${BASE_URL}/discover?bodyClass=SUV&h_manufacturer=Jeep&page=2`);
      await page.waitForLoadState('networkidle');

      // All new params should be applied
      await expect(page.getByText('Body Class: SUV')).toBeVisible();
      await expect(page.getByText('Highlight Manufacturer: Jeep')).toBeVisible();
      await expect(page).toHaveURL(/page=2/);

      await screenshotWithUrl(page, 'url-paste-new-filters.png', true);
    });
  });

  test.describe('3.3 URL Sharing', () => {
    test('U3.3.1 - URL with filters loads correctly in new context', async ({ browser }) => {
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();

      // Load URL with filters
      await page1.goto(`${BASE_URL}/discover?manufacturer=Ford&yearMin=2015&yearMax=2020`);
      await page1.waitForLoadState('networkidle');

      // Verify filters are applied
      await expect(page1.getByText('Manufacturer: Ford')).toBeVisible();
      await expect(page1.getByText('Year: 2015 - 2020')).toBeVisible();

      // Open same URL in new context (simulates sharing)
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      await page2.goto(`${BASE_URL}/discover?manufacturer=Ford&yearMin=2015&yearMax=2020`);
      await page2.waitForLoadState('networkidle');

      // Same state in new context
      await expect(page2.getByText('Manufacturer: Ford')).toBeVisible();
      await expect(page2.getByText('Year: 2015 - 2020')).toBeVisible();

      await screenshotWithUrl(page2, 'url-sharing-filters.png', true);

      await context1.close();
      await context2.close();
    });

    test('U3.3.2 - URL with highlights loads correctly', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/discover?h_manufacturer=Tesla`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText('Highlight Manufacturer: Tesla')).toBeVisible();

      await screenshotWithUrl(page, 'url-sharing-highlights.png', true);

      await context.close();
    });

    test('U3.3.3 - URL with pagination loads correctly', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${BASE_URL}/discover?page=5&size=10`);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/Showing 41 to 50 of/)).toBeVisible();

      await screenshotWithUrl(page, 'url-sharing-pagination.png', true);

      await context.close();
    });
  });
});
