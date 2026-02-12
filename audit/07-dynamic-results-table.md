# Audit: DynamicResultsTableComponent Comparison

**Date**: 2026-02-11
**vvroom Version**: NgModule pattern, fixed to use Observable streams
**golden-extension Version**: Standalone pattern

---

## Overview

The DynamicResultsTableComponent displays paginated, sortable results with drag-drop column reordering and resizable column widths. Uses PrimeNG Table.

---

## Comparison Table

| Aspect | vvroom | golden-extension | Design Spec | Status |
|--------|--------|------------------|-------------|--------|
| **Module Pattern** | NgModule declared | Standalone component | N/A | OK |
| **Observable Streams** | results$, loading$, totalResults$ via async pipe | Same | Required for OnPush | OK |
| **Pop-out Support** | STATE_UPDATE handling | Same | Required | OK |
| **Domain Config** | @Input required | Optional with registry fallback | More flexible | **DIVERGENCE** |
| **Column Reordering** | pReorderableColumn | Same | Feature | OK |
| **Column Resizing** | pResizableColumn | Same | Feature | OK |
| **Paginator Width Sync** | syncPaginatorWidth() | Same | Edge case fix | OK |

---

## Detailed Analysis

### 1. Observable Stream Usage (Previously Fixed Bug)

Both now use the same pattern for OnPush change detection:

**Template**:
```html
<p-table
  [value]="(results$ | async) || []"
  [loading]="(loading$ | async) || false"
  [totalRecords]="(totalResults$ | async) || 0"
  ...>
```

**Component**:
```typescript
get results$(): Observable<TData[]> {
  return this.resourceService.results$;
}

get loading$(): Observable<boolean> {
  return this.resourceService.loading$;
}

get totalResults$(): Observable<number> {
  return this.resourceService.totalResults$;
}
```

**Analysis**: This was the bug fixed earlier in the session. vvroom originally used synchronous getters (`get results()`), which didn't trigger change detection. Now both implementations correctly use Observable streams with async pipe.

---

### 2. Domain Config Handling

**vvroom**:
```typescript
@Input() domainConfig!: DomainConfig<TFilters, TData, TStatistics>;

ngOnInit(): void {
  if (!this.domainConfig) {
    throw new Error('DynamicResultsTableComponent requires domainConfig input');
  }
  this.columns = [...this.domainConfig.tableConfig.columns];
}
```

**golden-extension**:
```typescript
@Input() domainConfig!: DomainConfig<TFilters, TData, TStatistics>;

constructor(
  private readonly domainRegistry: DomainConfigRegistry
) {}

ngOnInit(): void {
  // If domainConfig not provided via @Input (e.g., in popout), get from registry
  if (!this.domainConfig) {
    this.domainConfig = this.domainRegistry.getActive();
  }
  this.columns = [...this.domainConfig.tableConfig.columns];
}
```

**Analysis**: golden-extension has a fallback to `domainRegistry.getActive()` when no @Input is provided. This is useful for pop-out windows where the parent component may not pass down the config.

---

### 3. Pop-out Support

Both implement the same pattern:

```typescript
ngOnInit(): void {
  if (this.popOutContext.isInPopOut()) {
    this.popOutContext
      .getMessages$()
      .pipe(
        filter(msg => msg.type === PopOutMessageType.STATE_UPDATE),
        takeUntil(this.destroy$)
      )
      .subscribe(message => {
        if (message.payload && message.payload.state) {
          this.resourceService.syncStateFromExternal(message.payload.state);
          this.cdr.markForCheck();
        }
      });
  }
}
```

---

### 4. Event Handling with Pop-out Awareness

Both correctly route events differently based on context:

```typescript
onPageChange(event: any): void {
  const page = event.first / event.rows + 1;
  const size = event.rows;

  if (this.popOutContext.isInPopOut()) {
    // Pop-out: Emit event for parent to forward to main window
    this.urlParamsChange.emit({ page, size });
  } else {
    // Main window: Update filters directly (triggers URL update)
    this.resourceService.updateFilters({ ...currentFilters, page, size });
  }
}
```

---

### 5. Template Features

Both templates implement:
- Reorderable columns (`pReorderableColumn`)
- Resizable columns (`pResizableColumn`, `columnResizeMode="expand"`)
- Sortable columns (`pSortableColumn`)
- Row expansion (`pRowToggler`, `rowexpansion` template)
- Empty message template
- Loading skeleton (`loadingbody` template)
- Current page report

---

## URL-First Compliance

| Requirement | Compliance | Notes |
|-------------|------------|-------|
| Receives state via Observable streams | ✅ PASS | results$, loading$, totalResults$ |
| Pop-out receives state via BroadcastChannel | ✅ PASS | STATE_UPDATE → syncStateFromExternal |
| Main window updates filters via service | ✅ PASS | resourceService.updateFilters() |
| Pop-out emits events for main window | ✅ PASS | urlParamsChange.emit() |
| OnPush change detection compatible | ✅ PASS | async pipe with Observables |

---

## Issues Found

### Critical
None

### Medium
None

### Low
1. **No domainRegistry fallback**: vvroom throws error if @Input not provided, golden-extension falls back to registry.

---

## Recommendations

1. **Add domainRegistry fallback**:
```typescript
constructor(
  private readonly domainRegistry: DomainConfigRegistry
) {}

ngOnInit(): void {
  if (!this.domainConfig) {
    this.domainConfig = this.domainRegistry.getActive();
  }
  // ...
}
```

---

## Summary

The vvroom DynamicResultsTableComponent is **functionally correct** and matches golden-extension after the Observable streams fix was applied. Both correctly:
- Use Observable streams with async pipe for OnPush change detection
- Handle pop-out state synchronization
- Route events appropriately (main window vs. pop-out)
- Provide full table features (sorting, pagination, column manipulation)

The minor difference is the domainRegistry fallback which golden-extension provides for pop-out window support.

**Overall Status**: ✅ COMPLIANT
