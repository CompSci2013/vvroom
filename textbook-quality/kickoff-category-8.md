# Category 8: Visual Verification Tests

**Session Scope:** 15 tests across 4 subsections

## Prerequisites

Before starting, ensure:
- Categories 1-7 are complete
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

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
Read ~/projects/vvroom/textbook-quality/screenshot-requirements.md
Read ~/projects/vvroom/textbook-quality/kickoff-prompt.md
```

## Test Library Setup

If test-lib helper is not in e2e/tests/, copy it:

```bash
cp ~/projects/vvroom/test-lib/screenshot-helper.ts ~/projects/vvroom/e2e/tests/
```

## Workflow for Each Subsection

### 1. VS8.1.x - Default State Screenshots (5 tests)

**Tests:**
- VS8.1.1: Full page default state (/)
- VS8.1.2: Results table default state
- VS8.1.3: Filter panel default state
- VS8.1.4: Statistics panel default state
- VS8.1.5: Pagination default state

**After completing all 5 tests:**
```bash
ls e2e/screenshots/VS8.1.* | wc -l  # Must output: 5
```

Commit message: `Complete VS8.1.x default state visual tests (5 tests)`

---

### 2. VS8.2.x - Filtered State Screenshots (4 tests)

**Tests:**
- VS8.2.1: Full page filtered by Ford (?manufacturer=Ford)
- VS8.2.2: Full page filtered by SUV (?bodyClass=SUV)
- VS8.2.3: Full page filtered by recent years (?yearMin=2020&yearMax=2024)
- VS8.2.4: Full page with combined filters (?manufacturer=Chevrolet&bodyClass=Pickup)

**After completing all 4 tests:**
```bash
ls e2e/screenshots/VS8.2.* | wc -l  # Must output: 4
```

Commit message: `Complete VS8.2.x filtered state visual tests (4 tests)`

---

### 3. VS8.3.x - Highlighted State Screenshots (3 tests)

**Tests:**
- VS8.3.1: Full page with Tesla highlight (?h_manufacturer=Tesla)
- VS8.3.2: Full page with year range highlight (?h_yearMin=2015&h_yearMax=2020)
- VS8.3.3: Full page with filter and highlight (?manufacturer=Ford&h_yearMin=2018&h_yearMax=2022)

**Panel visibility:** Keep Query Control + Statistics expanded, collapse others.

**After completing all 3 tests:**
```bash
ls e2e/screenshots/VS8.3.* | wc -l  # Must output: 3
```

Commit message: `Complete VS8.3.x highlighted state visual tests (3 tests)`

---

### 4. VS8.4.x - Pop-Out Screenshots (3 tests)

**Tests:**
- VS8.4.1: Results table pop-out (standalone + with main)
- VS8.4.2: Statistics pop-out (standalone + with main)
- VS8.4.3: Filter panel pop-out (standalone + with main)

**Note:** Each test produces 2 screenshots (standalone and with-main views).

**After completing all 3 tests:**
```bash
ls e2e/screenshots/VS8.4.* | wc -l  # Must output: 6 (2 per test)
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
