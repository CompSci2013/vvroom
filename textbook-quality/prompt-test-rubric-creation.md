# Prompt: Create Comprehensive Playwright Test Rubric

## Context

This prompt generates a test rubric for the vvroom application's URL-First architecture. The rubric must be structured for incremental execution across multiple sessions to prevent context loss.

## Task

1. **Read reference materials:**
   - `~/projects/vvroom/test-data/README.md` - API data structure (filters, pagination, sorting, highlights, available values)
   - `~/projects/vvroom/textbook/A02-url-first-testing-rubric.md` - Structural model for the rubric
   - `~/projects/vvroom/docs/STATE-MANAGEMENT-SPECIFICATION.md` - URL-First architecture details

2. **Write:** `~/projects/vvroom/textbook-quality/test-rubric.md`

3. **After creating test-rubric.md**, also generate:
   - `~/projects/vvroom/textbook-quality/test-checklist.md` - Checkbox tracking file
   - `~/projects/vvroom/textbook-quality/panel-visibility-reference.md` - Panel state per test

## Test ID Naming Convention

Every test MUST have a unique ID following this pattern:

| Category | Prefix | Example IDs |
|----------|--------|-------------|
| 1. Visual Appearance | V1 | V1.1.1, V1.2.3, V1.9.5 |
| 2. URL-First Conformity | U2 | U2.1.1, U2.2.10, U2.3.3 |
| 3. URL Change Consistency | U3 | U3.1.1, U3.2.5, U3.3.3 |
| 4. Pop-Out Behavior | P4 | P4.1.1, P4.3.4, P4.5.4 |
| 5. Cross-Window Sync | S5 | S5.1.1, S5.2.3, S5.3.3 |
| 6. Router Encapsulation | R6 | R6.1, R6.2, R6.3, R6.4 |
| 7. Error Handling | E7 | E7.1, E7.2, E7.7 |
| 8. Visual Verification | VS8 | VS8.1.1, VS8.4.3 |

**Format:** `{CategoryPrefix}.{Subsection}.{TestNumber}`

## Subsection Structure (Critical)

Tests MUST be organized into subsections of 3-7 tests each for batch execution:

```
Category 1: Visual Appearance (41 tests)
├── V1.1.x - Default State Rendering (5 tests)
├── V1.2.x - Filtered State Rendering (5 tests)
├── V1.3.x - Highlighted State Rendering (4 tests)
├── V1.4.x - Sorted State Rendering (3 tests)
├── V1.5.x - Paginated State Rendering (3 tests)
├── V1.6.x - Panel Collapsed/Expanded State (6 tests)
├── V1.7.x - Pagination Interaction Popped-In (7 tests)
├── V1.8.x - Pagination Interaction Popped-Out (3 tests)
└── V1.9.x - Picker Selection and Apply (5 tests)
```

Each subsection is committed independently after verification.

## Screenshot Naming Convention

Screenshots MUST be prefixed with the test ID:

```
{TestID}-{descriptive-name}.png
```

**Examples:**
- `V1.1.1-results-table-default.png`
- `U2.1.3-bodyclass-pickup.png`
- `P4.2.1-popout-sync-filter.png`
- `VS8.4.1-results-table-popout-standalone.png`
- `VS8.4.1-results-table-popout-with-main.png` (second screenshot for same test)

## Panel Visibility Requirements

Each test MUST specify which panels should be **expanded** vs **collapsed**:

| Panel | When to Expand |
|-------|----------------|
| Query Control | Filter/highlight state indication (shows chips) |
| Query Panel | Filter input tests |
| Manufacturer-Model Picker | Picker selection tests |
| Statistics | Highlight visualization, chart tests |
| Results Table | Sort, pagination, default data tests |

**Example test entry:**
```markdown
| V1.3.1 | Statistics highlight Tesla | ?h_manufacturer=Tesla | Query Control: ✓, Statistics: ✓, Others: collapsed |
```

## Test Categories

### Category 1: Visual Appearance (V1.x.x)
Component renders correctly in default and various states.
- Default state rendering
- Filtered state rendering
- Highlighted state rendering
- Sorted state rendering
- Paginated state rendering
- Panel collapsed/expanded states
- Picker pagination and selection

### Category 2: URL-First Conformity (U2.x.x)
Component state reflects URL parameters; user interactions update URL.
- URL to State: Load URL with params, verify UI state
- State to URL: Interact with UI, verify URL updates
- Combined filters: Multiple params applied together

### Category 3: URL Change Consistency (U3.x.x)
Browser back/forward navigation and manual URL edits restore correct state.
- Browser navigation (back/forward)
- Manual URL bar edits
- URL sharing (copy/paste to new tab)

### Category 4: Pop-Out Behavior (P4.x.x)
Component functions correctly when popped out to separate window.
- Pop-out window rendering
- Pop-out synchronization with main window
- Pop-out API behavior (no own URL updates, no own API calls)
- Multiple pop-outs
- Pop-out with URL parameters

### Category 5: Cross-Window Synchronization (S5.x.x)
Bidirectional communication between windows via BroadcastChannel.
- Main window to pop-out
- Pop-out to main window
- BroadcastChannel verification

### Category 6: Router Navigate Encapsulation (R6.x)
Code-level compliance checks (no screenshots required).
- `router.navigate` only in UrlStateService
- Components use service methods, not direct navigation

### Category 7: Error Handling (E7.x)
Graceful handling of invalid inputs.
- Invalid manufacturer
- Invalid year (future, negative)
- Invalid page number
- Invalid sort field
- XSS attempts in search

### Category 8: Visual Verification (VS8.x.x)
Screenshot-based visual testing for documentation.
- Default state screenshots
- Filtered state screenshots
- Highlighted state screenshots
- Pop-out screenshots (standalone + with-main)

## Data Requirements

Use real data values from `~/projects/vvroom/test-data/`:

| Data Type | Values |
|-----------|--------|
| Manufacturers | Ford, Chevrolet, Tesla, Dodge, Jeep, GMC, Buick |
| Body Classes | Sedan, SUV, Pickup, Coupe, Van, Hatchback |
| Year Range | 1908-2024 |
| Sort Params | `sortBy`/`sortOrder` (NOT `sort`/`sortDirection`) |

## Output Structure

### test-rubric.md

```markdown
# Test Rubric

## Category 1: Visual Appearance Tests

### 1.1 Default State Rendering

| Test ID | Description | URL | Panel Visibility | Screenshot |
|---------|-------------|-----|------------------|------------|
| V1.1.1 | Results table default | /discover | RT: ✓ | V1.1.1-results-table-default.png |
| V1.1.2 | Filter panel default | /discover | QP: ✓ | V1.1.2-filter-panel-default.png |
...

### 1.2 Filtered State Rendering
...
```

### test-checklist.md

```markdown
# Test Execution Checklist

## Category 1: Visual Appearance Tests

### 1.1 Default State Rendering (5 tests)

| Done | Test ID | Screenshot | Commit |
|------|---------|------------|--------|
| [ ] | V1.1.1 | | |
| [ ] | V1.1.2 | | |
...

**Subsection verification:** `ls e2e/screenshots/V1.1.* | wc -l` should equal 5
```

### panel-visibility-reference.md

```markdown
# Panel Visibility Reference

| Test ID | QC | QP | Picker | Stats | RT |
|---------|----|----|--------|-------|-----|
| V1.1.1 | - | - | - | - | ✓ |
| V1.3.1 | ✓ | - | - | ✓ | - |
...

Legend: ✓ = Expanded, - = Collapsed
```

## Verification Commands

Include verification commands after each subsection in test-rubric.md:

```bash
# After V1.1.x
ls e2e/screenshots/V1.1.* | wc -l  # Should equal 5

# After Category 1 complete
ls e2e/screenshots/V1.* | wc -l  # Should equal 41
```

## Final Checklist

Before completing, verify:
- [ ] All test IDs are unique
- [ ] All test IDs follow naming convention
- [ ] All subsections have 3-7 tests
- [ ] All tests specify panel visibility
- [ ] All screenshot names include test ID prefix
- [ ] Verification commands included for each subsection
- [ ] Total test count matches across all output files
