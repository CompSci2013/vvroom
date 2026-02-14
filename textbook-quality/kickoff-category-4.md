# Category 4: Pop-Out Behavior Tests

**Session Scope:** 21 tests across 5 subsections

## Prerequisites

Before starting, ensure:
- Categories 1-3 are complete
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

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
Read ~/projects/vvroom/textbook-quality/screenshot-requirements.md
Read ~/projects/vvroom/textbook-quality/kickoff-prompt.md
```

## Test Library Setup

If test-lib helper is not in e2e/tests/, copy it:

```bash
cp ~/projects/vvroom/test-lib/screenshot-helper.ts ~/projects/vvroom/e2e/tests/
```

## Workflow for Each Subsection

### 1. P4.1.x - Pop-Out Window Rendering (6 tests)

**Tests:**
- P4.1.1: Pop out results table → displays in new window
- P4.1.2: Pop out statistics panel → displays in new window
- P4.1.3: Pop out filter panel → displays in new window
- P4.1.4: Pop-out URL contains /panel/ route path
- P4.1.5: Pop-out hides site banner/header
- P4.1.6: Main window shows placeholder for popped-out component

**After completing all 6 tests:**
```bash
ls e2e/screenshots/P4.1.* | wc -l  # Must output: 6
```

Commit message: `Complete P4.1.x pop-out rendering tests (6 tests)`

---

### 2. P4.2.x - Pop-Out Synchronization (6 tests)

**Tests:**
- P4.2.1: Change filter in main window → pop-out updates
- P4.2.2: Change filter in pop-out → main window URL updates
- P4.2.3: Change sort in main window → pop-out re-sorts
- P4.2.4: Apply highlight in pop-out → main window updates
- P4.2.5: Navigate page in main window → pop-out shows same page
- P4.2.6: Clear filters in main window → pop-out clears

**After completing all 6 tests:**
```bash
ls e2e/screenshots/P4.2.* | wc -l  # Must output: 6
```

Commit message: `Complete P4.2.x pop-out synchronization tests (6 tests)`

---

### 3. P4.3.x - Pop-Out API Behavior (4 tests)

**Tests:**
- P4.3.1: Pop-out does NOT update its own URL after load
- P4.3.2: Pop-out does NOT make its own API calls
- P4.3.3: Pop-out receives data via BroadcastChannel
- P4.3.4: Main window API refresh updates pop-outs

**After completing all 4 tests:**
```bash
ls e2e/screenshots/P4.3.* | wc -l  # Must output: 4
```

Commit message: `Complete P4.3.x pop-out API behavior tests (4 tests)`

---

### 4. P4.4.x - Multiple Pop-Out Tests (5 tests)

**Tests:**
- P4.4.1: Open two pop-outs of same type → both show identical state
- P4.4.2: Open pop-outs of different types → each receives updates
- P4.4.3: Change in one pop-out → updates all windows
- P4.4.4: Close pop-out → main window continues normally
- P4.4.5: Close main window → pop-outs handle gracefully

**After completing all 5 tests:**
```bash
ls e2e/screenshots/P4.4.* | wc -l  # Must output: 5
```

Commit message: `Complete P4.4.x multiple pop-out tests (5 tests)`

---

### 5. P4.5.x - Pop-Out with URL Parameters (4 tests)

**Tests:**
- P4.5.1: ?manufacturer=Ford → pop-out shows Ford vehicles
- P4.5.2: ?h_manufacturer=Tesla → pop-out shows Tesla highlighted
- P4.5.3: ?sortBy=year&sortOrder=desc → pop-out table sorted
- P4.5.4: ?page=3&size=10 → pop-out shows page 3

**After completing all 4 tests:**
```bash
ls e2e/screenshots/P4.5.* | wc -l  # Must output: 4
```

Commit message: `Complete P4.5.x pop-out with URL parameters tests (4 tests)`

---

## Category Completion

After all 5 subsections are complete:

```bash
# Verify total screenshots
ls e2e/screenshots/P4.* | wc -l  # Must output: 21

# Verify all test IDs present
for id in P4.1.1 P4.1.2 P4.1.3 P4.1.4 P4.1.5 P4.1.6 P4.2.1 P4.2.2 P4.2.3 P4.2.4 P4.2.5 P4.2.6 P4.3.1 P4.3.2 P4.3.3 P4.3.4 P4.4.1 P4.4.2 P4.4.3 P4.4.4 P4.4.5 P4.5.1 P4.5.2 P4.5.3 P4.5.4; do
  ls e2e/screenshots/${id}-*.png 2>/dev/null || echo "MISSING: $id"
done

# Verify spec file test count
grep -c "test('" e2e/tests/category-4-popout-behavior.spec.ts  # Must output: 21
```

**STOP HERE.** Inform the user that Category 4 is complete. Do not proceed to Category 5 in this session.

Final commit: `Category 4 Pop-Out Behavior Tests complete (21/21 tests)`
