# Category 6: Router Navigate Encapsulation Tests

**Session Scope:** 4 tests (code analysis, no screenshots)

## Prerequisites

Before starting, ensure:
- Categories 1-5 are complete
- No server needed - these are static code analysis tests

## Test List

| Test ID | Description |
|---------|-------------|
| R6.1 | router.navigate only appears in UrlStateService |
| R6.2 | Components do not call router.navigate directly |
| R6.3 | Pop-out components do not call router.navigate |
| R6.4 | UrlStateService has setParams method for navigation |

## Startup Sequence

```
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md (Category 6 section)
Read ~/projects/vvroom/textbook-quality/kickoff-prompt.md
```

**Note:** Category 6 tests are code analysis only (no screenshots needed).

## Test Implementation

These tests use grep to analyze the codebase, not Playwright browser tests.

### R6.1 - router.navigate only in UrlStateService

```bash
# Find all router.navigate calls
grep -rn "router\.navigate" ~/projects/vvroom/src --include="*.ts"

# All results must be in url-state.service.ts (or .spec.ts files)
```

### R6.2 - Components do not call router.navigate

```bash
# Check component files
grep -rn "router\.navigate" ~/projects/vvroom/src/app --include="*.component.ts"

# Should return no results
```

### R6.3 - Pop-out components do not call router.navigate

```bash
# Check pop-out related files
grep -rn "router\.navigate" ~/projects/vvroom/src/app --include="*popout*.ts" --include="*pop-out*.ts"

# Should return no results
```

### R6.4 - UrlStateService has setParams method

```bash
# Verify UrlStateService exists and has navigation methods
grep -n "setParams\|clearParams\|router\.navigate" ~/projects/vvroom/src/app/framework/services/url-state.service.ts

# Should return results showing the navigation abstraction
```

## Journal Entry Format

For code analysis tests, the journal entry format is:

```markdown
YYYY-MM-DD_HH:MM:SS
Test R6.1 - router.navigate only in UrlStateService: PASS
Verified: grep found 3 occurrences of router.navigate, all in url-state.service.ts
No violations in component or pop-out files
```

## Category Completion

After all 4 tests are complete:

```bash
# Verify spec file exists and has 4 tests
grep -c "test('" e2e/tests/category-6-router-encapsulation.spec.ts  # Must output: 4
```

Update test-checklist.md with all 4 tests marked complete (no screenshot column needed).

**STOP HERE.** Inform the user that Category 6 is complete. Do not proceed to Category 7 in this session.

Final commit: `Category 6 Router Encapsulation Tests complete (4/4 tests)`
