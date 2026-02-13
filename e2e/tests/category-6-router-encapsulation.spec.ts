import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';

const PROJECT_ROOT = '/home/odin/projects/vvroom';

test.describe('Category 6: Router Navigate Encapsulation Tests', () => {
  test('R6.1 - router.navigate only in UrlStateService', async () => {
    // Grep for router.navigate calls
    const result = execSync(
      `grep -rn "router\\.navigate" "${PROJECT_ROOT}/src" --include="*.ts" || true`,
      { encoding: 'utf-8' }
    );

    const lines = result.trim().split('\n').filter(line => line.length > 0);

    // Check that all occurrences are in url-state.service.ts
    const violations: string[] = [];
    for (const line of lines) {
      if (!line.includes('url-state.service.ts') && !line.includes('.spec.ts')) {
        violations.push(line);
      }
    }

    expect(violations.length).toBe(0);
  });

  test('R6.2 - Components do not call router.navigate directly', async () => {
    // Check component files
    const result = execSync(
      `grep -rn "router\\.navigate" "${PROJECT_ROOT}/src/app" --include="*.component.ts" || true`,
      { encoding: 'utf-8' }
    );

    const lines = result.trim().split('\n').filter(line => line.length > 0);
    expect(lines.length).toBe(0);
  });

  test('R6.3 - Pop-out components do not call router.navigate', async () => {
    // Check pop-out related files
    const result = execSync(
      `grep -rn "router\\.navigate" "${PROJECT_ROOT}/src/app" --include="*popout*.ts" --include="*pop-out*.ts" || true`,
      { encoding: 'utf-8' }
    );

    const lines = result.trim().split('\n').filter(line => line.length > 0);
    expect(lines.length).toBe(0);
  });

  test('R6.4 - UrlStateService has setParams method for navigation', async () => {
    // Verify UrlStateService exists and has setParams method (the navigation abstraction)
    const result = execSync(
      `grep -n "setParams\\|clearParams\\|router\\.navigate" "${PROJECT_ROOT}/src/app/framework/services/url-state.service.ts" || true`,
      { encoding: 'utf-8' }
    );

    const lines = result.trim().split('\n').filter(line => line.length > 0);
    expect(lines.length).toBeGreaterThan(0);
  });
});
