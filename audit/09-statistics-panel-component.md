# Audit: StatisticsPanel2Component Comparison

**Date**: 2026-02-11
**vvroom Version**: NgModule pattern (190 lines)
**golden-extension Version**: Standalone pattern (231 lines)

---

## Overview

The StatisticsPanel2Component renders statistical charts in a CDK drag-drop grid layout. Charts display data from the statistics object in ResourceManagementService.

---

## Comparison Table

| Aspect | vvroom | golden-extension | Design Spec | Status |
|--------|--------|------------------|-------------|--------|
| **Module Pattern** | NgModule declared | Standalone component | N/A | OK |
| **State Access** | Synchronous getters (`statistics`, `highlights`) | Observable streams (`statistics$`, `highlights$`) | Observable preferred | **DIVERGENCE** |
| **Domain Config Fallback** | Requires @Input | Falls back to domainRegistry.getActive() | More flexible | **MISSING** |
| **Chart ID Subset** | Not supported | `@Input() chartIds?: string[]` | More flexible | **MISSING** |
| **Pop-out Chart ID Mapping** | Not implemented | `getChartIdsForStatisticsPanel()` | Pop-out support | **MISSING** |
| **Pop-out URL Updates** | Direct via PopOutContextService | Same | URL-First | OK |
| **Drag-drop Reorder** | CDK moveItemInArray | Same | Feature | OK |

---

## Detailed Analysis

### 1. State Access Pattern

**vvroom** (synchronous getters):
```typescript
get statistics(): any | undefined {
  return this.resourceService.statistics;
}

get highlights(): any {
  return this.resourceService.highlights;
}
```

**golden-extension** (Observable streams):
```typescript
get statistics$(): Observable<any | undefined> {
  return this.resourceService.statistics$;
}

get highlights$(): Observable<any> {
  return this.resourceService.highlights$;
}
```

**Analysis**: golden-extension uses Observable streams, which is consistent with OnPush change detection. The template would use async pipe:
```html
<app-base-chart [statistics]="statistics$ | async" ...>
```

vvroom uses synchronous getters but subscribes to `statistics$` for change detection triggering, which is a hybrid approach that works but is less elegant.

---

### 2. Chart ID Subset Support

**vvroom**: Displays all charts from domainConfig.chartDataSources.

**golden-extension**:
```typescript
@Input() chartIds?: string[];

ngOnInit(): void {
  // Initialize chart order from chartIds input or domain config
  if (this.chartIds && this.chartIds.length > 0) {
    this.chartOrder = this.chartIds;
  } else if (this.domainConfig.chartDataSources) {
    this.chartOrder = Object.keys(this.domainConfig.chartDataSources);
  }
}
```

**Analysis**: golden-extension supports displaying a subset of charts via `chartIds` input. This is useful for displaying different chart sets in different statistics panels.

---

### 3. Pop-out Chart ID Mapping

**vvroom**: No special handling for pop-out chart selection.

**golden-extension**:
```typescript
ngOnInit(): void {
  if (this.isPopout && this.route) {
    // In popout: extract componentId from URL and map to chart IDs
    // URL structure: /popout/:gridId/:componentId/:type
    const componentId = this.route.parent?.snapshot.paramMap.get('componentId') ?? null;
    this.chartOrder = this.getChartIdsForStatisticsPanel(componentId);
  }
}

private getChartIdsForStatisticsPanel(panelId: string | null): string[] {
  const chartIdMap: { [key: string]: string[] } = {
    'statistics-1': ['manufacturer', 'top-models'],
    'statistics-2': ['body-class', 'year']
  };
  return chartIdMap[panelId] || Object.keys(this.domainConfig.chartDataSources);
}
```

**Analysis**: golden-extension maps statistics panel IDs to specific chart subsets when running in a pop-out window. This allows each statistics panel pop-out to show only its relevant charts.

---

### 4. Domain Config Fallback

**vvroom**:
```typescript
ngOnInit(): void {
  if (!this.domainConfig) {
    console.error('StatisticsPanel2Component: domainConfig is required');
    return;
  }
}
```

**golden-extension**:
```typescript
constructor(
  private readonly domainRegistry: DomainConfigRegistry,
) {}

ngOnInit(): void {
  if (!this.domainConfig) {
    this.domainConfig = this.domainRegistry.getActive();
  }
}
```

---

### 5. Common Functionality

Both implementations correctly handle:

| Feature | Both Have |
|---------|-----------|
| CDK drag-drop reordering | ✅ |
| Chart pop-out events | ✅ |
| Chart click → URL update | ✅ |
| Pop-out detection | ✅ |
| Direct pop-out messaging | ✅ |

---

## URL-First Compliance

| Requirement | Compliance | Notes |
|-------------|------------|-------|
| Chart click updates URL | ✅ PASS | `urlState.setParams(newParams)` |
| Pop-out sends messages | ✅ PASS | `PopOutMessageType.URL_PARAMS_CHANGED` |
| Statistics from Observable | ⚠️ PARTIAL | vvroom uses sync getter with subscription |

---

## Issues Found

### Critical
None

### Medium
1. **Synchronous getters**: Uses `this.resourceService.statistics` instead of `statistics$` Observable.

### Low
1. **No chartIds input**: Cannot display chart subsets.
2. **No pop-out chart mapping**: Pop-out statistics panels show all charts.
3. **No domainRegistry fallback**: Requires @Input in all contexts.

---

## Recommendations

1. **Use Observable streams**:
```typescript
get statistics$(): Observable<any | undefined> {
  return this.resourceService.statistics$;
}
```

2. **Add chartIds input** for subset display.

3. **Add pop-out chart mapping** for statistics panel pop-outs.

4. **Add domainRegistry fallback** for pop-out support.

---

## Summary

The vvroom StatisticsPanel2Component is **functionally correct** for basic chart grid display. Charts render, drag-drop works, and click events properly update the URL.

The key gaps are:
1. **Synchronous getters** instead of Observable streams
2. **No chart subset support** via chartIds input
3. **No pop-out chart mapping** for panel-specific displays

These primarily affect advanced features and flexibility.

**Overall Status**: ✅ COMPLIANT (with improvements available)
