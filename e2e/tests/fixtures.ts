import { test as base, expect } from '@playwright/test';

/**
 * Hermetic e2e base test.
 *
 * The app loads user preferences from a shared backend (`/api/preferences/v1/default`,
 * userId hard-coded to 'default'). That shared record is STALE — it collapses
 * `basic-results-table` and lists panel IDs from a prior app version — so the results
 * table never mounts and every data-dependent test times out on
 * `[data-testid="dynamic-results-table"]`.
 *
 * This was masked while the `/api` proxy was unwired (the prefs call failed → the app
 * used its clean expanded code-defaults, matching the committed reference screenshots).
 * Wiring the proxy for data also surfaced the stale prefs.
 *
 * Fix: intercept the preferences API for every test and return `{}` so the app uses its
 * clean defaults (expanded panels, default panelOrder incl. basic-results-table). POSTs
 * are absorbed too, so tests that toggle/save panel state never pollute the backend and
 * runs stay deterministic. Non-destructive — the backend is never mutated.
 */
export const test = base.extend({
  // Route at the CONTEXT level so it also covers pop-out windows and any
  // context.newPage() a test opens (e.g. URL-sharing / popped-out picker tests),
  // not just the initial page.
  context: async ({ context }, use) => {
    await context.route('**/api/preferences/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );
    await use(context);
  },
});

export { expect };
