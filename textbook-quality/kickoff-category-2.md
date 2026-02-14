# Category 2: URL-First Conformity Tests

**Session Scope:** 22 tests across 3 subsections

## Prerequisites

Before starting, ensure:
- Category 1 is complete (41 screenshots in e2e/screenshots/V1.*)
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

## Critical Requirements

**IMPORTANT: Screenshot Verification is Mandatory**

A test is NOT complete until the screenshot has been visually inspected. The Playwright test passing only means the code executed without errors - it does NOT verify the visual output is correct.

---

## Execution Model: Parallel Subagents by Subsection

The orchestrator (main agent) spawns subagents to run tests in parallel within each subsection.

### Subagent Task
Each subagent receives ONE test to execute. The subagent must:
1. Run the Playwright test: `npx playwright test --grep "U2.x.x"`
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

Test ID: U2.x.x
Command: npx playwright test --grep "U2.x.x"
Description: [test description]

After running the test:
1. Use Read tool to inspect the screenshot: e2e/screenshots/U2.x.x-*.png
2. Verify the screenshot shows:
   - URL bar at top with correct URL/parameters
   - Correct panels expanded/collapsed per test requirements
   - Expected data/content visible
3. Return your findings in this format:
   TEST_ID: U2.x.x
   STATUS: PASS or FAIL
   SCREENSHOTS: [comma-separated filenames]
   VERIFIED: [what you observed]
   ISSUES: [any problems found, or "none"]
```

---

## After Completing a SUBSECTION

Once ALL subagents in a subsection return results:

1. Run subsection verification command (shown in each subsection)
2. Commit: `git add -A && git commit -m "Complete U2.x.x [description] tests (N tests)"`
3. Push to all remotes
4. Add timestamped commit entry to journal
5. Update test-checklist.md with commit hash
6. Proceed to next subsection automatically

## Subsection Execution Order

| Order | Subsection | Tests | Description |
|-------|------------|-------|-------------|
| 1 | U2.1.x | 9 | URL to State (Load URL, Verify State) |
| 2 | U2.2.x | 10 | State to URL (User Interaction, Verify URL) |
| 3 | U2.3.x | 3 | Combined Filter Tests |

## Startup Sequence

```
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md (Category 2 section)
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

### 1. U2.1.x - URL to State (9 tests)

**Spawn 9 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| U2.1.1 | `npx playwright test --grep "U2.1.1"` | ?manufacturer=Ford → dropdown shows Ford, table filtered |
| U2.1.2 | `npx playwright test --grep "U2.1.2"` | ?yearMin=2010&yearMax=2020 → year inputs populated |
| U2.1.3 | `npx playwright test --grep "U2.1.3"` | ?bodyClass=Pickup → dropdown shows Pickup |
| U2.1.4 | `npx playwright test --grep "U2.1.4"` | ?page=3&size=10 → page 3 displayed, 10 rows |
| U2.1.5 | `npx playwright test --grep "U2.1.5"` | ?sortBy=year&sortOrder=desc → sorted descending |
| U2.1.6 | `npx playwright test --grep "U2.1.6"` | ?h_manufacturer=Tesla → Tesla highlighted |
| U2.1.7 | `npx playwright test --grep "U2.1.7"` | ?manufacturer=Chevrolet&h_yearMin=2015&h_yearMax=2020 |
| U2.1.8 | `npx playwright test --grep "U2.1.8"` | ?models=Ford:Mustang,Chevrolet:Camaro |
| U2.1.9 | `npx playwright test --grep "U2.1.9"` | ?search=mustang → search input populated |

**After all 9 subagents return:**
```bash
ls e2e/screenshots/U2.1.* | wc -l  # Must show at least 9 files
```

Commit message: `Complete U2.1.x URL to state tests (9 tests)`

---

### 2. U2.2.x - State to URL (10 tests)

**Spawn 10 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| U2.2.1 | `npx playwright test --grep "U2.2.1"` | Select Dodge → URL contains manufacturer=Dodge |
| U2.2.2 | `npx playwright test --grep "U2.2.2"` | Set year range → URL contains yearMin/yearMax |
| U2.2.3 | `npx playwright test --grep "U2.2.3"` | Select SUV → URL contains bodyClass=SUV |
| U2.2.4 | `npx playwright test --grep "U2.2.4"` | Click page 4 → URL contains page=4 |
| U2.2.5 | `npx playwright test --grep "U2.2.5"` | Change size to 50 → URL contains size=50 |
| U2.2.6 | `npx playwright test --grep "U2.2.6"` | Click year column → URL contains sortBy=year |
| U2.2.7 | `npx playwright test --grep "U2.2.7"` | Toggle descending → URL contains sortOrder=desc |
| U2.2.8 | `npx playwright test --grep "U2.2.8"` | Type "camaro" → URL contains search=camaro |
| U2.2.9 | `npx playwright test --grep "U2.2.9"` | Clear all → URL has no filter parameters |
| U2.2.10 | `npx playwright test --grep "U2.2.10"` | Apply highlight → URL contains h_manufacturer |

**After all 10 subagents return:**
```bash
ls e2e/screenshots/U2.2.* | wc -l  # Must show at least 10 files
```

Commit message: `Complete U2.2.x state to URL tests (10 tests)`

---

### 3. U2.3.x - Combined Filter Tests (3 tests)

**Spawn 3 subagents in parallel**, one for each test:

| Test ID | Command | Description |
|---------|---------|-------------|
| U2.3.1 | `npx playwright test --grep "U2.3.1"` | Multiple filters: manufacturer+year+bodyClass |
| U2.3.2 | `npx playwright test --grep "U2.3.2"` | Filter + sort + pagination combined |
| U2.3.3 | `npx playwright test --grep "U2.3.3"` | Filter + highlight combined |

**After all 3 subagents return:**
```bash
ls e2e/screenshots/U2.3.* | wc -l  # Must show at least 3 files
```

Commit message: `Complete U2.3.x combined filter tests (3 tests)`

---

## Category Completion

After all 3 subsections are complete:

```bash
# Verify total screenshots
ls e2e/screenshots/U2.* | wc -l  # Must output: 22

# Verify all test IDs present
for id in U2.1.1 U2.1.2 U2.1.3 U2.1.4 U2.1.5 U2.1.6 U2.1.7 U2.1.8 U2.1.9 U2.2.1 U2.2.2 U2.2.3 U2.2.4 U2.2.5 U2.2.6 U2.2.7 U2.2.8 U2.2.9 U2.2.10 U2.3.1 U2.3.2 U2.3.3; do
  ls e2e/screenshots/${id}-*.png 2>/dev/null || echo "MISSING: $id"
done

# Verify spec file test count
grep -c "test('" e2e/tests/category-2-url-conformity.spec.ts  # Must output: 22
```

**STOP HERE.** Inform the user that Category 2 is complete. Do not proceed to Category 3 in this session.

Final commit: `Category 2 URL-First Conformity Tests complete (22/22 tests)`
