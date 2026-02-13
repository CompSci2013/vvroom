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
You will then read quality-instructions.md and test-rubric.md

# Textbook Quality Review Journal

## Purpose

This journal tracks the quality review and testing of the vvroom textbook located at `~/projects/vvroom/textbook/`. The review verifies that textbook content accurately describes the implemented application and that code examples produce the expected behavior.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [quality-instructions.md](quality-instructions.md) | Quality verification procedures and Playwright test code |
| [test-rubric.md](test-rubric.md) | Comprehensive test specifications with real data values |
| [../test-data/README.md](../test-data/README.md) | API data structure documentation |

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

2026-02-13_06:50:00
Initialized quality review journal. Established scope: 75 textbook chapters to review against quality-instructions.md test specifications.

2026-02-13_08:57:19
Reset test cycle. Cleared e2e/ directory. Simplified over-engineered Playwright test examples in quality-instructions.md - tests now only perform user actions (click, type, navigate), verify URL changes, and capture screenshots. Added "Playwright Test Philosophy" section. Tests should NOT iterate rows, extract/sort data, monitor network, or re-implement application logic.

2026-02-13_09:00:39
Sanity check of all four quality documents. Removed duplicate sections from quality-instructions.md (Anti-Pattern Checklist, Test Execution Commands, Required Data Attributes were duplicated). Updated kickoff-prompt.md to include: test philosophy (headless only, click/type/navigate/verify URL/screenshot), what tests should NOT do, and three test artifacts (URL assertion, screenshot, journal entry). All documents now mutually consistent.

2026-02-13_09:30:25
CRITICAL PROCEDURAL UPDATE: Added mandatory screenshot verification requirement to all four quality documents.

Key changes:
- kickoff-prompt.md: Added "IMPORTANT: Screenshot Verification is Mandatory" section. Test workflow now requires using Read tool to inspect screenshot images before declaring pass/fail.
- quality-instructions.md: Added "Screenshot Verification Requirement" section explaining that Playwright "passing" only means code ran without errors, NOT that visual output is correct.
- test-rubric.md: Added "Screenshot Verification (MANDATORY)" section with verification checklist. Updated 1.3 Highlighted State tests to specify Query Control must be expanded (shows active highlights chip), not just Statistics.
- Highlight tests (V1.3.x) now correctly specify: Keep Query Control + Statistics expanded, collapse Query Panel + Manufacturer-Model Picker + Results Table.

This addresses the issue where tests were reported as passing without verifying the screenshot content matched the test criteria.

2026-02-13_09:48:47
Test V1.1.1 - Results table default render: PASS
Screenshot: results-table-default.png
Verified: URL bar shows /discover, Results Table expanded with 20 data rows visible (Manufacturer, Model, Year, Body columns),
pagination shows "Showing 1 to 20 of 4887 results" with page numbers 1-5 and page size selector showing "20".
Query Control, Query Panel, Manufacturer-Model Picker, and Statistics panels all collapsed (showing ">" chevron).
Fixed test to collapse panels per panel-visibility-reference.md specification.

