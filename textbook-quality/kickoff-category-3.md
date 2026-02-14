# Category 3: URL Change Consistency Tests

**Session Scope:** 14 tests across 3 subsections

## Prerequisites

Before starting, ensure:
- Categories 1-2 are complete
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

## Subsection Execution Order

| Order | Subsection | Tests | Description |
|-------|------------|-------|-------------|
| 1 | U3.1.x | 6 | Browser Navigation (back/forward) |
| 2 | U3.2.x | 5 | Manual URL Edits |
| 3 | U3.3.x | 3 | URL Sharing |

## Startup Sequence

```
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md (Category 3 section)
Read ~/projects/vvroom/textbook-quality/kickoff-prompt.md
```

## Workflow for Each Subsection

### 1. U3.1.x - Browser Navigation (6 tests)

**Tests:**
- U3.1.1: Select Ford → Select Chevrolet → Back → Ford restored
- U3.1.2: Page 3 → Page 5 → Back → Back → pages restored
- U3.1.3: Apply sort → Apply filter → Back → sort remains, filter removed
- U3.1.4: Apply highlight → Back → highlight removed
- U3.1.5: Clear filters → Back → filters restored
- U3.1.6: Multiple Back → Forward → state restored correctly

**After completing all 6 tests:**
```bash
ls e2e/screenshots/U3.1.* | wc -l  # Must output: 6
```

Commit message: `Complete U3.1.x browser navigation tests (6 tests)`

---

### 2. U3.2.x - Manual URL Edits (5 tests)

**Tests:**
- U3.2.1: Change manufacturer=Ford to manufacturer=Dodge in URL
- U3.2.2: Add &yearMin=2010 to existing URL
- U3.2.3: Remove page=3 from URL → returns to page 1
- U3.2.4: Change sortOrder=asc to sortOrder=desc
- U3.2.5: Paste completely new URL with different filters

**After completing all 5 tests:**
```bash
ls e2e/screenshots/U3.2.* | wc -l  # Must output: 5
```

Commit message: `Complete U3.2.x manual URL edit tests (5 tests)`

---

### 3. U3.3.x - URL Sharing (3 tests)

**Tests:**
- U3.3.1: Copy URL with filters, paste in new tab → identical state
- U3.3.2: Copy URL with highlights, paste in new tab → highlights applied
- U3.3.3: Copy URL with pagination, paste in incognito → same page displayed

**After completing all 3 tests:**
```bash
ls e2e/screenshots/U3.3.* | wc -l  # Must output: 3
```

Commit message: `Complete U3.3.x URL sharing tests (3 tests)`

---

## Category Completion

After all 3 subsections are complete:

```bash
# Verify total screenshots
ls e2e/screenshots/U3.* | wc -l  # Must output: 14

# Verify all test IDs present
for id in U3.1.1 U3.1.2 U3.1.3 U3.1.4 U3.1.5 U3.1.6 U3.2.1 U3.2.2 U3.2.3 U3.2.4 U3.2.5 U3.3.1 U3.3.2 U3.3.3; do
  ls e2e/screenshots/${id}-*.png 2>/dev/null || echo "MISSING: $id"
done

# Verify spec file test count
grep -c "test('" e2e/tests/category-3-url-consistency.spec.ts  # Must output: 14
```

**STOP HERE.** Inform the user that Category 3 is complete. Do not proceed to Category 4 in this session.

Final commit: `Category 3 URL Change Consistency Tests complete (14/14 tests)`
