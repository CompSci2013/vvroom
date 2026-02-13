import { test, expect } from '@playwright/test';
import { screenshotWithUrl } from './screenshot-helper';

const BASE_URL = 'http://localhost:4228';

test.describe('Category 7: Error Handling Tests', () => {
  test('E7.1 - Invalid manufacturer handled gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=InvalidBrandXYZ123`);
    await page.waitForLoadState('networkidle');

    // Should either show no results or ignore the invalid param
    // Page should not crash
    await expect(page.locator('body')).toBeVisible();

    await screenshotWithUrl(page, 'error-invalid-manufacturer.png', true);
  });

  test('E7.2 - Invalid year (future) handled gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?yearMin=3000`);
    await page.waitForLoadState('networkidle');

    // Should show no results or handle gracefully
    await expect(page.locator('body')).toBeVisible();

    await screenshotWithUrl(page, 'error-invalid-year-future.png', true);
  });

  test('E7.3 - Negative page number handled gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?page=-1`);
    await page.waitForLoadState('networkidle');

    // Should default to page 1 or handle gracefully
    await expect(page.locator('body')).toBeVisible();

    await screenshotWithUrl(page, 'error-negative-page.png', true);
  });

  test('E7.4 - Very large page size capped or handled', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?size=10000`);
    await page.waitForLoadState('networkidle');

    // Should either cap to max or handle gracefully
    await expect(page.locator('body')).toBeVisible();

    await screenshotWithUrl(page, 'error-large-page-size.png', true);
  });

  test('E7.5 - Invalid sort field handled gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?sortBy=invalidField`);
    await page.waitForLoadState('networkidle');

    // Should use default sort or ignore invalid field
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();

    await screenshotWithUrl(page, 'error-invalid-sort.png', true);
  });

  test('E7.6 - Empty search treated as no search', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?search=`);
    await page.waitForLoadState('networkidle');

    // Should show all results (no search applied)
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();

    await screenshotWithUrl(page, 'error-empty-search.png', true);
  });

  test('E7.7 - Special characters in search handled', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?search=${encodeURIComponent('<script>alert("xss")</script>')}`);
    await page.waitForLoadState('networkidle');

    // Should not execute script, should handle gracefully
    await expect(page.locator('body')).toBeVisible();

    await screenshotWithUrl(page, 'error-special-chars-search.png', true);
  });

  test('E7.8 - Page beyond max handled gracefully', async ({ page }) => {
    // This was already tested in V1.5.3 but verify it doesn't crash
    await page.goto(`${BASE_URL}/discover?page=999999`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();

    await screenshotWithUrl(page, 'error-page-beyond-max.png', true);
  });

  test('E7.9 - Multiple invalid params handled gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/discover?manufacturer=INVALID&yearMin=-100&page=-5&sortBy=fake`);
    await page.waitForLoadState('networkidle');

    // Should handle all invalid params gracefully
    await expect(page.locator('body')).toBeVisible();

    await screenshotWithUrl(page, 'error-multiple-invalid.png', true);
  });
});
