# Appendix A02: URL-First Testing Rubric

## Overview

This rubric provides a systematic method for verifying URL-First State Management compliance across popped-in and popped-out controls. The URL is the single source of truth; all state changes must flow through URL updates.

---

## Test Categories

### Category 1: Main Window (Popped-In) Control Changes

Test that changes in the main window controls are reflected in:
- The browser URL parameters
- All other controls in the main window
- Any open pop-out windows

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| M1.1 | Change a query control filter (e.g., manufacturer dropdown) | URL updates with filter param; results table updates; statistics update | |
| M1.2 | Change a highlight filter (e.g., year range) | URL updates with `h_` prefixed param; highlighted rows change; pop-outs receive update | |
| M1.3 | Change pagination (page number) | URL updates with `page` param; table shows correct page | |
| M1.4 | Change page size | URL updates with `size` param; table row count matches | |
| M1.5 | Change sort column | URL updates with `sort` param; table re-sorts | |
| M1.6 | Change sort direction | URL updates with `sortDirection` param; table order reverses | |
| M1.7 | Clear all filters | URL params removed; controls reset to defaults; full dataset shown | |
| M1.8 | Apply multiple filters simultaneously | All filter params appear in URL; results reflect intersection | |

---

### Category 2: Pop-Out Window Control Changes

Test that changes in pop-out windows are communicated to the main window and reflected appropriately.

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| P2.1 | Change highlight filter in pop-out | Main window URL updates with `h_` param; main window highlights update | |
| P2.2 | Pop-out sends filter change message | BroadcastChannel message received by main window | |
| P2.3 | Pop-out does NOT update its own URL | Pop-out URL remains static (initial state only) | |
| P2.4 | Pop-out does NOT make its own API calls | Network tab shows no API requests from pop-out after initial load | |
| P2.5 | Pop-out receives state via BroadcastChannel | `syncStateFromExternal()` called; no API fetch triggered | |
| P2.6 | Multiple pop-outs stay synchronized | Change in one pop-out reflects in main window and all other pop-outs | |

---

### Category 3: URL Paste Tests (Without Highlight Filters)

Test that pasting a URL with standard filters correctly restores application state.

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| U3.1 | Paste URL with single filter param | Filter control shows correct value; results match filter | |
| U3.2 | Paste URL with multiple filter params | All filter controls populated; results show intersection | |
| U3.3 | Paste URL with pagination params | Correct page displayed; pagination control shows correct page | |
| U3.4 | Paste URL with sort params | Table sorted correctly; sort indicators match URL | |
| U3.5 | Paste URL with all param types combined | All controls reflect URL state; results correct | |
| U3.6 | Paste URL with invalid filter value | Graceful handling; invalid param ignored or defaulted | |
| U3.7 | Share URL to another browser/session | New session shows identical state to original | |

---

### Category 4: URL Paste Tests (With Highlight Filters)

Test that pasting a URL with highlight filters (`h_` prefix) correctly applies highlighting.

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| H4.1 | Paste URL with `h_yearMin` param | Year highlight filter populated; matching rows highlighted | |
| H4.2 | Paste URL with `h_manufacturer` param | Manufacturer highlight populated; matching rows highlighted | |
| H4.3 | Paste URL with multiple highlight params | All highlight filters populated; rows matching ALL highlighted | |
| H4.4 | Paste URL mixing query and highlight params | Query filters filter data; highlight filters highlight within results | |
| H4.5 | Paste URL with highlight param into pop-out | Pop-out shows initial highlights; syncs with main window | |
| H4.6 | Clear highlight via URL (remove `h_` param) | Highlights removed; highlight controls cleared | |

---

### Category 5: Pop-Out Window Presentation

Test that pop-out windows display correctly without main window chrome.

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| W5.1 | Pop-out hides site banner/header | No navigation header visible in pop-out | |
| W5.2 | Pop-out shows query control panel | Filter controls visible and functional | |
| W5.3 | Pop-out URL contains `popout=true` param | URL includes pop-out indicator | |
| W5.4 | Pop-out title reflects content | Window title indicates popped-out component | |
| W5.5 | Pop-out respects `autoFetch = false` | No initial API call; waits for main window data | |

---

### Category 6: Cross-Window Synchronization

Test bidirectional communication between main window and pop-outs.

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| S6.1 | Main window filter change updates all pop-outs | All pop-outs receive BroadcastChannel message and update | |
| S6.2 | Pop-out filter change updates main window URL | Main window URL reflects pop-out's requested change | |
| S6.3 | Main window data refresh updates pop-outs | New API data propagated to all pop-outs | |
| S6.4 | Close pop-out does not affect main window state | Main window continues functioning normally | |
| S6.5 | Open multiple pop-outs of same type | Each pop-out shows consistent state | |
| S6.6 | Open pop-outs of different types | Each receives relevant state updates | |

---

### Category 7: Router Navigate Encapsulation

Verify that `router.navigate()` is only called from `UrlStateService`.

| Test ID | Test Description | Expected Behavior | Pass/Fail |
|---------|-----------------|-------------------|-----------|
| R7.1 | Grep codebase for `router.navigate` | Only appears in `url-state.service.ts` | |
| R7.2 | Components call `updateFilters()` method | Components never call `router.navigate()` directly | |
| R7.3 | Pop-out components call parent messaging | No `router.navigate()` in pop-out components | |

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

---

## Test Execution Checklist

Before running tests:
- [ ] Development server running on port 4207
- [ ] Browser DevTools Network tab open (to verify API calls)
- [ ] Browser DevTools Console open (to catch errors)
- [ ] At least one pop-out window open for cross-window tests

After each test:
- [ ] Verify URL params match expected state
- [ ] Verify all controls reflect URL state
- [ ] Verify pop-out windows synchronized (if applicable)
- [ ] Check console for errors

---

## Known Issues (Observed)

The following issues were observed during initial inspection and should be addressed:

1. **Pop-out URL incorrect** - Pop-out window URL does not reflect expected state
2. **Pop-out shows site banner** - Header/navigation visible in pop-out (should be hidden)
3. **Query control not visible in pop-out** - Filter panel missing from pop-out view

---

## References

- [instructions.md](../instructions.md) - URL-First Compliance Checklist
- [A01-styling-and-branding.md](A01-styling-and-branding.md) - Theme configuration
- `~/projects/vroom/docs/STATE-MANAGEMENT-SPECIFICATION.md` - Complete specification
- `~/projects/vroom/docs/POPOUT-ARCHITECTURE.md` - Cross-window communication
