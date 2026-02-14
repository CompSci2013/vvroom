# Category 8: Visual Verification Tests

**Session Scope:** 15 tests across 4 subsections

## Prerequisites

Before starting, ensure:
- Categories 1-7 are complete
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

## Critical Requirements

**IMPORTANT: Screenshot Verification is Mandatory**

A test is NOT complete until the screenshot has been visually inspected. The Playwright test passing only means the code executed without errors - it does NOT verify the visual output is correct.

---

## Execution Model: Parallel Subagents by Subsection

The orchestrator (main agent) spawns subagents to run tests in parallel within each subsection.

### Subagent Task
Each subagent receives ONE test to execute. The subagent must:
1. Run the Playwright test: `npx playwright test --grep "VS8.x.x"`
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

Test ID: VS8.x.x
Command: npx playwright test --grep "VS8.x.x"
Description: [test description]

After running the test:
1. Use Read tool to inspect the screenshot: e2e/screenshots/VS8.x.x-*.png
2. Verify the screenshot shows:
   - URL bar at top with correct URL/parameters
   - Full page visual capture as expected
   - Expected data/content visible
3. Return your findings in this format:
   TEST_ID: VS8.x.x
   STATUS: PASS or FAIL
   SCREENSHOTS: [comma-separated filenames]
   VERIFIED: [what you observed]
   ISSUES: [any problems found, or "none"]
```

---

## After Completing a SUBSECTION

Once ALL subagents in a subsection return results:

1. Run subsection verification command (shown in each subsection)
2. Commit: `git add -A && git commit -m "Complete VS8.x.x [description] tests (N tests)"`
3. Push to all remotes
4. Add timestamped commit entry to journal
5. Update test-checklist.md with commit hash
6. Proceed to next subsection automatically

## Subsection Execution Order

| Order | Subsection | Tests | Description |
|-------|------------|-------|-------------|
| 1 | VS8.1.x | 5 | Default State Screenshots |
| 2 | VS8.2.x | 4 | Filtered State Screenshots |
| 3 | VS8.3.x | 3 | Highlighted State Screenshots |
| 4 | VS8.4.x | 3 | Pop-Out Screenshots |

## Startup Sequence

```
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md (Category 8 section)
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

### 1. VS8.1.x - Default State Screenshots (5 tests)

**Spawn 5 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| VS8.1.1 | `npx playwright test --grep "VS8.1.1"` | Full page default state (/) |
| VS8.1.2 | `npx playwright test --grep "VS8.1.2"` | Results table default state |
| VS8.1.3 | `npx playwright test --grep "VS8.1.3"` | Filter panel default state |
| VS8.1.4 | `npx playwright test --grep "VS8.1.4"` | Statistics panel default state |
| VS8.1.5 | `npx playwright test --grep "VS8.1.5"` | Pagination default state |

**After all 5 subagents return:**
```bash
ls e2e/screenshots/VS8.1.* | wc -l  # Must show at least 5 files
```

Commit message: `Complete VS8.1.x default state visual tests (5 tests)`

---

### 2. VS8.2.x - Filtered State Screenshots (4 tests)

**Spawn 4 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| VS8.2.1 | `npx playwright test --grep "VS8.2.1"` | Full page filtered by Ford |
| VS8.2.2 | `npx playwright test --grep "VS8.2.2"` | Full page filtered by SUV |
| VS8.2.3 | `npx playwright test --grep "VS8.2.3"` | Full page filtered by recent years |
| VS8.2.4 | `npx playwright test --grep "VS8.2.4"` | Full page with combined filters |

**After all 4 subagents return:**
```bash
ls e2e/screenshots/VS8.2.* | wc -l  # Must show at least 4 files
```

Commit message: `Complete VS8.2.x filtered state visual tests (4 tests)`

---

### 3. VS8.3.x - Highlighted State Screenshots (3 tests)

**Panel visibility:** Keep Query Control + Statistics expanded, collapse others.

**Spawn 3 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| VS8.3.1 | `npx playwright test --grep "VS8.3.1"` | Full page with Tesla highlight |
| VS8.3.2 | `npx playwright test --grep "VS8.3.2"` | Full page with year range highlight |
| VS8.3.3 | `npx playwright test --grep "VS8.3.3"` | Full page with filter and highlight |

**After all 3 subagents return:**
```bash
ls e2e/screenshots/VS8.3.* | wc -l  # Must show at least 3 files
```

Commit message: `Complete VS8.3.x highlighted state visual tests (3 tests)`

---

### 4. VS8.4.x - Pop-Out Screenshots (3 tests)

**Note:** Each test produces 2 screenshots (standalone and with-main views).

**Spawn 3 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| VS8.4.1 | `npx playwright test --grep "VS8.4.1"` | Results table pop-out (standalone + with main) |
| VS8.4.2 | `npx playwright test --grep "VS8.4.2"` | Statistics pop-out (standalone + with main) |
| VS8.4.3 | `npx playwright test --grep "VS8.4.3"` | Filter panel pop-out (standalone + with main) |

**After all 3 subagents return:**
```bash
ls e2e/screenshots/VS8.4.* | wc -l  # Must show at least 6 files (2 per test)
```

Commit message: `Complete VS8.4.x pop-out visual tests (3 tests, 6 screenshots)`

---

## Category Completion

After all 4 subsections are complete:

```bash
# Verify total screenshots (note: VS8.4.x has 6 screenshots for 3 tests)
ls e2e/screenshots/VS8.* | wc -l  # Must output: 18 (5+4+3+6)

# Verify all test IDs present
for id in VS8.1.1 VS8.1.2 VS8.1.3 VS8.1.4 VS8.1.5 VS8.2.1 VS8.2.2 VS8.2.3 VS8.2.4 VS8.3.1 VS8.3.2 VS8.3.3 VS8.4.1 VS8.4.2 VS8.4.3; do
  ls e2e/screenshots/${id}-*.png 2>/dev/null || echo "MISSING: $id"
done

# Verify spec file test count
grep -c "test('" e2e/tests/category-8-visual-verification.spec.ts  # Must output: 15
```

**STOP HERE.** Inform the user that Category 8 is complete.

Final commit: `Category 8 Visual Verification Tests complete (15/15 tests)`

---

## ALL CATEGORIES COMPLETE

When Category 8 is finished, run final verification:

```bash
# Total screenshots across all categories
ls e2e/screenshots/*.png | wc -l

# Final verification of all test IDs
~/projects/vvroom/textbook-quality/verify-all-tests.sh
```

Update test-checklist.md summary table with final counts.

Final commit: `All 8 categories complete - 134 tests total`
