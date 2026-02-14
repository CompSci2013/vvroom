# Category 3: URL Change Consistency Tests

**Session Scope:** 14 tests across 3 subsections

## Prerequisites

Before starting, ensure:
- Categories 1-2 are complete
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

## Critical Requirements

**IMPORTANT: Screenshot Verification is Mandatory**

A test is NOT complete until the screenshot has been visually inspected. The Playwright test passing only means the code executed without errors - it does NOT verify the visual output is correct.

---

## Execution Model: Parallel Subagents by Subsection

The orchestrator (main agent) spawns subagents to run tests in parallel within each subsection.

### Subagent Task
Each subagent receives ONE test to execute. The subagent must:
1. Run the Playwright test: `npx playwright test --grep "U3.x.x"`
2. Read and inspect the screenshot image file(s)
3. Verify against test-rubric.md criteria
4. Return a structured result:
   - Test ID
   - PASS or FAIL
   - Screenshot filename(s)
   - Verification notes (what was observed)
   - Any issues found

### Orchestrator Responsibilities
After all subagents in a subsection complete:
1. Collect all subagent results
2. Update test-checklist.md with `[x]`, screenshot filenames
3. Append journal entries for each test
4. Run subsection verification command
5. If all passed: commit and push
6. Proceed to next subsection (no user prompt needed between subsections)

### Subagent Prompt Template
```
You are a test execution agent. Run exactly ONE Playwright test and verify the screenshot.

Test ID: U3.x.x
Command: npx playwright test --grep "U3.x.x"
Description: [test description]

After running the test:
1. Use Read tool to inspect the screenshot: e2e/screenshots/U3.x.x-*.png
2. Verify the screenshot shows:
   - URL bar at top with correct URL/parameters
   - Correct panels expanded/collapsed per test requirements
   - Expected data/content visible
3. Return your findings in this format:
   TEST_ID: U3.x.x
   STATUS: PASS or FAIL
   SCREENSHOTS: [comma-separated filenames]
   VERIFIED: [what you observed]
   ISSUES: [any problems found, or "none"]
```

---

## After Completing a SUBSECTION

Once ALL subagents in a subsection return results:

1. Run subsection verification command (shown in each subsection)
2. Commit: `git add -A && git commit -m "Complete U3.x.x [description] tests (N tests)"`
3. Push to all remotes
4. Add timestamped commit entry to journal
5. Update test-checklist.md with commit hash
6. Proceed to next subsection automatically

## Subsection Execution Order

| Order | Subsection | Tests | Description |
|-------|------------|-------|-------------|
| 1 | U3.1.x | 6 | Browser Navigation (back/forward) |
| 2 | U3.2.x | 5 | Manual URL Edits |
| 3 | U3.3.x | 3 | URL Sharing |

## Startup Sequence

```
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md (Category 3 section)
Read ~/projects/vvroom/textbook-quality/panel-visibility-reference.md
Read ~/projects/vvroom/textbook-quality/screenshot-requirements.md
Read ~/projects/vvroom/textbook-quality/kickoff-prompt.md
```

## Test Library Setup

If starting fresh (e2e/ directory is empty or missing), copy the screenshot helper:

```bash
mkdir -p e2e/tests
cp ~/projects/vvroom/test-lib/screenshot-helper.ts ~/projects/vvroom/e2e/tests/
```

The helper provides:
- `takeScreenshot()` - Adaptive screenshot capture with URL bar compositing
- `setPanelVisibility()` - Panel expand/collapse control
- `navigateToDiscover()` - URL navigation helper
- `PANEL_IDS` - Panel ID constants

## Subsection Workflows

---

### 1. U3.1.x - Browser Navigation (6 tests)

**Spawn 6 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| U3.1.1 | `npx playwright test --grep "U3.1.1"` | Select Ford → Select Chevrolet → Back → Ford restored |
| U3.1.2 | `npx playwright test --grep "U3.1.2"` | Page 3 → Page 5 → Back → Back → pages restored |
| U3.1.3 | `npx playwright test --grep "U3.1.3"` | Apply sort → Apply filter → Back → sort remains |
| U3.1.4 | `npx playwright test --grep "U3.1.4"` | Apply highlight → Back → highlight removed |
| U3.1.5 | `npx playwright test --grep "U3.1.5"` | Clear filters → Back → filters restored |
| U3.1.6 | `npx playwright test --grep "U3.1.6"` | Multiple Back → Forward → state restored |

**After all 6 subagents return:**
```bash
ls e2e/screenshots/U3.1.* | wc -l  # Must show at least 6 files
```

Commit message: `Complete U3.1.x browser navigation tests (6 tests)`

---

### 2. U3.2.x - Manual URL Edits (5 tests)

**Spawn 5 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| U3.2.1 | `npx playwright test --grep "U3.2.1"` | Change manufacturer=Ford to manufacturer=Dodge |
| U3.2.2 | `npx playwright test --grep "U3.2.2"` | Add &yearMin=2010 to existing URL |
| U3.2.3 | `npx playwright test --grep "U3.2.3"` | Remove page=3 → returns to page 1 |
| U3.2.4 | `npx playwright test --grep "U3.2.4"` | Change sortOrder=asc to sortOrder=desc |
| U3.2.5 | `npx playwright test --grep "U3.2.5"` | Paste completely new URL with different filters |

**After all 5 subagents return:**
```bash
ls e2e/screenshots/U3.2.* | wc -l  # Must show at least 5 files
```

Commit message: `Complete U3.2.x manual URL edit tests (5 tests)`

---

### 3. U3.3.x - URL Sharing (3 tests)

**Spawn 3 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| U3.3.1 | `npx playwright test --grep "U3.3.1"` | Copy URL with filters, paste in new tab → identical state |
| U3.3.2 | `npx playwright test --grep "U3.3.2"` | Copy URL with highlights, paste in new tab |
| U3.3.3 | `npx playwright test --grep "U3.3.3"` | Copy URL with pagination, paste in incognito |

**After all 3 subagents return:**
```bash
ls e2e/screenshots/U3.3.* | wc -l  # Must show at least 3 files
```

Commit message: `Complete U3.3.x URL sharing tests (3 tests)`

---

## Category Completion

After all 3 subsections are complete:

```bash
# Verify total screenshots
ls e2e/screenshots/U3.* | wc -l  # Must output: 14

# Verify all test IDs present
for id in U3.1.1 U3.1.2 U3.1.3 U3.1.4 U3.1.5 U3.1.6 U3.2.1 U3.2.2 U3.2.3 U3.2.4 U3.2.5 U3.3.1 U3.3.2 U3.3.3; do
  ls e2e/screenshots/${id}-*.png 2>/dev/null || echo "MISSING: $id"
done

# Verify spec file test count
grep -c "test('" e2e/tests/category-3-url-consistency.spec.ts  # Must output: 14
```

**STOP HERE.** Inform the user that Category 3 is complete. Do not proceed to Category 4 in this session.

Final commit: `Category 3 URL Change Consistency Tests complete (14/14 tests)`
