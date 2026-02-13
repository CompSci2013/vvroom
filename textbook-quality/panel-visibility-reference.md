# Panel Visibility Reference for Category 1 Tests

## Purpose

This document specifies which panels/controls should be visible (expanded) vs collapsed for each test to best demonstrate that URL-First state management is working correctly.

## Panel Inventory

| Panel Name | Purpose |
|------------|---------|
| Query Control | Shows active filters/highlights as chips, "Clear All" button |
| Query Panel | Filter input controls (manufacturer, year range, body class, etc.) |
| Manufacturer-Model Picker | Table for selecting specific manufacturer:model combinations |
| Statistics | 4 charts showing data distribution (manufacturer, year, body class, top models) |
| Results Table | Main data table with pagination controls |

---

## Category 1.1: Default State Rendering

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| V1.1.1 | Results table default | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on table rendering with default data and pagination |
| V1.1.2 | Filter panel default | Query Panel | Query Control, Picker, Statistics, Results Table | Focus on filter controls in empty/default state |
| V1.1.3 | Pagination default | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on pagination showing "Showing 1 to 25 of X" |
| V1.1.4 | Statistics panel default | Statistics | Query Control, Query Panel, Picker, Results Table | Focus on 4 charts in default unfiltered state |
| V1.1.5 | Search input default | Query Control | Query Panel, Picker, Statistics, Results Table | Focus on search input in empty state |

---

## Category 1.2: Filtered State Rendering

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| V1.2.1 | Filtered by manufacturer | Query Control (filter chip), Statistics | Query Panel, Picker, Results Table | Show filter is active via chip + visualize filtered data in charts |
| V1.2.2 | Filtered by body class | Query Control (filter chip), Statistics | Query Panel, Picker, Results Table | Show filter is active via chip + visualize filtered data in charts |
| V1.2.3 | Filtered by year range | Query Control (filter chip), Statistics | Query Panel, Picker, Results Table | Show filter is active via chip + visualize filtered data in charts |
| V1.2.4 | Statistics filtered | Query Control (filter chip), Statistics | Query Panel, Picker, Results Table | Show filter is active via chip + visualize filtered data in charts |
| V1.2.5 | Model combinations | Query Control (models chip), Statistics | Query Panel, Picker, Results Table | Show model filter active via chip + visualize results in charts |

---

## Category 1.3: Highlighted State Rendering

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| V1.3.1 | Highlight Tesla | Query Control (highlight chip), Statistics | Query Panel, Picker, Results Table | Show highlight active + blue highlighted bars in charts |
| V1.3.2 | Highlight year range | Query Control (highlight chip), Statistics | Query Panel, Picker, Results Table | Show highlight active + blue highlighted bars in charts |
| V1.3.3 | Highlight body class | Query Control (highlight chip), Statistics | Query Panel, Picker, Results Table | Show highlight active + blue highlighted bars in charts |
| V1.3.4 | Filter + Highlight | Query Control (both chips), Statistics | Query Panel, Picker, Results Table | Show both filter & highlight chips + visualize combined effect |

---

## Category 1.4: Sorted State Rendering

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| V1.4.1 | Sorted year desc | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on table showing sort indicator arrow on year column |
| V1.4.2 | Sorted manufacturer asc | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on table showing sort indicator arrow on manufacturer column |
| V1.4.3 | Sorted instance count | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on table showing sort indicator arrow on count column |

---

## Category 1.5: Paginated State Rendering

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| V1.5.1 | Page 2, size 10 | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on table showing page 2 content with 10 rows per page |
| V1.5.2 | Page 5, size 25 | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on pagination control showing page 5 as active |
| V1.5.3 | Last page | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on last page behavior and pagination state |

---

## Key Principles

1. **Show what the URL controls**: The expanded panels should demonstrate that the URL parameters are being applied correctly.

2. **Collapse the noise**: Panels not relevant to the test should be collapsed so the screenshot clearly shows the effect being tested.

3. **Query Control for state indication**: When testing filters or highlights, Query Control should be visible because it shows the active state as chips.

4. **Statistics for data visualization**: When testing filters or highlights, Statistics should be visible to show how the data changes.

5. **Results Table for sorting/pagination**: When testing sort or pagination, Results Table should be visible to show the actual data order and page state.

---

---

## Category 1.6: Collapsed/Expanded Panel State Rendering

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| V1.6.1 | Query Control collapsed | Query Panel, Picker, Statistics, Results Table | Query Control | Verify Query Control can collapse |
| V1.6.2 | Query Panel collapsed | Query Control, Picker, Statistics, Results Table | Query Panel | Verify Query Panel can collapse |
| V1.6.3 | Picker collapsed | Query Control, Query Panel, Statistics, Results Table | Picker | Verify Picker can collapse |
| V1.6.4 | All expanded (default) | All panels | None | Verify default expanded state |
| V1.6.5 | All collapsed | None (just headers visible) | All panels | Verify all can collapse simultaneously |
| V1.6.6 | Mixed state | Query Control, Statistics | Query Panel, Picker, Results Table | Verify mixed expand/collapse works |

---

## Category 1.7: Pagination Interaction Tests (Popped-In)

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| V1.7.1 | Picker page 2 | Picker | Query Control, Query Panel, Statistics, Results Table | Focus on Picker pagination state |
| V1.7.2 | Picker page 3 | Picker | Query Control, Query Panel, Statistics, Results Table | Focus on Picker pagination state |
| V1.7.3 | Picker 10 rows | Picker | Query Control, Query Panel, Statistics, Results Table | Focus on Picker row count |
| V1.7.4 | Picker 50 rows | Picker | Query Control, Query Panel, Statistics, Results Table | Focus on Picker row count |
| V1.7.5 | Picker 100 rows | Picker | Query Control, Query Panel, Statistics, Results Table | Focus on Picker row count |
| V1.7.6 | Results page 2 via URL | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on Results Table pagination |
| V1.7.7 | Results 50 rows via URL | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on Results Table row count |

---

## Category 1.8: Pagination Interaction Tests (Popped-Out)

| Test ID | Test Purpose | Main Window | Pop-Out Window | Rationale |
|---------|--------------|-------------|----------------|-----------|
| V1.8.1 | Picker pop-out page 2 | Shows placeholder | Picker with page 2 | Verify pop-out pagination works |
| V1.8.2 | Picker pop-out 50 rows | Shows placeholder | Picker with 50 rows | Verify pop-out row count works |
| V1.8.3 | Picker pop-out 100 rows | Shows placeholder | Picker with 100 rows | Verify pop-out row count works |

---

## Category 1.9: Picker Selection and Apply Tests

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| V1.9.1 | Picker selected before Apply | Picker | Query Control, Query Panel, Statistics, Results Table | Focus on selection checkboxes and Apply button |
| V1.9.2 | Picker after Apply | Query Control (models chip), Statistics | Query Panel, Picker, Results Table | Show URL updated + filtered results |
| V1.9.3 | Picker pop-out selected | Main: placeholder, Pop-out: Picker | N/A | Focus on pop-out selection state |
| V1.9.4 | Picker pop-out after Apply | Query Control (models chip), Statistics | Query Panel, Picker, Results Table | Main window shows URL updated |
| V1.9.5 | Picker cleared | Picker | Query Control, Query Panel, Statistics, Results Table | Focus on cleared selection state |

---

## Category 2: URL-First Conformity Tests

### 2.1 URL to State (Load URL, Verify State)

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| U2.1.1 | URL → manufacturer filter | Query Panel (shows dropdown value), Results Table | Query Control, Picker, Statistics | Verify dropdown reflects URL param |
| U2.1.2 | URL → year range | Query Panel (shows year inputs), Results Table | Query Control, Picker, Statistics | Verify year inputs reflect URL params |
| U2.1.3 | URL → body class | Query Panel (shows dropdown value), Results Table | Query Control, Picker, Statistics | Verify dropdown reflects URL param |
| U2.1.4 | URL → pagination | Results Table (shows page 3, 10 rows) | Query Control, Query Panel, Picker, Statistics | Verify pagination reflects URL params |
| U2.1.5 | URL → sort | Results Table (shows sort indicator) | Query Control, Query Panel, Picker, Statistics | Verify sort indicator reflects URL params |
| U2.1.6 | URL → highlight | Query Control (highlight chip), Statistics (blue bars) | Query Panel, Picker, Results Table | Verify highlight reflects URL param |
| U2.1.7 | URL → filter + highlight | Query Control (both chips), Statistics | Query Panel, Picker, Results Table | Verify combined state from URL |
| U2.1.8 | URL → model combinations | Query Control (models chip), Picker (rows selected) | Query Panel, Statistics, Results Table | Verify Picker reflects URL param |
| U2.1.9 | URL → search | Query Control (search input filled) | Query Panel, Picker, Statistics, Results Table | Verify search reflects URL param |

### 2.2 State to URL (User Interaction, Verify URL)

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| U2.2.1 | Select manufacturer → URL | Query Panel | Query Control, Picker, Statistics, Results Table | Interact with dropdown, verify URL changes |
| U2.2.2 | Set year range → URL | Query Panel | Query Control, Picker, Statistics, Results Table | Interact with year inputs, verify URL changes |
| U2.2.3 | Select body class → URL | Query Panel | Query Control, Picker, Statistics, Results Table | Interact with dropdown, verify URL changes |
| U2.2.4 | Click page → URL | Results Table | Query Control, Query Panel, Picker, Statistics | Click pagination, verify URL changes |
| U2.2.5 | Change page size → URL | Results Table | Query Control, Query Panel, Picker, Statistics | Change size dropdown, verify URL changes |
| U2.2.6 | Click sort column → URL | Results Table | Query Control, Query Panel, Picker, Statistics | Click column header, verify URL changes |
| U2.2.7 | Toggle sort direction → URL | Results Table | Query Control, Query Panel, Picker, Statistics | Click again, verify URL changes |
| U2.2.8 | Type search → URL | Query Control | Query Panel, Picker, Statistics, Results Table | Type in search, verify URL changes |
| U2.2.9 | Clear all filters → URL | Query Control | Query Panel, Picker, Statistics, Results Table | Click Clear All, verify URL clears |
| U2.2.10 | Apply highlight → URL | Query Control | Query Panel, Picker, Statistics, Results Table | Apply highlight, verify h_ param in URL |

### 2.3 Combined Filter Tests

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| U2.3.1 | Multiple filters | Query Control (multiple chips), Statistics | Query Panel, Picker, Results Table | Verify all filters applied from URL |
| U2.3.2 | Filter + sort + page | Query Control (chip), Results Table (sort + page) | Query Panel, Picker, Statistics | Verify combined state from URL |
| U2.3.3 | Filter + highlight | Query Control (filter + highlight chips), Statistics | Query Panel, Picker, Results Table | Verify filter + highlight from URL |

---

## Category 3: URL Change Consistency Tests

### 3.1 Browser Navigation

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| U3.1.1 | Back restores filter | Query Control (shows previous chip), Statistics | Query Panel, Picker, Results Table | Verify back button restores URL state |
| U3.1.2 | Back restores pagination | Results Table | Query Control, Query Panel, Picker, Statistics | Verify back button restores page |
| U3.1.3 | Back removes filter, keeps sort | Results Table (sort indicator) | Query Control, Query Panel, Picker, Statistics | Verify partial state restoration |
| U3.1.4 | Back removes highlight | Query Control (no highlight chip), Statistics (no blue) | Query Panel, Picker, Results Table | Verify highlight removed on back |
| U3.1.5 | Back restores cleared filters | Query Control (chips return), Statistics | Query Panel, Picker, Results Table | Verify filters restored on back |
| U3.1.6 | Forward restores state | Query Control, Statistics | Query Panel, Picker, Results Table | Verify forward navigation works |

### 3.2 Manual URL Edits

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| U3.2.1 | Edit manufacturer in URL | Query Control (new chip), Statistics | Query Panel, Picker, Results Table | Verify state updates from URL edit |
| U3.2.2 | Add year param to URL | Query Control (new chip), Statistics | Query Panel, Picker, Results Table | Verify added param applies |
| U3.2.3 | Remove page param | Results Table (back to page 1) | Query Control, Query Panel, Picker, Statistics | Verify removed param resets |
| U3.2.4 | Change sort direction | Results Table (reversed indicator) | Query Control, Query Panel, Picker, Statistics | Verify sort change applies |
| U3.2.5 | Paste new URL | Query Control, Statistics | Query Panel, Picker, Results Table | Verify complete state change |

### 3.3 URL Sharing

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| U3.3.1 | Shared URL with filters | Query Control (chips), Statistics | Query Panel, Picker, Results Table | Verify shared URL reproduces state |
| U3.3.2 | Shared URL with highlights | Query Control (highlight chip), Statistics (blue bars) | Query Panel, Picker, Results Table | Verify highlights reproduced |
| U3.3.3 | Shared URL with pagination | Results Table (correct page) | Query Control, Query Panel, Picker, Statistics | Verify pagination reproduced |

---

## Category 4: Pop-Out Behavior Tests

### 4.1 Pop-Out Window Rendering

| Test ID | Test Purpose | Main Window | Pop-Out Window | Rationale |
|---------|--------------|-------------|----------------|-----------|
| P4.1.1 | Results table pop-out | Placeholder icon visible | Results Table only (no header) | Verify pop-out renders correctly |
| P4.1.2 | Statistics pop-out | Placeholder icon visible | Statistics only (no header) | Verify pop-out renders correctly |
| P4.1.3 | Filter panel pop-out | Placeholder icon visible | Query Panel only (no header) | Verify pop-out renders correctly |
| P4.1.4 | Pop-out URL has popout=true | N/A | Check URL bar | Verify URL indicates pop-out mode |
| P4.1.5 | Pop-out hides header | N/A | No site header visible | Verify clean pop-out appearance |
| P4.1.6 | Main shows placeholder | Placeholder icon where panel was | N/A | Verify main window indicates pop-out |

### 4.2 Pop-Out Synchronization

| Test ID | Test Purpose | Main Window | Pop-Out Window | Rationale |
|---------|--------------|-------------|----------------|-----------|
| P4.2.1 | Main filter → pop-out | Query Control (chip), Apply filter | Statistics updates | Verify pop-out receives filter |
| P4.2.2 | Pop-out filter → main | URL updates with param | Query Control (apply filter) | Verify main receives from pop-out |
| P4.2.3 | Main sort → pop-out | Results Table (click sort) | Results Table re-sorts | Verify pop-out receives sort |
| P4.2.4 | Pop-out highlight → main | URL updates with h_ param | Query Control (apply highlight) | Verify main receives highlight |
| P4.2.5 | Main page → pop-out | Results Table (click page) | Results Table shows same page | Verify pop-out receives pagination |
| P4.2.6 | Main clear → pop-out | Query Control (Clear All) | All panels clear | Verify pop-out receives clear |

### 4.3 Pop-Out API Behavior

| Test ID | Test Purpose | Main Window | Pop-Out Window | Rationale |
|---------|--------------|-------------|----------------|-----------|
| P4.3.1 | Pop-out URL static | N/A | URL doesn't change after actions | Verify pop-out doesn't update own URL |
| P4.3.2 | Pop-out no API calls | N/A | Network tab empty | Verify pop-out doesn't fetch data |
| P4.3.3 | Pop-out via BroadcastChannel | N/A | Data appears without API call | Verify data comes from main window |
| P4.3.4 | Main refresh → pop-out | Trigger API refresh | New data appears | Verify pop-out receives fresh data |

### 4.4 Multiple Pop-Out Tests

| Test ID | Test Purpose | Main Window | Pop-Out Windows | Rationale |
|---------|--------------|-------------|-----------------|-----------|
| P4.4.1 | Two same-type pop-outs | Placeholder | Both show same state | Verify multiple pop-outs sync |
| P4.4.2 | Different-type pop-outs | Multiple placeholders | Each shows relevant data | Verify heterogeneous sync |
| P4.4.3 | One pop-out change → all | URL updates | All pop-outs update | Verify cross-window broadcast |
| P4.4.4 | Close pop-out | Resumes normal | N/A | Verify graceful close |
| P4.4.5 | Close main window | N/A | Graceful degradation | Verify pop-outs handle orphaning |

### 4.5 Pop-Out with URL Parameters

| Test ID | Test Purpose | Main Window | Pop-Out Window | Rationale |
|---------|--------------|-------------|----------------|-----------|
| P4.5.1 | Pop-out with filter | Query Control (Ford chip) | Shows Ford data | Verify pop-out inherits filter |
| P4.5.2 | Pop-out with highlight | Query Control (Tesla highlight) | Shows highlighted bars | Verify pop-out inherits highlight |
| P4.5.3 | Pop-out with sort | Results Table (sorted) | Shows sorted data | Verify pop-out inherits sort |
| P4.5.4 | Pop-out with pagination | Results Table (page 3) | Shows page 3 | Verify pop-out inherits pagination |

---

## Category 5: Cross-Window Synchronization Tests

### 5.1 Main Window to Pop-Out

| Test ID | Test Purpose | Main Window Action | Pop-Out Verification | Rationale |
|---------|--------------|-------------------|---------------------|-----------|
| S5.1.1 | Main filter → pop-out | Select manufacturer | Statistics shows filtered data | Verify one-way sync main→pop-out |
| S5.1.2 | Main year → pop-out | Set year range | Statistics shows year-filtered data | Verify filter sync |
| S5.1.3 | Main sort → pop-out | Click sort column | Results Table re-sorts | Verify sort sync |
| S5.1.4 | Main page → pop-out | Click page number | Results Table shows that page | Verify pagination sync |
| S5.1.5 | Main highlight → pop-out | Apply highlight | Statistics shows blue bars | Verify highlight sync |
| S5.1.6 | Main clear → pop-out | Click Clear All | All filters/highlights removed | Verify clear sync |
| S5.1.7 | Main search → pop-out | Type in search | Results filtered by search | Verify search sync |

### 5.2 Pop-Out to Main Window

| Test ID | Test Purpose | Pop-Out Action | Main Window Verification | Rationale |
|---------|--------------|----------------|-------------------------|-----------|
| S5.2.1 | Pop-out highlight → main | Apply highlight in pop-out | URL has h_ param, chips visible | Verify reverse sync |
| S5.2.2 | Pop-out filter → main | Apply filter in pop-out | URL has param, Statistics filtered | Verify reverse sync |
| S5.2.3 | Pop-out clear → main | Clear in pop-out | URL clears, chips removed | Verify reverse sync |

### 5.3 BroadcastChannel Verification

| Test ID | Test Purpose | Verification Method | Rationale |
|---------|--------------|--------------------| --------- |
| S5.3.1 | Filter broadcasts | DevTools Application → BroadcastChannel | Verify message sent |
| S5.3.2 | Pop-out receives | Console log or state inspection | Verify message received |
| S5.3.3 | Pop-out sends | Main window URL/state changes | Verify bidirectional |

---

## Category 6: Router Navigate Encapsulation Tests

| Test ID | Test Purpose | Verification Method | Rationale |
|---------|--------------|--------------------| --------- |
| R6.1 | router.navigate only in UrlStateService | `grep -r "router.navigate" src/` | Architectural compliance |
| R6.2 | Components use updateFilters() | Code review of components | No direct navigation |
| R6.3 | Pop-outs use messaging | Code review of pop-out components | No router in pop-outs |
| R6.4 | Search uses service | Code review of search component | No direct navigation |

**Note:** Category 6 tests are static code analysis, not visual tests. No panel visibility applies.

---

## Category 7: Error Handling Tests

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| E7.1 | Invalid manufacturer | Query Control (no chip or error), Statistics | Query Panel, Picker, Results Table | Verify graceful handling |
| E7.2 | Invalid year (3000) | Query Control, Statistics | Query Panel, Picker, Results Table | Verify year validation |
| E7.3 | Negative page | Results Table (shows page 1) | Query Control, Query Panel, Picker, Statistics | Verify page validation |
| E7.4 | Huge page size | Results Table (capped size) | Query Control, Query Panel, Picker, Statistics | Verify size validation |
| E7.5 | Invalid sort field | Results Table (default order) | Query Control, Query Panel, Picker, Statistics | Verify sort validation |
| E7.6 | Empty search param | Query Control (empty search), Results Table | Query Panel, Picker, Statistics | Verify empty search handling |
| E7.7 | Special chars in search | Query Control (escaped search), Results Table | Query Panel, Picker, Statistics | Verify encoding handling |

---

## Category 8: Visual Verification Tests

### 8.1 Default State Screenshots

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| VS8.1.1 | Full page default | All panels | None | Capture complete default state |
| VS8.1.2 | Results table default | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on table rendering |
| VS8.1.3 | Filter panel default | Query Panel | Query Control, Picker, Statistics, Results Table | Focus on filter controls |
| VS8.1.4 | Statistics default | Statistics | Query Control, Query Panel, Picker, Results Table | Focus on charts |
| VS8.1.5 | Pagination default | Results Table | Query Control, Query Panel, Picker, Statistics | Focus on pagination control |

### 8.2 Filtered State Screenshots

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| VS8.2.1 | Filtered by Ford | Query Control (chip), Statistics | Query Panel, Picker, Results Table | Verify filtered visualization |
| VS8.2.2 | Filtered by SUV | Query Control (chip), Statistics | Query Panel, Picker, Results Table | Verify filtered visualization |
| VS8.2.3 | Filtered by recent years | Query Control (chip), Statistics | Query Panel, Picker, Results Table | Verify filtered visualization |
| VS8.2.4 | Combined filters | Query Control (chips), Statistics | Query Panel, Picker, Results Table | Verify combined filtering |

### 8.3 Highlighted State Screenshots

| Test ID | Test Purpose | Expanded | Collapsed | Rationale |
|---------|--------------|----------|-----------|-----------|
| VS8.3.1 | Highlight Tesla | Query Control (highlight chip), Statistics (blue bars) | Query Panel, Picker, Results Table | Verify highlight visualization |
| VS8.3.2 | Highlight years | Query Control (highlight chip), Statistics (blue bars) | Query Panel, Picker, Results Table | Verify highlight visualization |
| VS8.3.3 | Filter + highlight | Query Control (both chips), Statistics | Query Panel, Picker, Results Table | Verify combined effect |

### 8.4 Pop-Out Screenshots

| Test ID | Test Purpose | Main Window | Pop-Out Window | Rationale |
|---------|--------------|-------------|----------------|-----------|
| VS8.4.1 | Results pop-out | Placeholder | Results Table standalone | Visual verification of pop-out |
| VS8.4.2 | Statistics pop-out | Placeholder | Statistics standalone | Visual verification of pop-out |
| VS8.4.3 | Filter pop-out | Placeholder | Query Panel standalone | Visual verification of pop-out |

---

## Screenshot Verification Checklist

For each screenshot, verify:

- [ ] URL bar visible at top with correct parameters
- [ ] Expected panels are expanded per this reference
- [ ] Expected panels are collapsed per this reference
- [ ] Active state indicators visible (chips, sort arrows, page numbers)
- [ ] Data reflects the URL parameters (filtered counts, sorted order, etc.)
