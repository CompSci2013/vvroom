# vvroom Build Process: Textbook-Driven Implementation from generic-prime

## Background

- **vroom** attempted to build golden-extension from scratch via a textbook approach, but the better reference is **generic-prime** (branch `angular/13`)
- **vvroom** is the second attempt, using a different method: copy code directly from generic-prime instead of writing from scratch
- The application must follow the **URL-First State Management** paradigm documented in `~/projects/vroom/docs/`

### Methodology Shift

The original vroom approach (see `~/projects/vroom/plan/000-book-conventions.md`) prescribed:
1. Write code from scratch in vroom project
2. Verify it compiles
3. Extract to manuscript
4. Delete code, re-apply from manuscript
5. Verify again

This proved error-prone. The new vvroom approach inverts the process:
1. Copy working code from generic-prime
2. Adapt textbook to match the actual implementation
3. Verify both align

This ensures the textbook accurately reflects production-quality code.

## Prerequisites

- vvroom directory structure already exists (40 directories)
- Reference codebase: `~/projects/generic-prime` (checkout `angular/13` branch)
- Textbook source: `~/projects/vroom/plan/`
- Development server port: **4207** (`npm run dev:server`)
- Playwright testing port: **4228** (screenshot capture only)

## Process

For each textbook page, execute the following steps in order:

1. **Read Source Page**
   - Read the next page from `~/projects/vroom/plan/`
   - Identify all code files referenced in the page

2. **Write Textbook Page**
   - Copy/adapt the page content to `~/projects/vvroom/textbook/`
   - Update any file paths or references to reflect vvroom structure

3. **Copy Implementation Files**
   - For each code file referenced in the textbook page:
     - Locate the corresponding file in `~/projects/generic-prime`
     - Copy it to the appropriate location in `~/projects/vvroom/src/`

4. **Proofread & Reconcile**
   - Compare the textbook page against the copied code
   - Verify code snippets in the textbook match the actual implementation
   - Correct any discrepancies (update textbook or code as needed)
   - Ensure adherence to URL-First State Management principles

5. **Build & Test**
   - The application on port 4207 during development
   - Run the application on port 4228 for playwright testing
   - Fix any build errors
   - Repeat until the build succeeds

6. **Capture Screenshots**
   - Use Playwright (port 4228) to capture screenshots of all components implemented or modified in this page
   - Save screenshots to `~/projects/vvroom/e2e/screenshots/`

7. **Log & Proceed**
   - Record the action in `journal.md`
   - Return to step 1 for the next page

## URL-First Compliance Checklist

**At each step, verify the implementation adheres to URL-First State Management:**

### Core Principle
```
User Action → URL Update → State Service → Components Re-render
```
**The URL is NEVER bypassed.** Components never modify state directly—they request URL updates that trigger the state pipeline.

### Mandatory Checks

1. **URL as Single Source of Truth**
   - [ ] All filter state is stored in URL query parameters
   - [ ] Highlight filters use `h_*` prefix (e.g., `h_yearMin`, `h_manufacturer`)
   - [ ] Pagination state (`page`, `size`) is in the URL
   - [ ] Sort state (`sort`, `sortDirection`) is in the URL

2. **router.navigate() Encapsulation**
   - [ ] Only `UrlStateService` calls `router.navigate()`
   - [ ] Components NEVER call `router.navigate()` directly
   - [ ] Grep codebase: `router\.navigate` should only appear in `url-state.service.ts`

3. **State Flow Direction**
   - [ ] URL changes trigger `ResourceManagementService.watchUrlChanges()`
   - [ ] `filterMapper.fromUrlParams()` parses URL → Filters
   - [ ] `apiAdapter.fetchData()` fetches data based on filters
   - [ ] Components subscribe to observables (`filters$`, `results$`, `loading$`)
   - [ ] Components call `updateFilters(partial)` which updates URL (not state directly)

4. **Adapter Pattern Implementation**
   - [ ] `IFilterUrlMapper<TFilters>` - bidirectional URL ↔ Filter serialization
   - [ ] `IApiAdapter<TFilters, TData, TStatistics>` - API communication
   - [ ] `ICacheKeyBuilder<TFilters>` - deterministic cache key generation

5. **Pop-Out Window Compliance** (when implementing pop-outs)
   - [ ] Pop-outs receive state via BroadcastChannel, NOT via API calls
   - [ ] Pop-outs call `syncStateFromExternal()` (no URL update)
   - [ ] Pop-outs send messages to main window for filter changes
   - [ ] Main window is the ONLY window that updates URLs
   - [ ] Pop-outs have `autoFetch = false`

### Anti-Patterns to Reject

- ❌ Direct state mutation (bypassing URL)
- ❌ `router.navigate()` in components
- ❌ State that should be shareable but isn't in URL
- ❌ Pop-outs making their own API calls
- ❌ Pop-outs updating their own URLs (except for initial highlights)

### Reference Documents

| Document | Location | Purpose |
|----------|----------|---------|
| URL-First Overview | `docs/README.md` | Core principles and benefits |
| State Management Spec | `docs/STATE-MANAGEMENT-SPECIFICATION.md` | Complete 1800-line specification |
| Architecture Overview | `docs/ARCHITECTURE-OVERVIEW.md` | Service hierarchy and data flow |
| Pop-Out Architecture | `docs/POPOUT-ARCHITECTURE.md` | Cross-window communication |
| Implementation Audit | `docs/URL-FIRST-AS-IMPLEMENTED.md` | Compliance verification example |

---

## Success Criteria

- [ ] All textbook pages copied and corrected in `~/projects/vvroom/textbook/`
- [ ] All corresponding code copied from generic-prime to vvroom
- [ ] Application builds without errors on port 4228
- [ ] Screenshots captured for all implemented components
- [ ] URL-First State Management paradigm maintained throughout
- [ ] URL-First Compliance Checklist passes for each phase

## Restest

vvroom services should match golden-extension ~/projects/golden-extension/frontend/src/framework/services, especially for the popout* services.

Doing so may resolve some of your recommendations.

```
Recommended Improvements (not blocking):

High: Add FilterOptionsService for cached filter options in pop-outs
High: Add Toast component to AppComponent for error notifications
Medium: Implement lazy loading to reduce 5.63 MB bundle
Medium: Add 404 route for unmatched paths
Low: Extract PopOutManagerService from DiscoverComponent
```

Apply all of the recommend Improvements listed above.

Run vvroom/textbook/A02-url-first-testing-rubric.md again. After each successful test
as proved by playwright screenshots, commit the work and push to all remote repositories.

## IMPORTANT

This application must remain Pure Angular version 13. Strike out any Recommended Improvements that
require features from Angular 14 or above.

Run the ENTIRE test suite again until completion with no test failures. Capturing playwright screenshots, commiting, pushing to all remotes.
Repeat until all tests pass.

**Remember:**
- Run the ENTIRE test suite again until completion with no test failures. 
- Capture playwright screenshots, 
- Commit all files in vvroom
- Push to all remotes.
- Repeat until all tests pass.