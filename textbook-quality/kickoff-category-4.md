# Category 4: Pop-Out Behavior Tests

**Session Scope:** 21 tests across 5 subsections

## Prerequisites

Before starting, ensure:
- Categories 1-3 are complete
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

## Critical Requirements

**IMPORTANT: Screenshot Verification is Mandatory**

A test is NOT complete until the screenshot has been visually inspected. The Playwright test passing only means the code executed without errors - it does NOT verify the visual output is correct.

---

## Execution Model: Parallel Subagents by Subsection

The orchestrator (main agent) spawns subagents to run tests in parallel within each subsection.

### Subagent Task
Each subagent receives ONE test to execute. The subagent must:
1. Run the Playwright test: `npx playwright test --grep "P4.x.x"`
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

Test ID: P4.x.x
Command: npx playwright test --grep "P4.x.x"
Description: [test description]

After running the test:
1. Use Read tool to inspect the screenshot: e2e/screenshots/P4.x.x-*.png
2. Verify the screenshot shows:
   - URL bar at top with correct URL/parameters
   - Pop-out window content OR main window placeholder as expected
   - Expected data/content visible
3. Return your findings in this format:
   TEST_ID: P4.x.x
   STATUS: PASS or FAIL
   SCREENSHOTS: [comma-separated filenames]
   VERIFIED: [what you observed]
   ISSUES: [any problems found, or "none"]
```

---

## After Completing a SUBSECTION

Once ALL subagents in a subsection return results:

1. Run subsection verification command (shown in each subsection)
2. Commit: `git add -A && git commit -m "Complete P4.x.x [description] tests (N tests)"`
3. Push to all remotes
4. Add timestamped commit entry to journal
5. Update test-checklist.md with commit hash
6. Proceed to next subsection automatically

## Subsection Execution Order

| Order | Subsection | Tests | Description |
|-------|------------|-------|-------------|
| 1 | P4.1.x | 6 | Pop-Out Window Rendering |
| 2 | P4.2.x | 6 | Pop-Out Synchronization |
| 3 | P4.3.x | 4 | Pop-Out API Behavior |
| 4 | P4.4.x | 5 | Multiple Pop-Out Tests |
| 5 | P4.5.x | 4 | Pop-Out with URL Parameters |

## Startup Sequence

```
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md (Category 4 section)
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

### 1. P4.1.x - Pop-Out Window Rendering (6 tests)

**Spawn 6 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| P4.1.1 | `npx playwright test --grep "P4.1.1"` | Pop out results table → displays in new window |
| P4.1.2 | `npx playwright test --grep "P4.1.2"` | Pop out statistics panel → displays in new window |
| P4.1.3 | `npx playwright test --grep "P4.1.3"` | Pop out filter panel → displays in new window |
| P4.1.4 | `npx playwright test --grep "P4.1.4"` | Pop-out URL contains /panel/ route path |
| P4.1.5 | `npx playwright test --grep "P4.1.5"` | Pop-out hides site banner/header |
| P4.1.6 | `npx playwright test --grep "P4.1.6"` | Main window shows placeholder for popped-out component |

**After all 6 subagents return:**
```bash
ls e2e/screenshots/P4.1.* | wc -l  # Must show at least 6 files
```

Commit message: `Complete P4.1.x pop-out rendering tests (6 tests)`

---

### 2. P4.2.x - Pop-Out Synchronization (6 tests)

**Spawn 6 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| P4.2.1 | `npx playwright test --grep "P4.2.1"` | Change filter in main window → pop-out updates |
| P4.2.2 | `npx playwright test --grep "P4.2.2"` | Change filter in pop-out → main window URL updates |
| P4.2.3 | `npx playwright test --grep "P4.2.3"` | Change sort in main window → pop-out re-sorts |
| P4.2.4 | `npx playwright test --grep "P4.2.4"` | Apply highlight in pop-out → main window updates |
| P4.2.5 | `npx playwright test --grep "P4.2.5"` | Navigate page in main window → pop-out shows same page |
| P4.2.6 | `npx playwright test --grep "P4.2.6"` | Clear filters in main window → pop-out clears |

**After all 6 subagents return:**
```bash
ls e2e/screenshots/P4.2.* | wc -l  # Must show at least 6 files
```

Commit message: `Complete P4.2.x pop-out synchronization tests (6 tests)`

---

### 3. P4.3.x - Pop-Out API Behavior (4 tests)

**Spawn 4 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| P4.3.1 | `npx playwright test --grep "P4.3.1"` | Pop-out does NOT update its own URL after load |
| P4.3.2 | `npx playwright test --grep "P4.3.2"` | Pop-out does NOT make its own API calls |
| P4.3.3 | `npx playwright test --grep "P4.3.3"` | Pop-out receives data via BroadcastChannel |
| P4.3.4 | `npx playwright test --grep "P4.3.4"` | Main window API refresh updates pop-outs |

**After all 4 subagents return:**
```bash
ls e2e/screenshots/P4.3.* | wc -l  # Must show at least 4 files
```

Commit message: `Complete P4.3.x pop-out API behavior tests (4 tests)`

---

### 4. P4.4.x - Multiple Pop-Out Tests (5 tests)

**Spawn 5 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| P4.4.1 | `npx playwright test --grep "P4.4.1"` | Open two pop-outs of same type → both identical |
| P4.4.2 | `npx playwright test --grep "P4.4.2"` | Open pop-outs of different types → each receives updates |
| P4.4.3 | `npx playwright test --grep "P4.4.3"` | Change in one pop-out → updates all windows |
| P4.4.4 | `npx playwright test --grep "P4.4.4"` | Close pop-out → main window continues normally |
| P4.4.5 | `npx playwright test --grep "P4.4.5"` | Close main window → pop-outs handle gracefully |

**After all 5 subagents return:**
```bash
ls e2e/screenshots/P4.4.* | wc -l  # Must show at least 5 files
```

Commit message: `Complete P4.4.x multiple pop-out tests (5 tests)`

---

### 5. P4.5.x - Pop-Out with URL Parameters (4 tests)

**Spawn 4 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| P4.5.1 | `npx playwright test --grep "P4.5.1"` | ?manufacturer=Ford → pop-out shows Ford vehicles |
| P4.5.2 | `npx playwright test --grep "P4.5.2"` | ?h_manufacturer=Tesla → pop-out shows Tesla highlighted |
| P4.5.3 | `npx playwright test --grep "P4.5.3"` | ?sortBy=year&sortOrder=desc → pop-out sorted |
| P4.5.4 | `npx playwright test --grep "P4.5.4"` | ?page=3&size=10 → pop-out shows page 3 |

**After all 4 subagents return:**
```bash
ls e2e/screenshots/P4.5.* | wc -l  # Must show at least 4 files
```

Commit message: `Complete P4.5.x pop-out with URL parameters tests (4 tests)`

---

## Category Completion

After all 5 subsections are complete:

```bash
# Verify total screenshots
ls e2e/screenshots/P4.* | wc -l  # Must output: 21 (minimum)

# Verify all test IDs present
for id in P4.1.1 P4.1.2 P4.1.3 P4.1.4 P4.1.5 P4.1.6 P4.2.1 P4.2.2 P4.2.3 P4.2.4 P4.2.5 P4.2.6 P4.3.1 P4.3.2 P4.3.3 P4.3.4 P4.4.1 P4.4.2 P4.4.3 P4.4.4 P4.4.5 P4.5.1 P4.5.2 P4.5.3 P4.5.4; do
  ls e2e/screenshots/${id}-*.png 2>/dev/null || echo "MISSING: $id"
done

# Verify spec file test count
grep -c "test('" e2e/tests/category-4-popout-behavior.spec.ts  # Must output: 21
```

**STOP HERE.** Inform the user that Category 4 is complete. Do not proceed to Category 5 in this session.

Final commit: `Category 4 Pop-Out Behavior Tests complete (21/21 tests)`
