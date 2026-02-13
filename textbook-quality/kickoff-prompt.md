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

**After EVERY individual test:**
1. Append a timestamped entry to `~/projects/vvroom/textbook-quality/quality-journal.md`
2. Format: `YYYY-MM-DD_HH:MM:SS` followed by test result on next line
3. Include test ID, pass/fail status, and brief notes

**After each SUCCESSFUL test verified by Playwright screenshot:**
1. Commit the work with descriptive message
2. Push to all remote repositories
3. Add timestamped entry documenting the commit

## Startup Sequence

1. Read the first 11 lines of `~/projects/vvroom/textbook-quality/quality-journal.md`
2. Tail the last 150 lines to remember where you left off
3. Read `~/projects/vvroom/textbook-quality/quality-instructions.md`
4. Read `~/projects/vvroom/textbook-quality/test-rubric.md`

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

```markdown
YYYY-MM-DD_HH:MM:SS
Test V1.1.1 - Results table default render: PASS
Screenshot captured: results-table-default.png

YYYY-MM-DD_HH:MM:SS
Test U2.1.1 - URL ?manufacturer=Ford loads correctly: PASS
Verified: dropdown shows Ford, table filtered, URL matches

YYYY-MM-DD_HH:MM:SS
Test P4.1.1 - Pop-out results table: FAIL
Issue: Site header still visible in pop-out window
Action needed: Fix pop-out CSS to hide header
```

## Test Environment Setup

Before starting tests, verify:

```bash
# Terminal 1: Start development server
cd ~/projects/vvroom
ng serve --port 4207

# Terminal 2: Start test server (for Playwright)
ng serve --configuration=production --port 4228

# Verify API is accessible
curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1
```

## Screenshot Requirements

All screenshots must:
- Include full browser URL bar at top of image
- Use naming convention from test-rubric.md
- Be saved to designated screenshots directory

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
```

Then begin with Category 1: Visual Appearance Tests, starting with test V1.1.1.

**Remember:** Document EVERY test result in the journal immediately after execution.
