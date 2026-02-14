# Category 7: Error Handling Tests

**Session Scope:** 7 tests (single subsection)

## Prerequisites

Before starting, ensure:
- Categories 1-6 are complete
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

## Critical Requirements

**IMPORTANT: Screenshot Verification is Mandatory**

A test is NOT complete until the screenshot has been visually inspected. The Playwright test passing only means the code executed without errors - it does NOT verify the visual output is correct.

---

## Execution Model: Parallel Subagents

The orchestrator (main agent) spawns subagents to run all 7 tests in parallel.

### Subagent Task
Each subagent receives ONE test to execute. The subagent must:
1. Run the Playwright test: `npx playwright test --grep "E7.x"`
2. Read and inspect the screenshot image file(s)
3. Verify against test-rubric.md criteria
4. Return a structured result:
   - Test ID
   - PASS or FAIL
   - Screenshot filename(s)
   - Verification notes (what was observed)
   - Any issues found

### Orchestrator Responsibilities
After all subagents complete:
1. Collect all subagent results
2. Update test-checklist.md with `[x]`, screenshot filenames
3. Append journal entries for each test
4. Run verification command
5. If all passed: commit and push

### Subagent Prompt Template
```
You are a test execution agent. Run exactly ONE Playwright test and verify the screenshot.

Test ID: E7.x
Command: npx playwright test --grep "E7.x"
Description: [test description]

After running the test:
1. Use Read tool to inspect the screenshot: e2e/screenshots/E7.x-*.png
2. Verify the screenshot shows:
   - Application handled invalid input gracefully
   - No crash or error page
   - URL bar at top with the invalid parameter
3. Return your findings in this format:
   TEST_ID: E7.x
   STATUS: PASS or FAIL
   SCREENSHOTS: [comma-separated filenames]
   VERIFIED: [what you observed]
   ISSUES: [any problems found, or "none"]
```

---

## Test List

| Test ID | Invalid Input | Expected Behavior |
|---------|--------------|-------------------|
| E7.1 | ?manufacturer=InvalidBrand | Graceful handling, ignored or defaulted |
| E7.2 | ?yearMin=3000 | Invalid year handled gracefully |
| E7.3 | ?page=-1 | Returns to valid page (1) |
| E7.4 | ?size=10000 | Capped to maximum allowed size |
| E7.5 | ?sortBy=invalidField | Sort ignored, default order used |
| E7.6 | ?search= (empty) | Treated as no search |
| E7.7 | Special characters in search | Properly escaped/handled |

## Startup Sequence

```
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md (Category 7 section)
Read ~/projects/vvroom/textbook-quality/panel-visibility-reference.md
Read ~/projects/vvroom/textbook-quality/screenshot-requirements.md
Read ~/projects/vvroom/textbook-quality/kickoff-prompt.md
```

## Test Library Setup

If test-lib helper is not in e2e/tests/, copy it:

```bash
cp ~/projects/vvroom/test-lib/screenshot-helper.ts ~/projects/vvroom/e2e/tests/
```

## Subsection Workflows

---

### E7.x - Error Handling (7 tests)

**Spawn 7 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| E7.1 | `npx playwright test --grep "E7.1"` | ?manufacturer=InvalidBrand → graceful handling |
| E7.2 | `npx playwright test --grep "E7.2"` | ?yearMin=3000 → invalid year handled |
| E7.3 | `npx playwright test --grep "E7.3"` | ?page=-1 → returns to page 1 |
| E7.4 | `npx playwright test --grep "E7.4"` | ?size=10000 → capped to max size |
| E7.5 | `npx playwright test --grep "E7.5"` | ?sortBy=invalidField → default order |
| E7.6 | `npx playwright test --grep "E7.6"` | ?search= (empty) → no search applied |
| E7.7 | `npx playwright test --grep "E7.7"` | Special chars in search → escaped |

**After all 7 subagents return:**
```bash
ls e2e/screenshots/E7.* | wc -l  # Must show at least 7 files
```

Commit message: `Complete E7.x error handling tests (7 tests)`

---

## Category Completion

After all 7 tests are complete:

```bash
# Verify total screenshots
ls e2e/screenshots/E7.* | wc -l  # Must output: 7

# Verify all test IDs present
for id in E7.1 E7.2 E7.3 E7.4 E7.5 E7.6 E7.7; do
  ls e2e/screenshots/${id}-*.png 2>/dev/null || echo "MISSING: $id"
done

# Verify spec file test count
grep -c "test('" e2e/tests/category-7-error-handling.spec.ts  # Must output: 7
```

**STOP HERE.** Inform the user that Category 7 is complete. Do not proceed to Category 8 in this session.

Final commit: `Category 7 Error Handling Tests complete (7/7 tests)`
