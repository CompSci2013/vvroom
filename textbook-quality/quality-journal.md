You are to meticulously document each action we take in building this application.
Each entry will contain a timestamp: YYYY-MM-DD_HH:MM:SS where time is the system time of the thor server.
You will always append entries to the bottom of this file: ~/projects/vvroom/textbook-quality/quality-journal.md
Give the timestamp of the entry, and then write the action taken on the next line.
There should be a blank line between entries.
You will add these entries automatically after each action.
After you have recorded the last action taken, you will read the first 11 lines of this file.
Then tail the last 150 lines of this file, quality-journal.md, to remember where you left off.
After each successful test as verified by playwrite screenshot, commit the work, then push to all remote repositories.
Add a blank line, then a time-stamped entry for the test just performed.
You will then read kickoff-prompt.md and test-checklist.md

# Textbook Quality Review Journal

## Purpose

This journal tracks the quality review and testing of the vvroom textbook located at `~/projects/vvroom/textbook/`. The review verifies that textbook content accurately describes the implemented application and that code examples produce the expected behavior.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [kickoff-prompt.md](kickoff-prompt.md) | Main testing workflow and procedures |
| [kickoff-category-X.md](.) | Per-category testing prompts (1-8) |
| [test-checklist.md](test-checklist.md) | Checkbox tracking of all 134 tests |
| [test-rubric.md](test-rubric.md) | Comprehensive test specifications with real data values |
| [panel-visibility-reference.md](panel-visibility-reference.md) | Panel state requirements per test |
| [verify-all-tests.sh](verify-all-tests.sh) | Final coverage verification script |

---

## Review Scope

### Textbook Structure (75 chapters)

| Series | Range | Topic |
|--------|-------|-------|
| 000 | Book conventions | Meta documentation |
| 050s | API contract | Backend interface specification |
| 100s | Project setup | Angular scaffolding, routing, environment |
| 150 | TypeScript primer | Generics fundamentals |
| 200s | Core interfaces | Domain config, filters, pagination, popout |
| 250 | RxJS primer | Reactive patterns |
| 300s | Services | URL state, API, resource management, error handling |
| 400s | Models | Base model, domain data, filter statistics |
| 500s | Adapters | URL mapper, API adapter |
| 600s | Domain config | Filters, tables, pickers, charts, assembly |
| 650s | Chart sources | Manufacturer, year, body class, top models |
| 800s | Components | Charts, pickers, tables, panels, query control |
| 900s | Pages | Home, landing, discover, popout, routing, module |
| 950s | Reference | RxJS operators, TypeScript, debugging, glossary |
| A0x | Appendices | Styling, testing rubric |

### Test Categories (from test-rubric.md)

| Category | Tests | Scope |
|----------|-------|-------|
| 1. Visual Appearance | V1.x | Component rendering in default and various states |
| 2. URL-First Conformity | U2.x | URL to state and state to URL verification |
| 3. URL Change Consistency | U3.x | Browser navigation and manual URL edits |
| 4. Pop-Out Behavior | P4.x | Pop-out rendering and synchronization |
| 5. Cross-Window Synchronization | S5.x | Bidirectional communication |
| 6. Router Navigate Encapsulation | R6.x | Code-level compliance |
| 7. Error Handling | E7.x | Error states and recovery |
| 8. Visual Verification | VS8.x | Screenshot-based visual testing |

### Quality Criteria

Each chapter will be reviewed against:

1. **Code Accuracy**: Does the code compile and run as described?
2. **API Compliance**: Do examples match test-rubric.md test expectations?
3. **URL-First Adherence**: Does the chapter correctly implement URL-first state management?
4. **Data Attributes**: Are required `data-testid` attributes documented?
5. **Cross-References**: Do chapter references point to correct locations?
6. **URL Parameters**: Are `sortBy`/`sortOrder` (not `sort`/`sortDirection`) used correctly?

---

## Review Protocol

For each chapter:
1. Read chapter content
2. Compare code examples against actual implementation in `src/`
3. Verify any Playwright test expectations match `test-rubric.md`
4. Run relevant tests if applicable
5. Document findings with timestamp
6. If issues found, create correction notes

---

## Action Log

2026-02-14_05:29:41
Test V1.1.1 - Results Table default render: PASS
Screenshot: V1.1.1-results-table-default.png
Verified: URL bar shows /discover, Results Table expanded with data rows visible, pagination visible at bottom, other panels collapsed

2026-02-14_05:29:41
Test V1.1.2 - Filter Panel default render: PASS
Screenshot: V1.1.2-filter-panel-default.png
Verified: URL bar shows /discover, Query Panel expanded with all filter controls (Manufacturer, Model, Year Range, Body Class, VIN Count Range, Clear Filters), other panels collapsed, footer visible

2026-02-14_05:29:41
Test V1.1.3 - Pagination default render: PASS
Screenshot: V1.1.3-pagination-default.png
Verified: URL bar shows /discover, Results Table expanded showing pagination controls, data rows visible, other panels collapsed

2026-02-14_05:29:41
Test V1.1.4 - Statistics Panel default render: PASS
Screenshot: V1.1.4-statistics-default.png
Verified: URL bar shows /discover, Statistics expanded showing 4 charts (Vehicles by Manufacturer, Top Models by VIN Count, Vehicles by Body Class, Vehicles by Year), all bars in blue (no highlighting), other panels collapsed

2026-02-14_05:29:41
Test V1.1.5 - Search Input default render: PASS
Screenshot: V1.1.5-search-default.png
Verified: URL bar shows /discover, Query Control expanded showing "Add filter by field..." dropdown and "Clear All" button, other panels collapsed, footer visible

2026-02-14_05:30:41
Test V1.2.1 - Results table filtered by manufacturer (Ford): PASS
Screenshot: V1.2.1-results-table-filtered-ford.png
Verified: URL bar shows ?manufacturer=Ford, Query Control shows "Manufacturer: Ford" chip, 665 results, Statistics shows Ford-only data, footer visible

2026-02-14_05:30:41
Test V1.2.2 - Results table filtered by body class (SUV): PASS
Screenshot: V1.2.2-results-table-filtered-suv.png
Verified: URL bar shows ?bodyClass=SUV, Query Control shows "Body Class: SUV" chip, 998 results, Statistics shows SUV-filtered data

2026-02-14_05:30:41
Test V1.2.3 - Results table filtered by year range (2020-2024): PASS
Screenshot: V1.2.3-results-table-filtered-recent.png
Verified: URL bar shows ?yearMin=2020&yearMax=2024, Query Control shows "Year: 2020 - 2024" chip, 290 results, Statistics shows year-filtered data

2026-02-14_05:30:41
Test V1.2.4 - Statistics filtered by manufacturer (Chevrolet): PASS
Screenshot: V1.2.4-statistics-filtered-chevrolet.png
Verified: URL bar shows ?manufacturer=Chevrolet, Query Control shows "Manufacturer: Chevrolet" chip, Statistics shows Chevrolet-only data in charts

2026-02-14_05:30:41
Test V1.2.5 - Results table with model combinations: PASS
Screenshot: V1.2.5-results-table-model-combos.png
Verified: URL bar shows ?models=Ford:Mustang,Chevrolet:Camaro, Query Control shows model filter active, Statistics shows filtered data

2026-02-14_05:31:37
Test V1.3.1 - Statistics charts highlight Tesla: PASS
Screenshot: V1.3.1-statistics-highlight-tesla.png
Verified: URL bar shows ?h_manufacturer=Tesla, Query Control shows "Highlight Manufacturer: Tesla" chip under "Active Highlights", Statistics shows 4 charts with Other (gray) vs Highlighted (blue) legend, Tesla bars highlighted in blue

2026-02-14_05:31:37
Test V1.3.2 - Statistics charts highlight year range (2015-2020): PASS
Screenshot: V1.3.2-statistics-highlight-years.png
Verified: URL bar shows ?h_yearMin=2015&h_yearMax=2020, Query Control shows "Highlight Year: 2015 - 2020" chip, Statistics shows year range highlighted in blue in charts

2026-02-14_05:31:37
Test V1.3.3 - Statistics charts highlight body class (Pickup): PASS
Screenshot: V1.3.3-statistics-highlight-pickup.png
Verified: URL bar shows ?h_bodyClass=Pickup, Query Control shows "Highlight Body Class: Pickup" chip, Statistics shows Pickup bars highlighted in blue

2026-02-14_05:31:37
Test V1.3.4 - Statistics filter with highlight: PASS
Screenshot: V1.3.4-statistics-filter-with-highlight.png
Verified: URL bar shows ?manufacturer=Ford&h_yearMin=2018, Query Control shows BOTH "Active Filters: Manufacturer: Ford" AND "Active Highlights: Highlight Year: 2018" chips, Statistics shows Ford-only data (665 results) with 2018+ highlighted in blue

2026-02-14_05:36:23
Test V1.4.1 - Results table sorted by year descending: PASS
Screenshot: V1.4.1-results-table-sorted-year-desc.png
Verified: URL bar shows ?sortBy=year&sortOrder=desc, Results Table shows data sorted by year descending (2024 first), sort indicator visible on Year column

2026-02-14_05:36:23
Test V1.4.2 - Results table sorted by manufacturer ascending: PASS
Screenshot: V1.4.2-results-table-sorted-manufacturer-asc.png
Verified: URL bar shows ?sortBy=manufacturer&sortOrder=asc, Results Table shows data sorted alphabetically by manufacturer (Affordable Aluminum first)

2026-02-14_05:36:23
Test V1.4.3 - Results table sorted by instance count descending: PASS
Screenshot: V1.4.3-results-table-sorted-instancecount-desc.png
Verified: URL bar shows ?sortBy=instance_count&sortOrder=desc (note: API uses snake_case), Results Table shows data sorted by VIN count descending

2026-02-14_05:37:25
Test V1.5.1 - Results table page 2 with 10 rows: PASS
Screenshot: V1.5.1-results-table-paginated-page2.png
Verified: URL bar shows ?page=2&size=10, pagination shows "Showing 11 to 20 of 4887 results", page 2 highlighted, 10 rows displayed

2026-02-14_05:37:25
Test V1.5.2 - Pagination control page 5: PASS
Screenshot: V1.5.2-pagination-page5.png
Verified: URL bar shows ?page=5&size=25, Results Table shows page 5 data with 25 rows

2026-02-14_05:37:25
Test V1.5.3 - Results table last page: PASS
Screenshot: V1.5.3-results-table-last-page.png
Verified: URL bar shows ?page=196&size=25, pagination shows last page data "Showing 4876 to 4885 of 4887"

2026-02-14_05:40:21
Test V1.6.1 - Query Control collapsed: PASS
Screenshot: V1.6.1-query-control-collapsed.png
Verified: URL bar shows /discover, Query Control collapsed (header only), Query Panel expanded with filter fields, Picker expanded with data table, footer visible

2026-02-14_05:42:39
Test V1.6.2 - Query Panel collapsed: PASS
Screenshot: V1.6.2-query-panel-collapsed.png
Verified: URL bar shows /discover, Query Control expanded with filter dropdown, Query Panel collapsed (header only), Picker expanded with data table, footer visible

2026-02-14_05:43:21
Test V1.6.3 - Picker collapsed: PASS
Screenshot: V1.6.3-picker-collapsed.png
Verified: URL bar shows /discover, Picker collapsed (header only), Query Control expanded, Query Panel expanded with filter fields, Statistics expanded with 4 charts

2026-02-14_05:44:07
Test V1.6.4 - All panels expanded: PASS
Screenshot: V1.6.4-all-panels-expanded.png
Verified: URL bar shows /discover, all panels expanded - Query Control, Query Panel with filter fields, Picker with data table visible, footer visible

2026-02-14_05:44:47
Test V1.6.5 - All panels collapsed: PASS
Screenshot: V1.6.5-all-panels-collapsed.png
Verified: URL bar shows /discover, all 5 panels collapsed showing only headers (Query Control, Query Panel, Picker, Statistics, Results Table), footer visible

2026-02-14_05:45:34
Test V1.6.6 - Mixed panel state: PASS
Screenshot: V1.6.6-panels-mixed-state.png
Verified: URL bar shows /discover, Query Control expanded, Query Panel collapsed, Picker collapsed, Statistics expanded with 4 charts, Results Table collapsed, footer visible

2026-02-14_05:51:50
Test V1.7.1 - Picker Table click page 2: PASS
Screenshot: V1.7.1-picker-page2.png
Verified: URL bar shows /discover, Picker expanded showing page 2 data (Buick models: Lucerne, Model 10, Model D, etc.), pagination shows page 2 active

2026-02-14_05:59:26
Test V1.7.2 - Picker Table click page 3: PASS
Screenshot: V1.7.2-picker-page3.png
Verified: URL bar shows /discover, Picker expanded showing page 3 data (Cadillac models: ATS, Allante, Armored Vehicle, Brougham, CT4, CT5, CT6, CTS, etc.), pagination shows page 3 active, footer visible

2026-02-14_05:59:26
Test V1.7.3 - Picker Table change rows to 10: PASS
Screenshot: V1.7.3-picker-rows-10.png
Verified: URL bar shows /discover, Picker expanded showing 10 rows (Affordable Aluminum through Buick Century), pagination shows "Showing 1 to 10 of 881 entries", dropdown shows "10" selected, footer visible

2026-02-14_05:59:26
Test V1.7.4 - Picker Table change rows to 50: PASS
Screenshot: V1.7.4-picker-rows-50.png (4 images)
Verified: URL bar shows /discover, Picker expanded showing 50 rows, pagination shows "Showing 1 to 50 of 881 entries", dropdown shows "50" selected, footer visible

2026-02-14_05:59:26
Test V1.7.5 - Picker Table change rows to 100: PASS
Screenshot: V1.7.5-picker-rows-100.png (8 images)
Verified: URL bar shows /discover, Picker expanded showing 100 rows, pagination shows "Showing 1 to 100 of 881 entries", dropdown shows "100" selected, footer visible

2026-02-14_06:00:08
Test V1.7.6 - Results Table navigate via URL page=2: PASS
Screenshot: V1.7.6-results-page2-url.png
Verified: URL bar shows /discover?page=2, Results Table expanded showing page 2 data (Buick Century models from various years), other panels collapsed, footer visible

2026-02-14_06:00:55
Test V1.7.7 - Results Table navigate via URL size=50: PASS
Screenshot: V1.7.7-results-rows-50-url.png (3 images)
Verified: URL bar shows ?size=50, Results Table expanded showing 50 rows (Buick Century models), pagination shows "Showing 1 to 50 of 4887 results", dropdown shows "50" selected, other panels collapsed, footer visible

2026-02-14_06:01:58
Committed V1.7.x subsection: 354eccb
Pushed to github and gitlab remotes

2026-02-14_06:10:42
Test V1.8.1 - Picker Table (pop-out) click page 2: PASS
Screenshots: V1.8.1-picker-popout-page2.png + V1.8.1-picker-popout-main-overlay.png
Verified Pop-out: URL bar shows pop-out URL /panel/discover/manufacturer-model-picker, Picker showing page 2 (Buick Lucerne through Cadillac 60 Special), pagination shows "Showing 21 to 40 of 881 entries", page 2 active, no site header
Verified Overlay: Main window shows placeholder message "Manufacturer-Model Picker is open in a separate window"

2026-02-14_06:21:50
Test V1.8.2 - Picker Table (pop-out) change rows to 50: PASS
Screenshots: V1.8.2-picker-popout-rows-50.png + V1.8.2-picker-popout-main-overlay.png
Verified Pop-out: URL bar shows pop-out URL, Picker showing 50 rows (Affordable Aluminum through Buick Park Avenue visible), no site header
Verified Overlay: Main window shows placeholder message "Manufacturer-Model Picker is open in a separate window"

2026-02-14_06:23:02
Test V1.8.3 - Picker Table (pop-out) change rows to 100: PASS
Screenshots: V1.8.3-picker-popout-rows-100.png + V1.8.3-picker-popout-main-overlay.png
Verified Pop-out: URL bar shows pop-out URL /panel/discover/manufacturer-model-picker, Picker showing 100 rows, no site header
Verified Overlay: Main window shows placeholder message "Manufacturer-Model Picker is open in a separate window"

2026-02-14_06:24:01
Committed V1.8.x subsection: d5a849b
Pushed to github and gitlab remotes

2026-02-14_06:25:07
Test V1.9.1 - Picker (in) select rows before Apply: PASS
Screenshot: V1.9.1-picker-selected-before-apply.png
Verified: URL bar shows /discover, Picker expanded with 2 rows selected (Affordable Aluminum, Best Lane Enterprises - checkmarks visible), Clear/Apply buttons visible, results count still shows 4887 (filter not yet applied), footer visible

2026-02-14_06:26:47
Test V1.9.2 - Picker (in) after Apply clicked: PASS
Screenshot: V1.9.2-picker-after-apply.png
Verified: URL bar shows modelCombos= with selected models, results count shows "2 results" (filter applied), Query Control expanded with Active Filters showing model chips, Statistics expanded with filtered charts, footer visible

2026-02-14_06:27:46
Test V1.9.3 - Picker (out) select rows before Apply: PASS
Screenshot: V1.9.3-picker-popout-selected.png
Verified: URL bar shows pop-out URL /panel/discover/manufacturer-model-picker, 2 rows selected (Affordable Aluminum, Best Lane Enterprises - checkmarks visible), Clear/Apply buttons visible, no site header (pop-out mode), pagination visible

2026-02-14_06:28:31
Test V1.9.4 - Picker (out) after Apply clicked: PASS
Screenshot: V1.9.4-picker-popout-after-apply.png
Verified: URL bar shows modelCombos= with selected models, results count shows "2 results" (filter applied via pop-out), Query Control expanded with Active Filters showing model chips, Statistics expanded with filtered charts, footer visible

2026-02-14_06:29:16
Test V1.9.5 - Picker (in) clear selection: PASS
Screenshot: V1.9.5-picker-cleared.png
Verified: URL bar shows /discover?page=1 (no modelCombos - cleared), results count shows "4887 results" (back to full dataset), Picker expanded with all checkboxes unchecked, Clear/Apply buttons visible, footer visible
