# Test Execution Checklist

## Instructions

This checklist tracks completion of every test in test-rubric.md. After completing each test:

1. Mark the checkbox with `[x]`
2. Add the screenshot filename
3. Add the commit hash (after pushing)

**CRITICAL:** Do not proceed to the next subsection until all tests in the current subsection are checked off.

**Verification:** After completing each subsection, run this command to verify screenshot exists:
```bash
ls -la e2e/screenshots/ | grep -E "^V1\.1\.[0-9]+-" | wc -l  # Should match subsection count
```

---

## Category 1: Visual Appearance Tests (41 tests)

### 1.1 Default State Rendering (5 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [x] | V1.1.1 | V1.1.1-results-table-default.png | 0ecb149 |
| [x] | V1.1.2 | V1.1.2-filter-panel-default.png | 0ecb149 |
| [x] | V1.1.3 | V1.1.3-pagination-default.png | 0ecb149 |
| [x] | V1.1.4 | V1.1.4-statistics-default.png | 0ecb149 |
| [x] | V1.1.5 | V1.1.5-search-default.png | 0ecb149 |

**Subsection verification:** `ls e2e/screenshots/V1.1.* | wc -l` should equal 5

### 1.2 Filtered State Rendering (5 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [x] | V1.2.1 | V1.2.1-results-table-filtered-ford.png | 68b38fb |
| [x] | V1.2.2 | V1.2.2-results-table-filtered-suv.png | 68b38fb |
| [x] | V1.2.3 | V1.2.3-results-table-filtered-recent.png | 68b38fb |
| [x] | V1.2.4 | V1.2.4-statistics-filtered-chevrolet.png | 68b38fb |
| [x] | V1.2.5 | V1.2.5-results-table-model-combos.png | 68b38fb |

**Subsection verification:** `ls e2e/screenshots/V1.2.* | wc -l` should equal 5

### 1.3 Highlighted State Rendering (4 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [x] | V1.3.1 | V1.3.1-statistics-highlight-tesla.png | 1f5c027 |
| [x] | V1.3.2 | V1.3.2-statistics-highlight-years.png | 1f5c027 |
| [x] | V1.3.3 | V1.3.3-statistics-highlight-pickup.png | 1f5c027 |
| [x] | V1.3.4 | V1.3.4-statistics-filter-with-highlight.png | 1f5c027 |

**Subsection verification:** `ls e2e/screenshots/V1.3.* | wc -l` should equal 4

### 1.4 Sorted State Rendering (3 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [x] | V1.4.1 | V1.4.1-results-table-sorted-year-desc.png | 048202a |
| [x] | V1.4.2 | V1.4.2-results-table-sorted-manufacturer-asc.png | 048202a |
| [x] | V1.4.3 | V1.4.3-results-table-sorted-instancecount-desc.png | 048202a |

**Subsection verification:** `ls e2e/screenshots/V1.4.* | wc -l` should equal 3

### 1.5 Paginated State Rendering (3 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [x] | V1.5.1 | V1.5.1-results-table-paginated-page2.png | 71afd1e |
| [x] | V1.5.2 | V1.5.2-pagination-page5.png | 71afd1e |
| [x] | V1.5.3 | V1.5.3-results-table-last-page.png | 71afd1e |

**Subsection verification:** `ls e2e/screenshots/V1.5.* | wc -l` should equal 3

### 1.6 Collapsed/Expanded Panel State Rendering (6 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [x] | V1.6.1 | V1.6.1-query-control-collapsed.png | 9505ada |
| [x] | V1.6.2 | V1.6.2-query-panel-collapsed.png | 9505ada |
| [x] | V1.6.3 | V1.6.3-picker-collapsed.png | 9505ada |
| [x] | V1.6.4 | V1.6.4-all-panels-expanded.png | 9505ada |
| [x] | V1.6.5 | V1.6.5-all-panels-collapsed.png | 9505ada |
| [x] | V1.6.6 | V1.6.6-panels-mixed-state.png | 9505ada |

**Subsection verification:** `ls e2e/screenshots/V1.6.* | wc -l` should equal 6

### 1.7 Pagination Interaction Tests - Popped-In (7 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [x] | V1.7.1 | V1.7.1-picker-page2.png | 11be610 |
| [x] | V1.7.2 | V1.7.2-picker-page3.png | 11be610 |
| [x] | V1.7.3 | V1.7.3-picker-rows-10.png | 11be610 |
| [x] | V1.7.4 | V1.7.4-picker-rows-50.png | 11be610 |
| [x] | V1.7.5 | V1.7.5-picker-rows-100.png | 11be610 |
| [x] | V1.7.6 | V1.7.6-results-page2-url.png | 11be610 |
| [x] | V1.7.7 | V1.7.7-results-rows-50-url.png | 11be610 |

**Subsection verification:** `ls e2e/screenshots/V1.7.* | wc -l` should equal 7

### 1.8 Pagination Interaction Tests - Popped-Out (3 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [x] | V1.8.1 | V1.8.1-picker-popout-page2.png | 5f21121 |
| [x] | V1.8.2 | V1.8.2-picker-popout-rows-50.png | 5f21121 |
| [x] | V1.8.3 | V1.8.3-picker-popout-rows-100.png | 5f21121 |

**Subsection verification:** `ls e2e/screenshots/V1.8.* | wc -l` should equal 3

### 1.9 Picker Selection and Apply Tests (5 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [x] | V1.9.1 | V1.9.1-picker-selected-before-apply.png | pending |
| [x] | V1.9.2 | V1.9.2-picker-after-apply.png | pending |
| [x] | V1.9.3 | V1.9.3-picker-popout-selected.png | pending |
| [x] | V1.9.4 | V1.9.4-picker-popout-after-apply.png | pending |
| [x] | V1.9.5 | V1.9.5-picker-cleared.png | pending |

**Subsection verification:** `ls e2e/screenshots/V1.9.* | wc -l` should equal 5

---

## Category 2: URL-First Conformity Tests (22 tests)

### 2.1 URL to State (9 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | U2.1.1 | | |
| [ ] | U2.1.2 | | |
| [ ] | U2.1.3 | | |
| [ ] | U2.1.4 | | |
| [ ] | U2.1.5 | | |
| [ ] | U2.1.6 | | |
| [ ] | U2.1.7 | | |
| [ ] | U2.1.8 | | |
| [ ] | U2.1.9 | | |

**Subsection verification:** `ls e2e/screenshots/U2.1.* | wc -l` should equal 9

### 2.2 State to URL (10 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | U2.2.1 | | |
| [ ] | U2.2.2 | | |
| [ ] | U2.2.3 | | |
| [ ] | U2.2.4 | | |
| [ ] | U2.2.5 | | |
| [ ] | U2.2.6 | | |
| [ ] | U2.2.7 | | |
| [ ] | U2.2.8 | | |
| [ ] | U2.2.9 | | |
| [ ] | U2.2.10 | | |

**Subsection verification:** `ls e2e/screenshots/U2.2.* | wc -l` should equal 10

### 2.3 Combined Filter Tests (3 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | U2.3.1 | | |
| [ ] | U2.3.2 | | |
| [ ] | U2.3.3 | | |

**Subsection verification:** `ls e2e/screenshots/U2.3.* | wc -l` should equal 3

---

## Category 3: URL Change Consistency Tests (14 tests)

### 3.1 Browser Navigation (6 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | U3.1.1 | | |
| [ ] | U3.1.2 | | |
| [ ] | U3.1.3 | | |
| [ ] | U3.1.4 | | |
| [ ] | U3.1.5 | | |
| [ ] | U3.1.6 | | |

**Subsection verification:** `ls e2e/screenshots/U3.1.* | wc -l` should equal 6

### 3.2 Manual URL Edits (5 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | U3.2.1 | | |
| [ ] | U3.2.2 | | |
| [ ] | U3.2.3 | | |
| [ ] | U3.2.4 | | |
| [ ] | U3.2.5 | | |

**Subsection verification:** `ls e2e/screenshots/U3.2.* | wc -l` should equal 5

### 3.3 URL Sharing (3 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | U3.3.1 | | |
| [ ] | U3.3.2 | | |
| [ ] | U3.3.3 | | |

**Subsection verification:** `ls e2e/screenshots/U3.3.* | wc -l` should equal 3

---

## Category 4: Pop-Out Behavior Tests (21 tests)

### 4.1 Pop-Out Window Rendering (6 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | P4.1.1 | | |
| [ ] | P4.1.2 | | |
| [ ] | P4.1.3 | | |
| [ ] | P4.1.4 | | |
| [ ] | P4.1.5 | | |
| [ ] | P4.1.6 | | |

**Subsection verification:** `ls e2e/screenshots/P4.1.* | wc -l` should equal 6

### 4.2 Pop-Out Synchronization (6 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | P4.2.1 | | |
| [ ] | P4.2.2 | | |
| [ ] | P4.2.3 | | |
| [ ] | P4.2.4 | | |
| [ ] | P4.2.5 | | |
| [ ] | P4.2.6 | | |

**Subsection verification:** `ls e2e/screenshots/P4.2.* | wc -l` should equal 6

### 4.3 Pop-Out API Behavior (4 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | P4.3.1 | | |
| [ ] | P4.3.2 | | |
| [ ] | P4.3.3 | | |
| [ ] | P4.3.4 | | |

**Subsection verification:** `ls e2e/screenshots/P4.3.* | wc -l` should equal 4

### 4.4 Multiple Pop-Out Tests (5 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | P4.4.1 | | |
| [ ] | P4.4.2 | | |
| [ ] | P4.4.3 | | |
| [ ] | P4.4.4 | | |
| [ ] | P4.4.5 | | |

**Subsection verification:** `ls e2e/screenshots/P4.4.* | wc -l` should equal 5

### 4.5 Pop-Out with URL Parameters (4 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | P4.5.1 | | |
| [ ] | P4.5.2 | | |
| [ ] | P4.5.3 | | |
| [ ] | P4.5.4 | | |

**Subsection verification:** `ls e2e/screenshots/P4.5.* | wc -l` should equal 4

---

## Category 5: Cross-Window Synchronization Tests (10 tests)

### 5.1 Main Window to Pop-Out (7 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | S5.1.1 | | |
| [ ] | S5.1.2 | | |
| [ ] | S5.1.3 | | |
| [ ] | S5.1.4 | | |
| [ ] | S5.1.5 | | |
| [ ] | S5.1.6 | | |
| [ ] | S5.1.7 | | |

**Subsection verification:** `ls e2e/screenshots/S5.1.* | wc -l` should equal 7

### 5.2 Pop-Out to Main Window (3 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | S5.2.1 | | |
| [ ] | S5.2.2 | | |
| [ ] | S5.2.3 | | |

**Subsection verification:** `ls e2e/screenshots/S5.2.* | wc -l` should equal 3

### 5.3 BroadcastChannel Verification (3 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | S5.3.1 | | |
| [ ] | S5.3.2 | | |
| [ ] | S5.3.3 | | |

**Subsection verification:** `ls e2e/screenshots/S5.3.* | wc -l` should equal 3

---

## Category 6: Router Navigate Encapsulation Tests (4 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | R6.1 | N/A (code grep) | |
| [ ] | R6.2 | N/A (code grep) | |
| [ ] | R6.3 | N/A (code grep) | |
| [ ] | R6.4 | N/A (code grep) | |

**Note:** Category 6 tests are code analysis tests, no screenshots required.

---

## Category 7: Error Handling Tests (7 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | E7.1 | | |
| [ ] | E7.2 | | |
| [ ] | E7.3 | | |
| [ ] | E7.4 | | |
| [ ] | E7.5 | | |
| [ ] | E7.6 | | |
| [ ] | E7.7 | | |

**Subsection verification:** `ls e2e/screenshots/E7.* | wc -l` should equal 7

---

## Category 8: Visual Verification Tests (15 tests)

### 8.1 Default State (5 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | VS8.1.1 | | |
| [ ] | VS8.1.2 | | |
| [ ] | VS8.1.3 | | |
| [ ] | VS8.1.4 | | |
| [ ] | VS8.1.5 | | |

**Subsection verification:** `ls e2e/screenshots/VS8.1.* | wc -l` should equal 5

### 8.2 Filtered State (4 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | VS8.2.1 | | |
| [ ] | VS8.2.2 | | |
| [ ] | VS8.2.3 | | |
| [ ] | VS8.2.4 | | |

**Subsection verification:** `ls e2e/screenshots/VS8.2.* | wc -l` should equal 4

### 8.3 Highlighted State (3 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | VS8.3.1 | | |
| [ ] | VS8.3.2 | | |
| [ ] | VS8.3.3 | | |

**Subsection verification:** `ls e2e/screenshots/VS8.3.* | wc -l` should equal 3

### 8.4 Pop-Out Screenshots (3 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | VS8.4.1 | | |
| [ ] | VS8.4.2 | | |
| [ ] | VS8.4.3 | | |

**Subsection verification:** `ls e2e/screenshots/VS8.4.* | wc -l` should equal 3

---

## Final Verification

After all tests complete, run:

```bash
# Count total screenshots (should be 137 - excludes 4 R6.x code tests)
ls e2e/screenshots/*.png | wc -l

# Verify all test IDs have screenshots
for id in V1.1.1 V1.1.2 V1.1.3 V1.1.4 V1.1.5 V1.2.1 V1.2.2 V1.2.3 V1.2.4 V1.2.5 V1.3.1 V1.3.2 V1.3.3 V1.3.4 V1.4.1 V1.4.2 V1.4.3 V1.5.1 V1.5.2 V1.5.3 V1.6.1 V1.6.2 V1.6.3 V1.6.4 V1.6.5 V1.6.6 V1.7.1 V1.7.2 V1.7.3 V1.7.4 V1.7.5 V1.7.6 V1.7.7 V1.8.1 V1.8.2 V1.8.3 V1.9.1 V1.9.2 V1.9.3 V1.9.4 V1.9.5 U2.1.1 U2.1.2 U2.1.3 U2.1.4 U2.1.5 U2.1.6 U2.1.7 U2.1.8 U2.1.9 U2.2.1 U2.2.2 U2.2.3 U2.2.4 U2.2.5 U2.2.6 U2.2.7 U2.2.8 U2.2.9 U2.2.10 U2.3.1 U2.3.2 U2.3.3 U3.1.1 U3.1.2 U3.1.3 U3.1.4 U3.1.5 U3.1.6 U3.2.1 U3.2.2 U3.2.3 U3.2.4 U3.2.5 U3.3.1 U3.3.2 U3.3.3 P4.1.1 P4.1.2 P4.1.3 P4.1.4 P4.1.5 P4.1.6 P4.2.1 P4.2.2 P4.2.3 P4.2.4 P4.2.5 P4.2.6 P4.3.1 P4.3.2 P4.3.3 P4.3.4 P4.4.1 P4.4.2 P4.4.3 P4.4.4 P4.4.5 P4.5.1 P4.5.2 P4.5.3 P4.5.4 S5.1.1 S5.1.2 S5.1.3 S5.1.4 S5.1.5 S5.1.6 S5.1.7 S5.2.1 S5.2.2 S5.2.3 S5.3.1 S5.3.2 S5.3.3 E7.1 E7.2 E7.3 E7.4 E7.5 E7.6 E7.7 VS8.1.1 VS8.1.2 VS8.1.3 VS8.1.4 VS8.1.5 VS8.2.1 VS8.2.2 VS8.2.3 VS8.2.4 VS8.3.1 VS8.3.2 VS8.3.3 VS8.4.1 VS8.4.2 VS8.4.3; do
  if ! ls e2e/screenshots/${id}-*.png 1>/dev/null 2>&1; then
    echo "MISSING: $id"
  fi
done
```

---

## Summary

| Category | Total | Completed |
|----------|-------|-----------|
| 1 - Visual Appearance | 41 | 0 |
| 2 - URL Conformity | 22 | 0 |
| 3 - URL Consistency | 14 | 0 |
| 4 - Pop-Out Behavior | 21 | 0 |
| 5 - Cross-Window Sync | 10 | 0 |
| 6 - Router Encapsulation | 4 | 0 |
| 7 - Error Handling | 7 | 0 |
| 8 - Visual Verification | 15 | 0 |
| **TOTAL** | **134** | **0** |
