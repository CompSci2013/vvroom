# Kickoff Prompt: Textbook Quality Testing

## Instructions

You are conducting quality verification testing for the vvroom application. Your task is to systematically execute tests from the test rubric and document each result.

## Playwright Test Philosophy

**All tests run headless.** No headed browser mode for automated testing.

**Tests should ONLY:**
- Navigate to URLs
- Click buttons, icons, or links
- Enter text into input controls
- Verify the URL changed as expected
- Capture screenshots for visual verification

**Tests should NOT:**
- Iterate through table rows to verify content
- Extract and sort data to verify ordering
- Monitor network requests
- Implement business logic that the application should handle
- Compare text content between windows programmatically

**Why:** If a test is doing what the application should be doing, it's a bad test. Trust the screenshot to verify visual correctness. The URL is the source of truth.

## Test Artifacts

Each test produces three artifacts:
1. **URL assertion** - Test passes/fails based on URL containing expected parameters
2. **Screenshot** - PNG in `e2e/screenshots/` with URL bar visible
3. **Journal entry** - Timestamped entry in quality-journal.md

## Critical Requirements

**IMPORTANT: Screenshot Verification is Mandatory**

A test is NOT complete until you have visually inspected the screenshot. The Playwright test passing only means the code executed without errors - it does NOT verify the visual output is correct.

**After EVERY individual test:**
1. Run the Playwright test
2. **USE THE READ TOOL TO INSPECT THE SCREENSHOT IMAGE**
3. Verify the screenshot meets all criteria for that test (see test-rubric.md)
4. Only after visual verification, append a timestamped entry to `~/projects/vvroom/textbook-quality/quality-journal.md`
5. Format: `YYYY-MM-DD_HH:MM:SS` followed by test result on next line
6. Include test ID, pass/fail status, and what you observed in the screenshot

**After each SUCCESSFUL test verified by screenshot inspection:**
1. Commit the work with descriptive message
2. Push to all remote repositories
3. Add timestamped entry documenting the commit

## Startup Sequence

1. Read the first 11 lines of `~/projects/vvroom/textbook-quality/quality-journal.md`
2. Tail the last 150 lines to remember where you left off
3. Read `~/projects/vvroom/textbook-quality/quality-instructions.md`
4. Read `~/projects/vvroom/textbook-quality/test-rubric.md`
5. Read `~/projects/vvroom/textbook-quality/panel-visibility-reference.md`

## Test Execution Order

Execute tests in category order:

| Priority | Category | Test IDs | Focus |
|----------|----------|----------|-------|
| 1 | Visual Appearance | V1.1.x - V1.5.x | Component rendering |
| 2 | URL-First Conformity | U2.1.x - U2.3.x | State ↔ URL sync |
| 3 | URL Change Consistency | U3.1.x - U3.3.x | Browser navigation |
| 4 | Pop-Out Behavior | P4.1.x - P4.5.x | Pop-out functionality |
| 5 | Cross-Window Sync | S5.1.x - S5.3.x | BroadcastChannel |
| 6 | Router Encapsulation | R6.1 - R6.4 | Code analysis |
| 7 | Error Handling | E7.1 - E7.7 | Edge cases |
| 8 | Visual Verification | VS8.1.x - VS8.4.x | Screenshot tests |

## Journal Entry Format

Each entry must document what you **observed in the screenshot**, not just that the test ran:

```markdown
YYYY-MM-DD_HH:MM:SS
Test V1.1.1 - Results table default render: PASS
Screenshot: results-table-default.png
Verified: URL bar shows /discover, table visible with data rows, pagination shows "Showing 1 to 20"

YYYY-MM-DD_HH:MM:SS
Test V1.3.1 - Statistics highlight Tesla: PASS
Screenshot: statistics-highlight-tesla.png
Verified: Query Control expanded showing "Highlight Manufacturer: Tesla" chip,
Statistics panel shows 4 charts with Tesla bars highlighted in blue,
Query Panel/Picker/Results Table collapsed

YYYY-MM-DD_HH:MM:SS
Test P4.1.1 - Pop-out results table: FAIL
Screenshot: results-table-popout.png
Issue: Site header still visible in pop-out window (should be hidden)
Action needed: Fix pop-out CSS to hide header
```

## Test Environment Setup

**Running tests is simple - Playwright handles the server automatically:**

```bash
cd ~/projects/vvroom

# Run all tests (Playwright auto-starts dev server on 4228)
npx playwright test

# Run specific category
npx playwright test --grep "Category 1"

# Run single test by ID
npx playwright test --grep "V1.1.1"
```

**Optional: Verify API is accessible before testing:**

```bash
curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1
```

**Important:** Do NOT manually start the server with `--configuration=production`. Production mode disables `data-testid` attributes. Playwright's `webServer` config automatically starts the dev server correctly.

## Screenshot Requirements

All screenshots must:
- Include full browser URL bar at top of image
- Use naming convention from test-rubric.md
- Be saved to designated screenshots directory
- **Show correct panel visibility per panel-visibility-reference.md**

## Panel Visibility (Critical)

Each test specifies which panels should be **expanded** vs **collapsed** to properly demonstrate URL-First behavior. See `panel-visibility-reference.md` for the complete reference.

**Key Principles:**
1. **Show what the URL controls** - Expanded panels demonstrate the URL parameter is being applied
2. **Collapse the noise** - Panels not relevant to the test should be collapsed
3. **Query Control for state indication** - Shows active filters/highlights as chips
4. **Statistics for data visualization** - Shows filtered/highlighted data in charts
5. **Results Table for sort/pagination** - Shows data order and page state

## Real Test Data Values

Use these values in tests (from test-data/README.md):

**Manufacturers:** Ford, Chevrolet, Tesla, Dodge, Jeep, GMC, Buick
**Body Classes:** Sedan, SUV, Pickup, Coupe, Van, Hatchback
**Year Range:** 1908-2024
**URL Parameters:** `sortBy`/`sortOrder` (NOT `sort`/`sortDirection`)

## Begin Testing

Start by executing:

```
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/quality-instructions.md
Read ~/projects/vvroom/textbook-quality/test-rubric.md
Read ~/projects/vvroom/textbook-quality/panel-visibility-reference.md
```

Then begin with Category 1: Visual Appearance Tests, starting with test V1.1.1.

**Remember:** Document EVERY test result in the journal immediately after execution.
