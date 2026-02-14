# Category 5: Cross-Window Synchronization Tests

**Session Scope:** 10 tests across 3 subsections

## Prerequisites

Before starting, ensure:
- Categories 1-4 are complete
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

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
Read ~/projects/vvroom/textbook-quality/kickoff-prompt.md
```

## Workflow for Each Subsection

### 1. S5.1.x - Main Window to Pop-Out (7 tests)

**Tests:**
- S5.1.1: Change manufacturer filter in main → pop-out filters
- S5.1.2: Apply year range filter in main → pop-out shows range
- S5.1.3: Change sort column in main → pop-out re-sorts
- S5.1.4: Change page in main → pop-out shows same page
- S5.1.5: Apply highlight in main → pop-out highlights
- S5.1.6: Clear all filters in main → pop-out clears
- S5.1.7: Type in search in main → pop-out shows results

**After completing all 7 tests:**
```bash
ls e2e/screenshots/S5.1.* | wc -l  # Must output: 7
```

Commit message: `Complete S5.1.x main window to pop-out tests (7 tests)`

---

### 2. S5.2.x - Pop-Out to Main Window (3 tests)

**Tests:**
- S5.2.1: Change highlight filter in pop-out → main window URL updates
- S5.2.2: Apply filter in pop-out → main window URL updates
- S5.2.3: Clear filters in pop-out → main window URL clears

**After completing all 3 tests:**
```bash
ls e2e/screenshots/S5.2.* | wc -l  # Must output: 3
```

Commit message: `Complete S5.2.x pop-out to main window tests (3 tests)`

---

### 3. S5.3.x - BroadcastChannel Verification (3 tests)

**Tests:**
- S5.3.1: Filter change sends BroadcastChannel message
- S5.3.2: Pop-out receives message (syncStateFromExternal called)
- S5.3.3: Pop-out sends message → main window receives

**After completing all 3 tests:**
```bash
ls e2e/screenshots/S5.3.* | wc -l  # Must output: 3
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
