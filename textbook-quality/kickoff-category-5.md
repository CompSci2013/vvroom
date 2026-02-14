# Category 5: Cross-Window Synchronization Tests

**Session Scope:** 13 tests across 3 subsections

## Prerequisites

Before starting, ensure:
- Categories 1-4 are complete
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

## Critical Requirements

**IMPORTANT: Screenshot Verification is Mandatory**

A test is NOT complete until the screenshot has been visually inspected. The Playwright test passing only means the code executed without errors - it does NOT verify the visual output is correct.

---

## Execution Model: Parallel Subagents by Subsection

The orchestrator (main agent) spawns subagents to run tests in parallel within each subsection.

### Subagent Task
Each subagent receives ONE test to execute. The subagent must:
1. Run the Playwright test: `npx playwright test --grep "S5.x.x"`
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

Test ID: S5.x.x
Command: npx playwright test --grep "S5.x.x"
Description: [test description]

After running the test:
1. Use Read tool to inspect the screenshot: e2e/screenshots/S5.x.x-*.png
2. Verify the screenshot shows:
   - URL bar at top with correct URL/parameters
   - Synchronization between main window and pop-out as expected
   - Expected data/content visible in both windows
3. Return your findings in this format:
   TEST_ID: S5.x.x
   STATUS: PASS or FAIL
   SCREENSHOTS: [comma-separated filenames]
   VERIFIED: [what you observed]
   ISSUES: [any problems found, or "none"]
```

---

## After Completing a SUBSECTION

Once ALL subagents in a subsection return results:

1. Run subsection verification command (shown in each subsection)
2. Commit: `git add -A && git commit -m "Complete S5.x.x [description] tests (N tests)"`
3. Push to all remotes
4. Add timestamped commit entry to journal
5. Update test-checklist.md with commit hash
6. Proceed to next subsection automatically

## Subsection Execution Order

| Order | Subsection | Tests | Description |
|-------|------------|-------|-------------|
| 1 | S5.1.x | 7 | Main Window to Pop-Out |
| 2 | S5.2.x | 3 | Pop-Out to Main Window |
| 3 | S5.3.x | 3 | BroadcastChannel Verification |

## Startup Sequence

```
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md (Category 5 section)
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
- `takeOverlayScreenshot()` - Single image for main window overlay
- `setPanelVisibility()` - Panel expand/collapse control
- `navigateToDiscover()` - URL navigation helper
- `PANEL_IDS` - Panel ID constants

## Subsection Workflows

---

### 1. S5.1.x - Main Window to Pop-Out (7 tests)

**Spawn 7 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| S5.1.1 | `npx playwright test --grep "S5.1.1"` | Change manufacturer filter in main → pop-out filters |
| S5.1.2 | `npx playwright test --grep "S5.1.2"` | Apply year range filter in main → pop-out shows range |
| S5.1.3 | `npx playwright test --grep "S5.1.3"` | Change sort column in main → pop-out re-sorts |
| S5.1.4 | `npx playwright test --grep "S5.1.4"` | Change page in main → pop-out shows same page |
| S5.1.5 | `npx playwright test --grep "S5.1.5"` | Apply highlight in main → pop-out highlights |
| S5.1.6 | `npx playwright test --grep "S5.1.6"` | Clear all filters in main → pop-out clears |
| S5.1.7 | `npx playwright test --grep "S5.1.7"` | Type in search in main → pop-out shows results |

**After all 7 subagents return:**
```bash
ls e2e/screenshots/S5.1.* | wc -l  # Must show at least 7 files
```

Commit message: `Complete S5.1.x main window to pop-out tests (7 tests)`

---

### 2. S5.2.x - Pop-Out to Main Window (3 tests)

**Spawn 3 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| S5.2.1 | `npx playwright test --grep "S5.2.1"` | Change highlight in pop-out → main window URL updates |
| S5.2.2 | `npx playwright test --grep "S5.2.2"` | Apply filter in pop-out → main window URL updates |
| S5.2.3 | `npx playwright test --grep "S5.2.3"` | Clear filters in pop-out → main window URL clears |

**After all 3 subagents return:**
```bash
ls e2e/screenshots/S5.2.* | wc -l  # Must show at least 3 files
```

Commit message: `Complete S5.2.x pop-out to main window tests (3 tests)`

---

### 3. S5.3.x - BroadcastChannel Verification (3 tests)

**Spawn 3 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| S5.3.1 | `npx playwright test --grep "S5.3.1"` | Filter change sends BroadcastChannel message |
| S5.3.2 | `npx playwright test --grep "S5.3.2"` | Pop-out receives message (syncStateFromExternal called) |
| S5.3.3 | `npx playwright test --grep "S5.3.3"` | Pop-out sends message → main window receives |

**After all 3 subagents return:**
```bash
ls e2e/screenshots/S5.3.* | wc -l  # Must show at least 3 files
```

Commit message: `Complete S5.3.x BroadcastChannel verification tests (3 tests)`

---

## Category Completion

After all 3 subsections are complete:

```bash
# Verify total screenshots
ls e2e/screenshots/S5.* | wc -l  # Must output: 13 (7+3+3)

# Verify all test IDs present
for id in S5.1.1 S5.1.2 S5.1.3 S5.1.4 S5.1.5 S5.1.6 S5.1.7 S5.2.1 S5.2.2 S5.2.3 S5.3.1 S5.3.2 S5.3.3; do
  ls e2e/screenshots/${id}-*.png 2>/dev/null || echo "MISSING: $id"
done

# Verify spec file test count
grep -c "test('" e2e/tests/category-5-cross-window-sync.spec.ts  # Must output: 13
```

**STOP HERE.** Inform the user that Category 5 is complete. Do not proceed to Category 6 in this session.

Final commit: `Category 5 Cross-Window Synchronization Tests complete (13/13 tests)`
