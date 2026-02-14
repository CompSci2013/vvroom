# Kickoff Prompt: Textbook Quality Testing

## Instructions

You are conducting quality verification testing for the vvroom application. Your task is to systematically execute tests from the test rubric and document each result.

**CRITICAL: This prompt covers ONE CATEGORY only.** Do not attempt to complete all 8 categories in a single session. Each category should be a separate session to prevent context loss.

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
2. **Screenshot** - PNG in `e2e/screenshots/` with test ID prefix (e.g., `V1.1.1-results-table-default.png`)
3. **Journal entry** - Timestamped entry in quality-journal.md

## Checklist-Driven Execution

**You MUST use the checklist file to track progress:**

1. Read `~/projects/vvroom/textbook-quality/test-checklist.md`
2. Find the current subsection you are working on
3. For each test in the subsection:
   - Write and run the Playwright test
   - Verify the screenshot with the Read tool
   - Mark the checkbox `[x]` in test-checklist.md
   - Add screenshot filename and commit hash to the row
4. **After completing a subsection**, run the verification command shown
5. **Do not proceed to the next subsection** until verification passes

## Batch-by-Subsection Workflow

Execute tests in small batches by subsection, NOT by entire category:

### Category 1 Subsections (execute in order):
1. V1.1.x (5 tests) → commit → verify → proceed
2. V1.2.x (5 tests) → commit → verify → proceed
3. V1.3.x (4 tests) → commit → verify → proceed
4. V1.4.x (3 tests) → commit → verify → proceed
5. V1.5.x (3 tests) → commit → verify → proceed
6. V1.6.x (6 tests) → commit → verify → proceed
7. V1.7.x (7 tests) → commit → verify → proceed
8. V1.8.x (3 tests) → commit → verify → proceed
9. V1.9.x (5 tests) → commit → verify → CATEGORY COMPLETE

### After Each Subsection:
```bash
# Example for V1.1.x - verify 5 screenshots exist with correct prefix
ls e2e/screenshots/V1.1.* | wc -l  # Should output: 5

# If count is wrong, identify missing tests:
for id in V1.1.1 V1.1.2 V1.1.3 V1.1.4 V1.1.5; do
  ls e2e/screenshots/${id}-*.png 2>/dev/null || echo "MISSING: $id"
done
```

### After Each Category:
```bash
# Verify all spec tests match rubric test IDs
grep -oE "test\('[A-Z0-9.]+'" e2e/tests/category-1-*.spec.ts | wc -l
# Compare against rubric count for that category
```

## Critical Requirements

**IMPORTANT: Screenshot Verification is Mandatory**

A test is NOT complete until you have visually inspected the screenshot. The Playwright test passing only means the code executed without errors - it does NOT verify the visual output is correct.

**After EVERY individual test:**
1. Run the Playwright test
2. **USE THE READ TOOL TO INSPECT THE SCREENSHOT IMAGE**
3. Verify the screenshot meets all criteria for that test (see test-rubric.md)
4. Update test-checklist.md with `[x]` and screenshot filename
5. Append a timestamped entry to `~/projects/vvroom/textbook-quality/quality-journal.md`
6. Format: `YYYY-MM-DD_HH:MM:SS` followed by test result on next line
7. Include test ID, pass/fail status, and what you observed in the screenshot
8. **RE-READ THIS CHECKLIST (steps 1-8) before proceeding to the next test**

**STOP. Do not proceed to the next test until steps 1-8 are complete.**

**After completing a SUBSECTION (not individual test):**
1. Run subsection verification command
2. Commit the work with descriptive message referencing subsection (e.g., "Complete V1.1.x default state tests")
3. Push to all remote repositories
4. Add timestamped commit entry to journal
5. Update test-checklist.md with commit hash for all tests in subsection

## Startup Sequence

1. Read `~/projects/vvroom/textbook-quality/test-checklist.md` (find current position)
2. Read the first 11 lines of `~/projects/vvroom/textbook-quality/quality-journal.md`
3. Tail the last 150 lines of quality-journal.md to remember where you left off
4. Read `~/projects/vvroom/textbook-quality/test-rubric.md`
5. Read `~/projects/vvroom/textbook-quality/panel-visibility-reference.md`

## Test Execution Order

Execute tests in category order, one category per session:

| Priority | Category | Subsections | Total Tests |
|----------|----------|-------------|-------------|
| 1 | Visual Appearance | V1.1.x through V1.9.x | 41 |
| 2 | URL-First Conformity | U2.1.x through U2.3.x | 22 |
| 3 | URL Change Consistency | U3.1.x through U3.3.x | 14 |
| 4 | Pop-Out Behavior | P4.1.x through P4.5.x | 21 |
| 5 | Cross-Window Sync | S5.1.x through S5.3.x | 10 |
| 6 | Router Encapsulation | R6.1 through R6.4 | 4 |
| 7 | Error Handling | E7.1 through E7.7 | 7 |
| 8 | Visual Verification | VS8.1.x through VS8.4.x | 15 |

**TOTAL: 134 tests** (141 test IDs minus duplicates)

## Journal Entry Format

Each entry must document what you **observed in the screenshot**, not just that the test ran:

```markdown
YYYY-MM-DD_HH:MM:SS
Test V1.1.1 - Results table default render: PASS
Screenshot: V1.1.1-results-table-default.png
Verified: URL bar shows /discover, table visible with data rows, pagination shows "Showing 1 to 20"

YYYY-MM-DD_HH:MM:SS
Test V1.3.1 - Statistics highlight Tesla: PASS
Screenshot: V1.3.1-statistics-highlight-tesla.png
Verified: Query Control expanded showing "Highlight Manufacturer: Tesla" chip,
Statistics panel shows 4 charts with Tesla bars highlighted in blue,
Query Panel/Picker/Results Table collapsed

YYYY-MM-DD_HH:MM:SS
Test P4.1.1 - Pop-out results table: FAIL
Screenshot: P4.1.1-results-table-popout.png
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

# Run subsection
npx playwright test --grep "V1.1"
```

**Optional: Verify API is accessible before testing:**

```bash
curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1
```

**Important:** Do NOT manually start the server with `--configuration=production`. Production mode disables `data-testid` attributes. Playwright's `webServer` config automatically starts the dev server correctly.

## Screenshot Requirements

All screenshots must:
- Include full browser URL bar at top of image
- **Be named with test ID prefix** (e.g., `V1.1.1-results-table-default.png`, `U2.1.3-bodyclass-pickup.png`)
- Be saved to `e2e/screenshots/` directory
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
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md
Read ~/projects/vvroom/textbook-quality/panel-visibility-reference.md
```

Then begin with the first incomplete subsection found in test-checklist.md.

**Remember:**
- Document EVERY test result in the journal immediately after execution
- Update test-checklist.md after every test
- Commit after every subsection, not after every test
- Run verification commands before proceeding to next subsection

**CRITICAL: Re-read this file after each subsection commit.** After completing a subsection and pushing, re-read `~/projects/vvroom/textbook-quality/kickoff-prompt.md` to refresh your memory of the required procedures. This prevents format drift during testing sessions.

**CRITICAL: Do not proceed to the next category.** When you complete all subsections in a category, STOP and inform the user. The next category should be a new session.
