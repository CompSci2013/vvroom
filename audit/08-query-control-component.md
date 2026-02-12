# Audit: QueryControlComponent Comparison

**Date**: 2026-02-11
**vvroom Version**: NgModule pattern (973 lines)
**golden-extension Version**: Standalone pattern (1224 lines)

---

## Overview

The QueryControlComponent provides manual filter management with field selection dropdown, multiselect/range dialogs, filter chips, and URL synchronization.

---

## Comparison Table

| Aspect | vvroom | golden-extension | Design Spec | Status |
|--------|--------|------------------|-------------|--------|
| **Module Pattern** | NgModule declared | Standalone component | N/A | OK |
| **FilterOptionsService** | Uses ApiService directly | Uses FilterOptionsService (caching) | URL-First compliance | **MISSING** |
| **Pop-out Message Sending** | Emits events to parent | Sends messages directly via PopOutContextService | Self-contained | **DIVERGENCE** |
| **Domain Config Fallback** | Requires @Input | Falls back to domainRegistry.getActive() | More flexible | **MISSING** |
| **Keyboard Navigation** | Basic (Enter, Space) | Full WAI-ARIA Listbox (Arrow, Home, End) | Accessibility | **MISSING** |
| **Filter Options Cache Sync** | Not implemented | Syncs filterOptionsCache from STATE_UPDATE | URL-First | **MISSING** |
| **Focus Management** | focusedOptionIndex not used | Full focus tracking | Accessibility | **MISSING** |

---

## Detailed Analysis

### 1. FilterOptionsService vs. Direct API Calls

**vvroom**:
```typescript
// Load options directly from API - no caching
if (filterDef.optionsEndpoint) {
  this.apiService.get(filterDef.optionsEndpoint).subscribe({
    next: (response) => {
      this.allOptions = filterDef.optionsTransformer?.(response) || [];
      // ...
    }
  });
}
```

**golden-extension**:
```typescript
// Uses FilterOptionsService for URL-First compliance
// In main window: fetches and caches
// In popout: uses cached options from STATE_UPDATE broadcast
this.filterOptionsService.getOptions(
  filterDef.optionsEndpoint,
  String(filterDef.field),
  filterDef.optionsTransformer
).subscribe({
  next: (options) => {
    this.allOptions = options;
    // ...
  }
});
```

**Analysis**: golden-extension uses `FilterOptionsService` which:
- Caches API responses by field
- Provides cached options to pop-out windows via STATE_UPDATE
- Avoids duplicate API calls

vvroom makes direct API calls without caching, and pop-outs would need to make their own API calls.

---

### 2. Pop-out Message Sending

**vvroom** (emits events to parent):
```typescript
// Relies on parent to forward messages
@Output() urlParamsChange = new EventEmitter<{ [key: string]: any }>();
@Output() clearAllFilters = new EventEmitter<void>();

applyFilter(): void {
  this.urlParamsChange.emit({
    [paramName]: paramValue,
    page: 1
  });
}
```

**golden-extension** (sends messages directly):
```typescript
// Helper method handles both main window and popout modes
private emitUrlParamsChange(params: { [key: string]: any }): void {
  if (this.popOutContext.isInPopOut()) {
    this.popOutContext.sendMessage({
      type: PopOutMessageType.URL_PARAMS_CHANGED,
      payload: { params },
      timestamp: Date.now()
    });
  } else {
    this.urlParamsChange.emit(params);
  }
}
```

**Analysis**: golden-extension's QueryControlComponent is self-contained - it can work in both main window and pop-out contexts without parent forwarding. vvroom requires the parent (PanelPopoutComponent) to intercept events and forward them.

---

### 3. Filter Options Cache Sync for Pop-outs

**vvroom**: Does not sync filter options cache.

**golden-extension**:
```typescript
ngOnInit(): void {
  if (this.popOutContext.isInPopOut()) {
    this.popOutContext
      .getMessages$()
      .pipe(
        filter(msg => msg.type === PopOutMessageType.STATE_UPDATE),
        takeUntil(this.destroy$)
      )
      .subscribe((message: any) => {
        if (message.payload) {
          // Sync filter options cache from main window (URL-First compliance)
          if (message.payload.filterOptionsCache) {
            this.filterOptionsService.syncFromExternal(message.payload.filterOptionsCache);
          }
          // Extract filters from the state object
          if (message.payload.state) {
            this.syncFiltersFromPopoutState(message.payload.state);
          }
        }
      });
  }
}
```

**Analysis**: golden-extension syncs the filter options cache from main window to pop-out. This ensures dropdown options are available without making additional API calls in the pop-out.

---

### 4. WAI-ARIA Keyboard Navigation

**vvroom**: Has basic keyboard handling for dropdown (Enter/Space/Arrow detection).

**golden-extension**: Implements full WAI-ARIA Listbox pattern:
```typescript
// Keyboard navigation state
focusedOptionIndex = -1;

onOptionsKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      this.moveFocus(1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      this.moveFocus(-1);
      break;
    case 'Home':
      event.preventDefault();
      this.focusedOptionIndex = 0;
      this.scrollFocusedOptionIntoView();
      break;
    case 'End':
      event.preventDefault();
      this.focusedOptionIndex = this.filteredOptions.length - 1;
      this.scrollFocusedOptionIntoView();
      break;
    case ' ':
      event.preventDefault();
      this.toggleFocusedOption();
      break;
    case 'Enter':
      event.preventDefault();
      if (this.selectedOptions.length > 0) {
        this.applyFilter();
      }
      break;
  }
}
```

**Analysis**: golden-extension provides full accessibility support for the multiselect dialog with:
- Arrow key navigation
- Home/End to jump to first/last
- Space to toggle selection
- Focus tracking with visual indicator
- Scroll-into-view behavior

---

### 5. Common Bug Fixes

Both implementations include the same bug fixes:

| Bug ID | Description | Both Have |
|--------|-------------|-----------|
| BUG-001 | Enter selects single visible option after filter | ✅ |
| BUG-004 | PrimeNG dropdown clear() for same-option reselection | ✅ |
| BUG-006 | Chip click vs. remove button detection | ✅ |
| Bug #15 | Filtered dropdown label-based option matching | ✅ |

---

### 6. Domain Config Handling

**vvroom**:
```typescript
@Input() domainConfig!: DomainConfig<...>;

ngOnInit(): void {
  // No fallback - domainConfig must be provided
  this.filterFieldOptions = this.domainConfig.queryControlFilters
    .map(f => ({ label: f.label, value: f }));
}
```

**golden-extension**:
```typescript
@Input() domainConfig!: DomainConfig<...>;

constructor(
  private readonly domainRegistry: DomainConfigRegistry
) {}

ngOnInit(): void {
  // Fallback to registry if @Input not provided
  if (!this.domainConfig) {
    this.domainConfig = this.domainRegistry.getActive();
  }
  // ...
}
```

---

## URL-First Compliance

| Requirement | Compliance | Notes |
|-------------|------------|-------|
| State from URL in main window | ✅ PASS | `urlState.params$.subscribe()` |
| State from BroadcastChannel in pop-out | ✅ PASS | STATE_UPDATE → syncFiltersFromPopoutState |
| Filter changes update URL | ✅ PASS | urlParamsChange.emit() |
| Filter options cached for pop-outs | ❌ FAIL | vvroom doesn't use FilterOptionsService |
| Pop-out sends messages to main | ⚠️ PARTIAL | vvroom relies on parent forwarding |

---

## Issues Found

### Critical
None

### Medium
1. **No FilterOptionsService**: Pop-outs may make duplicate API calls for filter options.
2. **No filter options cache sync**: Pop-outs don't receive cached options from main window.
3. **Event forwarding required**: Pop-out QueryControl relies on parent to send messages.

### Low
1. **No domainRegistry fallback**: Requires @Input in all contexts.
2. **Limited accessibility**: Missing full WAI-ARIA keyboard navigation.

---

## Recommendations

1. **Add FilterOptionsService**:
   - Create service for caching filter options
   - Use in QueryControlComponent instead of direct ApiService
   - Sync cache to pop-outs via STATE_UPDATE

2. **Add direct pop-out messaging**:
```typescript
private emitUrlParamsChange(params: { [key: string]: any }): void {
  if (this.popOutContext.isInPopOut()) {
    this.popOutContext.sendMessage({
      type: PopOutMessageType.URL_PARAMS_CHANGED,
      payload: { params },
      timestamp: Date.now()
    });
  } else {
    this.urlParamsChange.emit(params);
  }
}
```

3. **Add domainRegistry fallback** for pop-out window support.

4. **Add WAI-ARIA keyboard navigation** for accessibility compliance.

---

## Summary

The vvroom QueryControlComponent is **functionally correct** for main window usage. Filter selection, multiselect/range dialogs, chips, and URL synchronization all work properly.

The key gaps are:
1. **FilterOptionsService missing** - Pop-outs may lack filter options
2. **Event forwarding pattern** - Less self-contained than golden-extension
3. **Accessibility features** - WAI-ARIA keyboard navigation incomplete

These primarily affect pop-out window functionality and accessibility.

**Overall Status**: ✅ COMPLIANT (with pop-out improvements needed)
