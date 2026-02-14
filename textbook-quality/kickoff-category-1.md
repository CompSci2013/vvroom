# Category 1: Visual Appearance Tests

**Session Scope:** 41 tests across 9 subsections

## Prerequisites

Before starting, ensure:
- e2e/ directory is clean (or contains only completed work from previous sessions)
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

## Critical Requirements

**IMPORTANT: Screenshot Verification is Mandatory**

A test is NOT complete until the screenshot has been visually inspected. The Playwright test passing only means the code executed without errors - it does NOT verify the visual output is correct.

---

## Execution Model: Parallel Subagents by Subsection

The orchestrator (main agent) spawns subagents to run tests in parallel within each subsection.

### Subagent Task
Each subagent receives ONE test to execute. The subagent must:
1. Run the Playwright test: `npx playwright test --grep "V1.x.x"`
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

Test ID: V1.x.x
Command: npx playwright test --grep "V1.x.x"
Description: [test description]

After running the test:
1. Use Read tool to inspect the screenshot: e2e/screenshots/V1.x.x-*.png
2. Verify the screenshot shows:
   - URL bar at top with correct URL/parameters
   - Correct panels expanded/collapsed per test requirements
   - Expected data/content visible
3. Return your findings in this format:
   TEST_ID: V1.x.x
   STATUS: PASS or FAIL
   SCREENSHOTS: [comma-separated filenames]
   VERIFIED: [what you observed]
   ISSUES: [any problems found, or "none"]
```

---

## After Completing a SUBSECTION

Once ALL subagents in a subsection return results:

1. Run subsection verification command (shown in each subsection)
2. Commit: `git add -A && git commit -m "Complete V1.x.x [description] tests (N tests)"`
3. Push to all remotes
4. Add timestamped commit entry to journal
5. Update test-checklist.md with commit hash
6. Proceed to next subsection automatically

## Subsection Execution Order

| Order | Subsection | Tests | Description |
|-------|------------|-------|-------------|
| 1 | V1.1.x | 5 | Default State Rendering |
| 2 | V1.2.x | 5 | Filtered State Rendering |
| 3 | V1.3.x | 4 | Highlighted State Rendering |
| 4 | V1.4.x | 3 | Sorted State Rendering |
| 5 | V1.5.x | 3 | Paginated State Rendering |
| 6 | V1.6.x | 6 | Collapsed/Expanded Panel State |
| 7 | V1.7.x | 7 | Pagination Interaction (Popped-In) |
| 8 | V1.8.x | 3 | Pagination Interaction (Popped-Out) |
| 9 | V1.9.x | 5 | Picker Selection and Apply |

## Startup Sequence

```
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md (Category 1 section)
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

### 1. V1.1.x - Default State Rendering (5 tests)

**Spawn 5 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| V1.1.1 | `npx playwright test --grep "V1.1.1"` | Results Table default render |
| V1.1.2 | `npx playwright test --grep "V1.1.2"` | Filter Panel default render |
| V1.1.3 | `npx playwright test --grep "V1.1.3"` | Pagination default render |
| V1.1.4 | `npx playwright test --grep "V1.1.4"` | Statistics Panel default render |
| V1.1.5 | `npx playwright test --grep "V1.1.5"` | Search Input default render |

**After all 5 subagents return:**
```bash
ls e2e/screenshots/V1.1.* | wc -l  # Must show at least 5 files
```

Commit message: `Complete V1.1.x default state rendering tests (5 tests)`

---

### 2. V1.2.x - Filtered State Rendering (5 tests)

**Spawn 5 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| V1.2.1 | `npx playwright test --grep "V1.2.1"` | Results table filtered by manufacturer (Ford) |
| V1.2.2 | `npx playwright test --grep "V1.2.2"` | Results table filtered by body class (SUV) |
| V1.2.3 | `npx playwright test --grep "V1.2.3"` | Results table filtered by year range (2020-2024) |
| V1.2.4 | `npx playwright test --grep "V1.2.4"` | Statistics filtered by manufacturer (Chevrolet) |
| V1.2.5 | `npx playwright test --grep "V1.2.5"` | Results table with model combinations |

**After all 5 subagents return:**
```bash
ls e2e/screenshots/V1.2.* | wc -l  # Must show at least 5 files
```

Commit message: `Complete V1.2.x filtered state rendering tests (5 tests)`

---

### 3. V1.3.x - Highlighted State Rendering (4 tests)

**Spawn 4 subagents in parallel**, one for each test:

**Panel visibility:** Query Control + Statistics expanded, others collapsed.

| Test ID | Command | Description |
|---------|---------|-------------|
| V1.3.1 | `npx playwright test --grep "V1.3.1"` | Statistics charts highlight Tesla |
| V1.3.2 | `npx playwright test --grep "V1.3.2"` | Statistics charts highlight year range (2015-2020) |
| V1.3.3 | `npx playwright test --grep "V1.3.3"` | Statistics charts highlight body class (Pickup) |
| V1.3.4 | `npx playwright test --grep "V1.3.4"` | Statistics charts filter with highlight |

**After all 4 subagents return:**
```bash
ls e2e/screenshots/V1.3.* | wc -l  # Must show at least 4 files
```

Commit message: `Complete V1.3.x highlighted state rendering tests (4 tests)`

---

### 4. V1.4.x - Sorted State Rendering (3 tests)

**Spawn 3 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| V1.4.1 | `npx playwright test --grep "V1.4.1"` | Results table sorted by year descending |
| V1.4.2 | `npx playwright test --grep "V1.4.2"` | Results table sorted by manufacturer ascending |
| V1.4.3 | `npx playwright test --grep "V1.4.3"` | Results table sorted by instance count descending |

**After all 3 subagents return:**
```bash
ls e2e/screenshots/V1.4.* | wc -l  # Must show at least 3 files
```

Commit message: `Complete V1.4.x sorted state rendering tests (3 tests)`

---

### 5. V1.5.x - Paginated State Rendering (3 tests)

**Spawn 3 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| V1.5.1 | `npx playwright test --grep "V1.5.1"` | Results table page 2 with 10 rows |
| V1.5.2 | `npx playwright test --grep "V1.5.2"` | Pagination control page 5 |
| V1.5.3 | `npx playwright test --grep "V1.5.3"` | Results table last page |

**After all 3 subagents return:**
```bash
ls e2e/screenshots/V1.5.* | wc -l  # Must show at least 3 files
```

Commit message: `Complete V1.5.x paginated state rendering tests (3 tests)`

---

### 6. V1.6.x - Collapsed/Expanded Panel State (6 tests)

**Spawn 6 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| V1.6.1 | `npx playwright test --grep "V1.6.1"` | Query Control collapsed |
| V1.6.2 | `npx playwright test --grep "V1.6.2"` | Query Panel collapsed |
| V1.6.3 | `npx playwright test --grep "V1.6.3"` | Manufacturer-Model Picker collapsed |
| V1.6.4 | `npx playwright test --grep "V1.6.4"` | All Panels expanded (default) |
| V1.6.5 | `npx playwright test --grep "V1.6.5"` | All Panels collapsed |
| V1.6.6 | `npx playwright test --grep "V1.6.6"` | Mixed State (some collapsed, some expanded) |

**After all 6 subagents return:**
```bash
ls e2e/screenshots/V1.6.* | wc -l  # Must show at least 6 files
```

Commit message: `Complete V1.6.x panel state rendering tests (6 tests)`

---

### 7. V1.7.x - Pagination Interaction (Popped-In) (7 tests)

**Spawn 7 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| V1.7.1 | `npx playwright test --grep "V1.7.1"` | Picker Table click page 2 |
| V1.7.2 | `npx playwright test --grep "V1.7.2"` | Picker Table click page 3 |
| V1.7.3 | `npx playwright test --grep "V1.7.3"` | Picker Table change rows to 10 |
| V1.7.4 | `npx playwright test --grep "V1.7.4"` | Picker Table change rows to 50 |
| V1.7.5 | `npx playwright test --grep "V1.7.5"` | Picker Table change rows to 100 |
| V1.7.6 | `npx playwright test --grep "V1.7.6"` | Results Table navigate via URL ?page=2 |
| V1.7.7 | `npx playwright test --grep "V1.7.7"` | Results Table navigate via URL ?size=50 |

**After all 7 subagents return:**
```bash
ls e2e/screenshots/V1.7.* | wc -l  # Must show at least 7 files
```

Commit message: `Complete V1.7.x pagination interaction (popped-in) tests (7 tests)`

---

### 8. V1.8.x - Pagination Interaction (Popped-Out) (3 tests)

**Spawn 3 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| V1.8.1 | `npx playwright test --grep "V1.8.1"` | Picker Table (pop-out) click page 2 |
| V1.8.2 | `npx playwright test --grep "V1.8.2"` | Picker Table (pop-out) change rows to 50 |
| V1.8.3 | `npx playwright test --grep "V1.8.3"` | Picker Table (pop-out) change rows to 100 |

**After all 3 subagents return:**
```bash
ls e2e/screenshots/V1.8.* | wc -l  # Must show at least 3 files
```

Commit message: `Complete V1.8.x pagination interaction (popped-out) tests (3 tests)`

---

### 9. V1.9.x - Picker Selection and Apply (5 tests)

**Spawn 5 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| V1.9.1 | `npx playwright test --grep "V1.9.1"` | Picker (in) select rows before Apply |
| V1.9.2 | `npx playwright test --grep "V1.9.2"` | Picker (in) after Apply clicked |
| V1.9.3 | `npx playwright test --grep "V1.9.3"` | Picker (out) select rows before Apply |
| V1.9.4 | `npx playwright test --grep "V1.9.4"` | Picker (out) after Apply clicked |
| V1.9.5 | `npx playwright test --grep "V1.9.5"` | Picker (in) clear selection |

**After all 5 subagents return:**
```bash
ls e2e/screenshots/V1.9.* | wc -l  # Must show at least 5 files
```

Commit message: `Complete V1.9.x picker selection tests (5 tests)`

---

## Category Completion

After all 9 subsections are complete:

```bash
# Verify total screenshots
ls e2e/screenshots/V1.* | wc -l  # Must output: 41

# Verify all test IDs present
for id in V1.1.1 V1.1.2 V1.1.3 V1.1.4 V1.1.5 V1.2.1 V1.2.2 V1.2.3 V1.2.4 V1.2.5 V1.3.1 V1.3.2 V1.3.3 V1.3.4 V1.4.1 V1.4.2 V1.4.3 V1.5.1 V1.5.2 V1.5.3 V1.6.1 V1.6.2 V1.6.3 V1.6.4 V1.6.5 V1.6.6 V1.7.1 V1.7.2 V1.7.3 V1.7.4 V1.7.5 V1.7.6 V1.7.7 V1.8.1 V1.8.2 V1.8.3 V1.9.1 V1.9.2 V1.9.3 V1.9.4 V1.9.5; do
  ls e2e/screenshots/${id}-*.png 2>/dev/null || echo "MISSING: $id"
done

# Verify spec file test count
grep -c "test('" e2e/tests/category-1-visual-appearance.spec.ts  # Must output: 41
```

**STOP HERE.** Inform the user that Category 1 is complete. Do not proceed to Category 2 in this session.

Final commit: `Category 1 Visual Appearance Tests complete (41/41 tests)`
