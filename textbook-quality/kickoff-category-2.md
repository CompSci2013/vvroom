# Category 2: URL-First Conformity Tests

**Session Scope:** 22 tests across 3 subsections

## Prerequisites

Before starting, ensure:
- Category 1 is complete (41 screenshots in e2e/screenshots/V1.*)
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

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

If test-lib helper is not in e2e/tests/, copy it:

```bash
cp ~/projects/vvroom/test-lib/screenshot-helper.ts ~/projects/vvroom/e2e/tests/
```

## Workflow for Each Subsection

### 1. U2.1.x - URL to State (9 tests)

**Tests:**
- U2.1.1: ?manufacturer=Ford → dropdown shows Ford, table filtered
- U2.1.2: ?yearMin=2010&yearMax=2020 → year inputs populated, table filtered
- U2.1.3: ?bodyClass=Pickup → dropdown shows Pickup, table filtered
- U2.1.4: ?page=3&size=10 → page 3 displayed, 10 rows visible
- U2.1.5: ?sortBy=year&sortOrder=desc → year column sorted descending
- U2.1.6: ?h_manufacturer=Tesla → Tesla rows highlighted
- U2.1.7: ?manufacturer=Chevrolet&h_yearMin=2015&h_yearMax=2020 → filter + highlight
- U2.1.8: ?models=Ford:Mustang,Chevrolet:Camaro → model combinations filter
- U2.1.9: ?search=mustang → search input contains "mustang"

**After completing all 9 tests:**
```bash
ls e2e/screenshots/U2.1.* | wc -l  # Must output: 9
```

Commit message: `Complete U2.1.x URL to state tests (9 tests)`

---

### 2. U2.2.x - State to URL (10 tests)

**Tests:**
- U2.2.1: Select Dodge from manufacturer → URL contains manufacturer=Dodge
- U2.2.2: Set year range 2000-2010 → URL contains yearMin=2000&yearMax=2010
- U2.2.3: Select SUV body class → URL contains bodyClass=SUV
- U2.2.4: Click page 4 → URL contains page=4
- U2.2.5: Change page size to 50 → URL contains size=50
- U2.2.6: Click year column header → URL contains sortBy=year
- U2.2.7: Click sort toggle for descending → URL contains sortOrder=desc
- U2.2.8: Type "camaro" in search → URL contains search=camaro
- U2.2.9: Clear all filters button → URL has no filter parameters
- U2.2.10: Apply highlight for manufacturer → URL contains h_manufacturer=...

**After completing all 10 tests:**
```bash
ls e2e/screenshots/U2.2.* | wc -l  # Must output: 10
```

Commit message: `Complete U2.2.x state to URL tests (10 tests)`

---

### 3. U2.3.x - Combined Filter Tests (3 tests)

**Tests:**
- U2.3.1: ?manufacturer=Ford&yearMin=2015&yearMax=2020&bodyClass=Coupe → all filters applied
- U2.3.2: ?manufacturer=Chevrolet&sortBy=year&sortOrder=desc&page=2&size=10 → filter + sort + pagination
- U2.3.3: ?bodyClass=SUV&h_manufacturer=Jeep → SUVs filtered, Jeep highlighted

**After completing all 3 tests:**
```bash
ls e2e/screenshots/U2.3.* | wc -l  # Must output: 3
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
