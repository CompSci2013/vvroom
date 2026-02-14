# Category 7: Error Handling Tests

**Session Scope:** 7 tests (single subsection)

## Prerequisites

Before starting, ensure:
- Categories 1-6 are complete
- API is accessible: `curl http://generic-prime.minilab/api/specs/v1/vehicles/details?size=1`

## Test List

| Test ID | Invalid Input | Expected Behavior |
|---------|--------------|-------------------|
| E7.1 | ?manufacturer=InvalidBrand | Graceful handling, ignored or defaulted |
| E7.2 | ?yearMin=3000 | Invalid year handled gracefully |
| E7.3 | ?page=-1 | Returns to valid page (1) |
| E7.4 | ?size=10000 | Capped to maximum allowed size |
| E7.5 | ?sortBy=invalidField | Sort ignored, default order used |
| E7.6 | ?search= (empty) | Treated as no search |
| E7.7 | Special characters in search | Properly escaped/handled |

## Startup Sequence

```
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md (Category 7 section)
Read ~/projects/vvroom/textbook-quality/kickoff-prompt.md
```

## Test Implementation

All tests verify the application handles edge cases gracefully without crashing.

### E7.1 - Invalid manufacturer

```typescript
await page.goto(`${BASE_URL}/discover?manufacturer=InvalidBrandXYZ123`);
// Should show no results or ignore invalid param, page should not crash
```

### E7.2 - Invalid year (future)

```typescript
await page.goto(`${BASE_URL}/discover?yearMin=3000`);
// Should show no results or handle gracefully
```

### E7.3 - Negative page number

```typescript
await page.goto(`${BASE_URL}/discover?page=-1`);
// Should default to page 1
```

### E7.4 - Very large page size

```typescript
await page.goto(`${BASE_URL}/discover?size=10000`);
// Should cap to maximum or handle gracefully
```

### E7.5 - Invalid sort field

```typescript
await page.goto(`${BASE_URL}/discover?sortBy=invalidField`);
// Should use default sort or ignore
```

### E7.6 - Empty search

```typescript
await page.goto(`${BASE_URL}/discover?search=`);
// Should treat as no search, show all results
```

### E7.7 - Special characters in search

```typescript
await page.goto(`${BASE_URL}/discover?search=${encodeURIComponent('<script>alert("xss")</script>')}`);
// Should not execute script, handle gracefully
```

## Category Completion

After all 7 tests are complete:

```bash
# Verify total screenshots
ls e2e/screenshots/E7.* | wc -l  # Must output: 7

# Verify all test IDs present
for id in E7.1 E7.2 E7.3 E7.4 E7.5 E7.6 E7.7; do
  ls e2e/screenshots/${id}-*.png 2>/dev/null || echo "MISSING: $id"
done

# Verify spec file test count
grep -c "test('" e2e/tests/category-7-error-handling.spec.ts  # Must output: 7
```

**STOP HERE.** Inform the user that Category 7 is complete. Do not proceed to Category 8 in this session.

Final commit: `Category 7 Error Handling Tests complete (7/7 tests)`
