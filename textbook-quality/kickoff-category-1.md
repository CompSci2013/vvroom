# Category 1: Visual Appearance Tests

**Session Scope:** 41 tests across 9 subsections

## Prerequisites

Before starting, ensure:
- e2e/ directory is clean (or contains only completed work from previous sessions)
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

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
Read ~/projects/vvroom/textbook-quality/kickoff-prompt.md
```

## Workflow for Each Subsection

### 1. V1.1.x - Default State Rendering (5 tests)

**Tests:**
- V1.1.1: Results Table default render
- V1.1.2: Filter Panel default render
- V1.1.3: Pagination default render
- V1.1.4: Statistics Panel default render
- V1.1.5: Search Input default render

**After completing all 5 tests:**
```bash
ls e2e/screenshots/V1.1.* | wc -l  # Must output: 5
```

Commit message: `Complete V1.1.x default state rendering tests (5 tests)`

---

### 2. V1.2.x - Filtered State Rendering (5 tests)

**Tests:**
- V1.2.1: Results table filtered by manufacturer (Ford)
- V1.2.2: Results table filtered by body class (SUV)
- V1.2.3: Results table filtered by year range (2020-2024)
- V1.2.4: Statistics filtered by manufacturer (Chevrolet)
- V1.2.5: Results table with model combinations

**After completing all 5 tests:**
```bash
ls e2e/screenshots/V1.2.* | wc -l  # Must output: 5
```

Commit message: `Complete V1.2.x filtered state rendering tests (5 tests)`

---

### 3. V1.3.x - Highlighted State Rendering (4 tests)

**Tests:**
- V1.3.1: Statistics charts highlight Tesla
- V1.3.2: Statistics charts highlight year range (2015-2020)
- V1.3.3: Statistics charts highlight body class (Pickup)
- V1.3.4: Statistics charts filter with highlight

**Panel visibility:** Keep Query Control + Statistics expanded, collapse others.

**After completing all 4 tests:**
```bash
ls e2e/screenshots/V1.3.* | wc -l  # Must output: 4
```

Commit message: `Complete V1.3.x highlighted state rendering tests (4 tests)`

---

### 4. V1.4.x - Sorted State Rendering (3 tests)

**Tests:**
- V1.4.1: Results table sorted by year descending
- V1.4.2: Results table sorted by manufacturer ascending
- V1.4.3: Results table sorted by instance count descending

**After completing all 3 tests:**
```bash
ls e2e/screenshots/V1.4.* | wc -l  # Must output: 3
```

Commit message: `Complete V1.4.x sorted state rendering tests (3 tests)`

---

### 5. V1.5.x - Paginated State Rendering (3 tests)

**Tests:**
- V1.5.1: Results table page 2 with 10 rows
- V1.5.2: Pagination control page 5
- V1.5.3: Results table last page

**After completing all 3 tests:**
```bash
ls e2e/screenshots/V1.5.* | wc -l  # Must output: 3
```

Commit message: `Complete V1.5.x paginated state rendering tests (3 tests)`

---

### 6. V1.6.x - Collapsed/Expanded Panel State (6 tests)

**Tests:**
- V1.6.1: Query Control collapsed
- V1.6.2: Query Panel collapsed
- V1.6.3: Manufacturer-Model Picker collapsed
- V1.6.4: All Panels expanded (default)
- V1.6.5: All Panels collapsed
- V1.6.6: Mixed State (some collapsed, some expanded)

**After completing all 6 tests:**
```bash
ls e2e/screenshots/V1.6.* | wc -l  # Must output: 6
```

Commit message: `Complete V1.6.x panel state rendering tests (6 tests)`

---

### 7. V1.7.x - Pagination Interaction (Popped-In) (7 tests)

**Tests:**
- V1.7.1: Picker Table click page 2
- V1.7.2: Picker Table click page 3
- V1.7.3: Picker Table change rows to 10
- V1.7.4: Picker Table change rows to 50
- V1.7.5: Picker Table change rows to 100
- V1.7.6: Results Table navigate via URL ?page=2
- V1.7.7: Results Table navigate via URL ?size=50

**After completing all 7 tests:**
```bash
ls e2e/screenshots/V1.7.* | wc -l  # Must output: 7
```

Commit message: `Complete V1.7.x pagination interaction (popped-in) tests (7 tests)`

---

### 8. V1.8.x - Pagination Interaction (Popped-Out) (3 tests)

**Tests:**
- V1.8.1: Picker Table (pop-out) click page 2
- V1.8.2: Picker Table (pop-out) change rows to 50
- V1.8.3: Picker Table (pop-out) change rows to 100

**After completing all 3 tests:**
```bash
ls e2e/screenshots/V1.8.* | wc -l  # Must output: 3
```

Commit message: `Complete V1.8.x pagination interaction (popped-out) tests (3 tests)`

---

### 9. V1.9.x - Picker Selection and Apply (5 tests)

**Tests:**
- V1.9.1: Picker (in) select rows before Apply
- V1.9.2: Picker (in) after Apply clicked
- V1.9.3: Picker (out) select rows before Apply
- V1.9.4: Picker (out) after Apply clicked
- V1.9.5: Picker (in) clear selection

**After completing all 5 tests:**
```bash
ls e2e/screenshots/V1.9.* | wc -l  # Must output: 5
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
