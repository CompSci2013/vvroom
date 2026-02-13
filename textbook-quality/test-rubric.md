# Comprehensive Playwright Test Rubric

## Overview

This rubric provides a systematic Playwright testing strategy for verifying URL-First State Management compliance across all application components. The URL is the single source of truth; all state changes must flow through URL updates.

**API Base URL:** `http://generic-prime.minilab/api/specs/v1`
**Application URL:** `http://localhost:4207`

---

## Test Data Reference

### Available Manufacturers (Use in Tests)
| Manufacturer | Count | Notes |
|-------------|-------|-------|
| Chevrolet | 849 | Highest count |
| Ford | 665 | Second highest |
| Buick | 480 | |
| Chrysler | 415 | |
| Dodge | 390 | |
| Cadillac | 361 | |
| Pontiac | 326 | |
| Lincoln | 307 | |
| Jeep | 299 | |
| GMC | 285 | |
| Tesla | 50 | Modern EV manufacturer |

### Available Body Classes
- Sedan, SUV, Coupe, Pickup, Van, Hatchback
- Sports Car, Touring Car, Wagon, Convertible, Truck, Limousine

### Year Range
- **Earliest:** 1908
- **Latest:** 2024
- **Total distinct years:** ~116

### URL Parameters Reference
| Parameter | Type | Example |
|-----------|------|---------|
| `manufacturer` | string | `manufacturer=Ford` |
| `model` | string | `model=Mustang` |
| `yearMin` | number | `yearMin=2010` |
| `yearMax` | number | `yearMax=2024` |
| `bodyClass` | string | `bodyClass=SUV` |
| `page` | number | `page=2` |
| `size` | number | `size=25` |
| `sortBy` | string | `sortBy=year` |
| `sortOrder` | string | `sortOrder=desc` |
| `h_manufacturer` | string | `h_manufacturer=Tesla` |
| `h_yearMin` | number | `h_yearMin=2015` |
| `h_yearMax` | number | `h_yearMax=2020` |
| `h_bodyClass` | string | `h_bodyClass=SUV` |
| `models` | string | `models=Ford:Mustang,Chevrolet:Camaro` |

---

## Screenshot Capture Standards

### Naming Convention
| Pattern | Description |
|---------|-------------|
| `{component}-default.png` | Component in default state |
| `{component}-filtered-{filter}.png` | Component with specific filter applied |
| `{component}-highlighted.png` | Component with highlights active |
| `{component}-sorted-{field}-{direction}.png` | Component with sorting applied |
| `{component}-paginated-page{N}.png` | Component showing specific page |
| `{component}-popout-standalone.png` | Popped-out component window alone |
| `{component}-popout-with-main.png` | Both windows visible |

### Screenshot Requirements
1. **Every screenshot MUST include the full browser URL bar** at the top of the image
2. URL bar verifies URL-First state management is working correctly
3. For popout screenshots, capture both windows showing synchronization state

### Playwright Screenshot Configuration
```typescript
// Ensure URL bar is visible in all screenshots
await page.screenshot({
  path: 'screenshot-name.png',
  fullPage: false  // Capture viewport only, ensuring URL bar is visible
});
```

---

## Category 1: Visual Appearance Tests

Test that components render correctly in default and various states.

### 1.1 Default State Rendering

| Test ID | Component | Test Description | Screenshot |
|---------|-----------|------------------|------------|
| V1.1.1 | Results Table | Table renders with default 25 rows | `results-table-default.png` |
| V1.1.2 | Filter Panel | All filter controls visible and enabled | `filter-panel-default.png` |
| V1.1.3 | Pagination | Pagination shows page 1, correct total pages | `pagination-default.png` |
| V1.1.4 | Statistics Panel | Statistics display counts by manufacturer/year/body | `statistics-default.png` |
| V1.1.5 | Search Input | Search input empty and focusable | `search-default.png` |

### 1.2 Filtered State Rendering

| Test ID | Component | Filter Applied | Screenshot |
|---------|-----------|----------------|------------|
| V1.2.1 | Results Table | `manufacturer=Ford` | `results-table-filtered-ford.png` |
| V1.2.2 | Results Table | `bodyClass=SUV` | `results-table-filtered-suv.png` |
| V1.2.3 | Results Table | `yearMin=2020&yearMax=2024` | `results-table-filtered-recent.png` |
| V1.2.4 | Statistics | `manufacturer=Chevrolet` | `statistics-filtered-chevrolet.png` |
| V1.2.5 | Results Table | `models=Ford:Mustang,Chevrolet:Camaro` | `results-table-model-combos.png` |

### 1.3 Highlighted State Rendering

| Test ID | Component | Highlight Applied | Screenshot |
|---------|-----------|-------------------|------------|
| V1.3.1 | Results Table | `h_manufacturer=Tesla` | `results-table-highlight-tesla.png` |
| V1.3.2 | Results Table | `h_yearMin=2015&h_yearMax=2020` | `results-table-highlight-years.png` |
| V1.3.3 | Statistics | `h_bodyClass=Pickup` | `statistics-highlight-pickup.png` |
| V1.3.4 | Results Table | Filter + Highlight: `manufacturer=Ford&h_yearMin=2018` | `results-table-filter-with-highlight.png` |

### 1.4 Sorted State Rendering

| Test ID | Component | Sort Applied | Screenshot |
|---------|-----------|--------------|------------|
| V1.4.1 | Results Table | `sortBy=year&sortOrder=desc` | `results-table-sorted-year-desc.png` |
| V1.4.2 | Results Table | `sortBy=manufacturer&sortOrder=asc` | `results-table-sorted-manufacturer-asc.png` |
| V1.4.3 | Results Table | `sortBy=instanceCount&sortOrder=desc` | `results-table-sorted-instancecount-desc.png` |

### 1.5 Paginated State Rendering

| Test ID | Component | Pagination Applied | Screenshot |
|---------|-----------|-------------------|------------|
| V1.5.1 | Results Table | `page=2&size=10` | `results-table-paginated-page2.png` |
| V1.5.2 | Pagination Control | `page=5&size=25` | `pagination-page5.png` |
| V1.5.3 | Results Table | Last page | `results-table-last-page.png` |

---

## Category 2: URL-First Conformity Tests

Test that component state reflects URL parameters and user interactions update the URL.

### 2.1 URL to State (Load URL, Verify State)

| Test ID | URL Parameters | Expected State | Pass/Fail |
|---------|---------------|----------------|-----------|
| U2.1.1 | `?manufacturer=Ford` | Manufacturer dropdown shows "Ford"; table shows only Ford vehicles | |
| U2.1.2 | `?yearMin=2010&yearMax=2020` | Year range inputs show 2010-2020; table filtered | |
| U2.1.3 | `?bodyClass=Pickup` | Body class dropdown shows "Pickup"; table filtered | |
| U2.1.4 | `?page=3&size=10` | Page 3 displayed; 10 rows visible | |
| U2.1.5 | `?sortBy=year&sortOrder=desc` | Year column sorted descending; sort indicator visible | |
| U2.1.6 | `?h_manufacturer=Tesla` | Manufacturer highlight shows "Tesla"; Tesla rows highlighted | |
| U2.1.7 | `?manufacturer=Chevrolet&h_yearMin=2015&h_yearMax=2020` | Chevrolet filtered + years 2015-2020 highlighted | |
| U2.1.8 | `?models=Ford:Mustang,Chevrolet:Camaro` | Model combinations filter active; table shows only those models | |
| U2.1.9 | `?search=mustang` | Search input contains "mustang"; results filtered | |

### 2.2 State to URL (User Interaction, Verify URL)

| Test ID | User Action | Expected URL Change | Pass/Fail |
|---------|-------------|---------------------|-----------|
| U2.2.1 | Select "Dodge" from manufacturer dropdown | URL contains `manufacturer=Dodge` | |
| U2.2.2 | Set year range 2000-2010 | URL contains `yearMin=2000&yearMax=2010` | |
| U2.2.3 | Select "SUV" body class | URL contains `bodyClass=SUV` | |
| U2.2.4 | Click page 4 | URL contains `page=4` | |
| U2.2.5 | Change page size to 50 | URL contains `size=50` | |
| U2.2.6 | Click year column header to sort | URL contains `sortBy=year` | |
| U2.2.7 | Click sort toggle for descending | URL contains `sortOrder=desc` | |
| U2.2.8 | Type "camaro" in search | URL contains `search=camaro` | |
| U2.2.9 | Clear all filters button | URL has no filter parameters | |
| U2.2.10 | Apply highlight for manufacturer | URL contains `h_manufacturer=...` | |

### 2.3 Combined Filter Tests

| Test ID | URL Parameters | Expected Behavior | Screenshot |
|---------|---------------|-------------------|------------|
| U2.3.1 | `?manufacturer=Ford&yearMin=2015&yearMax=2020&bodyClass=Coupe` | All filters applied; intersection shown | `combined-filters-ford-coupe-recent.png` |
| U2.3.2 | `?manufacturer=Chevrolet&sortBy=year&sortOrder=desc&page=2&size=10` | Filter + sort + pagination all active | `combined-filter-sort-page.png` |
| U2.3.3 | `?bodyClass=SUV&h_manufacturer=Jeep` | SUVs shown; Jeep SUVs highlighted | `combined-filter-highlight.png` |

---

## Category 3: URL Change Consistency Tests

Test browser back/forward navigation and manual URL edits restore correct state.

### 3.1 Browser Navigation

| Test ID | Test Sequence | Expected Behavior | Pass/Fail |
|---------|--------------|-------------------|-----------|
| U3.1.1 | Select Ford → Select Chevrolet → Click Back | Ford filter restored; table shows Ford vehicles | |
| U3.1.2 | Navigate to page 3 → Navigate to page 5 → Click Back → Click Back | Page 3 restored, then page 1 | |
| U3.1.3 | Apply sort → Apply filter → Click Back | Sort remains; filter removed | |
| U3.1.4 | Apply highlight → Click Back | Highlight removed | |
| U3.1.5 | Clear filters → Click Back | Previous filters restored | |
| U3.1.6 | Multiple Back clicks → Forward | Forward restores state correctly | |

### 3.2 Manual URL Edits

| Test ID | URL Edit Action | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| U3.2.1 | Change `manufacturer=Ford` to `manufacturer=Dodge` in URL bar | Dodge filter applied; table updates | |
| U3.2.2 | Add `&yearMin=2010` to existing URL | Year filter added to existing filters | |
| U3.2.3 | Remove `page=3` from URL | Return to page 1 | |
| U3.2.4 | Change `sortOrder=asc` to `sortOrder=desc` | Sort direction reverses | |
| U3.2.5 | Paste completely new URL with different filters | All controls update to match new URL | |

### 3.3 URL Sharing

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| U3.3.1 | Copy URL with filters, paste in new tab | New tab shows identical state | |
| U3.3.2 | Copy URL with highlights, paste in new tab | Highlights applied in new tab | |
| U3.3.3 | Copy URL with pagination, paste in incognito | Same page displayed | |

---

## Category 4: Pop-Out Behavior Tests

Test that components function correctly when popped out to separate windows.

### 4.1 Pop-Out Window Rendering

| Test ID | Test Description | Expected Behavior | Screenshot |
|---------|-----------------|-------------------|------------|
| P4.1.1 | Pop out results table | Table displays in new window without site header | `results-table-popout-standalone.png` |
| P4.1.2 | Pop out statistics panel | Statistics display in new window | `statistics-popout-standalone.png` |
| P4.1.3 | Pop out filter panel | Filters display and function in new window | `filter-panel-popout-standalone.png` |
| P4.1.4 | Pop-out URL contains `popout=true` | URL includes pop-out indicator | |
| P4.1.5 | Pop-out hides site banner/header | No navigation header visible | |
| P4.1.6 | Main window shows placeholder icon | Icon indicates component is popped out | `{component}-popout-with-main.png` |

### 4.2 Pop-Out Synchronization

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| P4.2.1 | Change filter in main window | Pop-out updates to reflect filter | |
| P4.2.2 | Change filter in pop-out | Main window URL updates; main window state changes | |
| P4.2.3 | Change sort in main window | Pop-out table re-sorts | |
| P4.2.4 | Apply highlight in pop-out | Main window highlights update | |
| P4.2.5 | Navigate page in main window | Pop-out shows same page | |
| P4.2.6 | Clear filters in main window | Pop-out filters clear | |

### 4.3 Pop-Out API Behavior

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| P4.3.1 | Pop-out does NOT update its own URL | Pop-out URL remains static after initial load | |
| P4.3.2 | Pop-out does NOT make its own API calls | Network tab shows no API requests from pop-out | |
| P4.3.3 | Pop-out receives data via BroadcastChannel | Data propagated from main window | |
| P4.3.4 | Main window API refresh updates pop-outs | New data appears in pop-out | |

### 4.4 Multiple Pop-Out Tests

| Test ID | Test Description | Expected Behavior | Screenshot |
|---------|-----------------|-------------------|------------|
| P4.4.1 | Open two pop-outs of same type | Both show identical state | |
| P4.4.2 | Open pop-outs of different types | Each receives relevant updates | |
| P4.4.3 | Change in one pop-out updates all | Main window and all pop-outs synchronized | |
| P4.4.4 | Close pop-out | Main window continues normally | |
| P4.4.5 | Close main window | Pop-outs display gracefully (or close) | |

### 4.5 Pop-Out with URL Parameters

| Test ID | URL Applied Before Pop-Out | Expected Pop-Out State | Screenshot |
|---------|---------------------------|----------------------|------------|
| P4.5.1 | `?manufacturer=Ford` | Pop-out shows Ford vehicles | `popout-filtered-ford.png` |
| P4.5.2 | `?h_manufacturer=Tesla` | Pop-out shows Tesla highlights | `popout-highlight-tesla.png` |
| P4.5.3 | `?sortBy=year&sortOrder=desc` | Pop-out table sorted correctly | `popout-sorted.png` |
| P4.5.4 | `?page=3&size=10` | Pop-out shows page 3 | `popout-paginated.png` |

---

## Category 5: Cross-Window Synchronization Tests

Test bidirectional communication between main window and pop-outs.

### 5.1 Main Window to Pop-Out

| Test ID | Main Window Action | Expected Pop-Out Response | Pass/Fail |
|---------|-------------------|--------------------------|-----------|
| S5.1.1 | Change manufacturer filter | Pop-out filters to same manufacturer | |
| S5.1.2 | Apply year range filter | Pop-out shows same year range | |
| S5.1.3 | Change sort column | Pop-out table re-sorts | |
| S5.1.4 | Change page | Pop-out shows same page | |
| S5.1.5 | Apply highlight | Pop-out highlights matching rows | |
| S5.1.6 | Clear all filters | Pop-out clears all filters | |
| S5.1.7 | Type in search | Pop-out shows search results | |

### 5.2 Pop-Out to Main Window

| Test ID | Pop-Out Action | Expected Main Window Response | Pass/Fail |
|---------|---------------|------------------------------|-----------|
| S5.2.1 | Change highlight filter | Main window URL updates with `h_` param | |
| S5.2.2 | Apply filter in pop-out | Main window URL updates; table filters | |
| S5.2.3 | Clear filters in pop-out | Main window URL clears filter params | |

### 5.3 BroadcastChannel Verification

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| S5.3.1 | Filter change sends BroadcastChannel message | Message observed in DevTools | |
| S5.3.2 | Pop-out receives message | `syncStateFromExternal()` called | |
| S5.3.3 | Pop-out sends message | Main window receives and processes | |

---

## Category 6: Router Navigate Encapsulation Tests

Verify that `router.navigate()` is only called from `UrlStateService`.

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| R6.1 | Grep codebase for `router.navigate` | Only appears in `url-state.service.ts` | |
| R6.2 | Components call `updateFilters()` | No direct `router.navigate()` in components | |
| R6.3 | Pop-out components use parent messaging | No `router.navigate()` in pop-out components | |
| R6.4 | Search input updates via service | Search triggers service method, not direct navigate | |

---

## Category 7: Error Handling Tests

Test graceful handling of invalid or edge-case inputs.

| Test ID | Invalid Input | Expected Behavior | Pass/Fail |
|---------|--------------|-------------------|-----------|
| E7.1 | `?manufacturer=InvalidBrand` | Graceful handling; invalid param ignored or defaulted | |
| E7.2 | `?yearMin=3000` | Invalid year handled gracefully | |
| E7.3 | `?page=-1` | Returns to valid page (1) | |
| E7.4 | `?size=10000` | Capped to maximum allowed size | |
| E7.5 | `?sortBy=invalidField` | Sort ignored; default order used | |
| E7.6 | Empty search `?search=` | Treated as no search | |
| E7.7 | Special characters in search | Properly escaped/handled | |

---

## Category 8: Visual Verification Tests

Screenshot comparisons for visual regression testing.

### 8.1 Component Screenshots - Default State

| Test ID | Component | URL | Screenshot File |
|---------|-----------|-----|-----------------|
| VS8.1.1 | Full Page | `/` | `full-page-default.png` |
| VS8.1.2 | Results Table | `/` | `results-table-default.png` |
| VS8.1.3 | Filter Panel | `/` | `filter-panel-default.png` |
| VS8.1.4 | Statistics | `/` | `statistics-default.png` |
| VS8.1.5 | Pagination | `/` | `pagination-default.png` |

### 8.2 Component Screenshots - Filtered State

| Test ID | Filter Applied | Screenshot File |
|---------|----------------|-----------------|
| VS8.2.1 | `?manufacturer=Ford` | `full-page-filtered-ford.png` |
| VS8.2.2 | `?bodyClass=SUV` | `full-page-filtered-suv.png` |
| VS8.2.3 | `?yearMin=2020&yearMax=2024` | `full-page-filtered-recent.png` |
| VS8.2.4 | `?manufacturer=Chevrolet&bodyClass=Pickup` | `full-page-filtered-combined.png` |

### 8.3 Component Screenshots - Highlighted State

| Test ID | Highlight Applied | Screenshot File |
|---------|-------------------|-----------------|
| VS8.3.1 | `?h_manufacturer=Tesla` | `full-page-highlight-tesla.png` |
| VS8.3.2 | `?h_yearMin=2015&h_yearMax=2020` | `full-page-highlight-years.png` |
| VS8.3.3 | `?manufacturer=Ford&h_yearMin=2018&h_yearMax=2022` | `full-page-filter-with-highlight.png` |

### 8.4 Pop-Out Screenshots

| Test ID | Component | Screenshot Files |
|---------|-----------|------------------|
| VS8.4.1 | Results Table Pop-out | `results-table-popout-standalone.png`, `results-table-popout-with-main.png` |
| VS8.4.2 | Statistics Pop-out | `statistics-popout-standalone.png`, `statistics-popout-with-main.png` |
| VS8.4.3 | Filter Panel Pop-out | `filter-panel-popout-standalone.png`, `filter-panel-popout-with-main.png` |

---

## Anti-Pattern Checklist

These patterns indicate URL-First violations and should fail testing:

| Anti-Pattern | How to Detect | Severity |
|--------------|---------------|----------|
| Direct state mutation bypassing URL | State changes without URL param update | Critical |
| `router.navigate()` in components | Grep for `router.navigate` outside UrlStateService | Critical |
| Pop-out making API calls | Network tab shows fetch from pop-out window | Critical |
| Pop-out updating its own URL | Pop-out URL changes after initial load | Critical |
| State not in URL that should be shareable | Filter applied but not in URL; refresh loses state | High |
| Highlight state without `h_` prefix | Highlight params using wrong naming convention | Medium |
| Component local state shadows URL state | Component state differs from URL | High |

---

## Test Execution Checklist

### Before Running Tests
- [ ] Development server running on port 4207
- [ ] API server running at `http://generic-prime.minilab/api/specs/v1`
- [ ] Browser DevTools Network tab available (for API call verification)
- [ ] Browser DevTools Console available (for error detection)
- [ ] Screenshot directory exists and is writable

### After Each Test
- [ ] Verify URL params match expected state
- [ ] Verify all controls reflect URL state
- [ ] Verify pop-out windows synchronized (if applicable)
- [ ] Check console for errors
- [ ] Verify screenshot includes URL bar

### Screenshot Checklist
- [ ] URL bar visible at top of screenshot
- [ ] Relevant component fully visible
- [ ] State indicators (filters, highlights, sort) visible
- [ ] For pop-out tests: both windows captured where specified

---

## Playwright Test File Structure

```
tests/
├── visual/
│   ├── default-state.spec.ts
│   ├── filtered-state.spec.ts
│   ├── highlighted-state.spec.ts
│   └── sorted-paginated.spec.ts
├── url-first/
│   ├── url-to-state.spec.ts
│   ├── state-to-url.spec.ts
│   └── browser-navigation.spec.ts
├── popout/
│   ├── popout-rendering.spec.ts
│   ├── popout-sync.spec.ts
│   └── popout-api-behavior.spec.ts
├── cross-window/
│   └── broadcast-channel.spec.ts
├── error-handling/
│   └── invalid-params.spec.ts
└── architecture/
    └── router-encapsulation.spec.ts
```

---

## Sample Test Data URLs

Use these URLs for consistent testing:

```
# Default state
http://localhost:4207/

# Filtered by manufacturer
http://localhost:4207/?manufacturer=Ford
http://localhost:4207/?manufacturer=Chevrolet
http://localhost:4207/?manufacturer=Tesla

# Filtered by body class
http://localhost:4207/?bodyClass=SUV
http://localhost:4207/?bodyClass=Pickup
http://localhost:4207/?bodyClass=Sedan

# Filtered by year range
http://localhost:4207/?yearMin=2020&yearMax=2024
http://localhost:4207/?yearMin=1908&yearMax=1950

# Combined filters
http://localhost:4207/?manufacturer=Ford&yearMin=2015&yearMax=2020&bodyClass=Coupe

# With highlights
http://localhost:4207/?h_manufacturer=Tesla
http://localhost:4207/?manufacturer=Ford&h_yearMin=2018&h_yearMax=2022

# With pagination
http://localhost:4207/?page=2&size=10
http://localhost:4207/?page=5&size=25

# With sorting
http://localhost:4207/?sortBy=year&sortOrder=desc
http://localhost:4207/?sortBy=manufacturer&sortOrder=asc

# Model combinations
http://localhost:4207/?models=Ford:Mustang,Chevrolet:Camaro

# Pop-out
http://localhost:4207/?popout=true
```

---

## References

- [test-data/README.md](../test-data/README.md) - API data structure documentation
- [textbook/A02-url-first-testing-rubric.md](../textbook/A02-url-first-testing-rubric.md) - Original testing rubric model
